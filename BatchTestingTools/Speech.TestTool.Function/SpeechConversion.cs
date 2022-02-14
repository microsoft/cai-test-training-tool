using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Daimler.Speech.Function.CrisClient;
using Daimler.Speech.Function.Helpers;
using Daimler.Speech.Function.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Daimler.Speech.Function
{
    public static class SpeechConversion
    {
        private static string SubscriptionKey = ConfigurationManager.AppSettings["SpeechSubscriptionKey"];

        private static int SpeechTransactionDelayThreshould = 240;

        private static string HostName = ConfigurationManager.AppSettings["region"] + ".cris.ai";
        private const int Port = 443;

        //name and description
        private const string Description = "Daimler Speech";

        // recordings and locale
        private const string Locale = "de-DE";

        [FunctionName("SpeechConversion")]
        public async static void Run([QueueTrigger("speechtasks", Connection = "")]SpeechTask myQueueItem, TraceWriter log)
        {
            try
            {
                if (int.TryParse(ConfigurationManager.AppSettings["SpeechTransactionDelayThreshold"], out int result))
                {
                    SpeechTransactionDelayThreshould = result;
                }

                BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId, "Queuing Job to Speech Service", null, "6%");
                string StrorageConnectionString = ConfigurationManager.AppSettings["StorageConnectionString"];

                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(StrorageConnectionString);

                Dictionary<string, int> FileRetries = new Dictionary<string, int>();

                List<Guid> ModelsList = new List<Guid>();

                // Create the blob client.
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                // Retrieve reference to a previously created container.
                CloudBlobContainer container = blobClient.GetContainerReference("voices");

                CloudBlobDirectory FilesDirectory = container.GetDirectoryReference(myQueueItem.JobId + "/files");

                List<TranscriptPair> transcriptValues = GetTranscriptValues(container, myQueueItem.JobId, myQueueItem.TranscriptFileName);

                var client = CrisClient.CrisClient.CreateApiV2Client(SubscriptionKey, HostName, Port);

                int skip = 0;

                var toBeDeletedTranscriptions = new List<Transcription>();

                IEnumerable<Transcription> transcriptions = new List<Transcription>();

                transcriptions = await GetAllTransactions(client);

                toBeDeletedTranscriptions = transcriptions.Where(i => i.CreatedDateTime < DateTime.UtcNow.AddDays(-1)).ToList();

                // delete all pre-existing completed transcriptions. If transcriptions are still running or not started, they will not be deleted
                foreach (var item in toBeDeletedTranscriptions)
                {
                    // delete a transcription
                    await client.DeleteTranscriptionAsync(item.Id).ConfigureAwait(false);
                }



                string LanguageModelId = string.Empty;

                string AcousticModelId = string.Empty;

                if (!string.IsNullOrWhiteSpace(myQueueItem.SpeechLanguageModelId))
                {
                    LanguageModelId = myQueueItem.SpeechLanguageModelId;
                    if (Guid.TryParse(LanguageModelId, out Guid results))
                    {
                        ModelsList.Add(results);
                    }
                }

                if (!string.IsNullOrWhiteSpace(myQueueItem.SpeechAcousticModelId))
                {
                    AcousticModelId = myQueueItem.SpeechAcousticModelId;
                    if (Guid.TryParse(AcousticModelId, out Guid results))
                    {
                        ModelsList.Add(results);
                    }
                }


                var createdTranscriptions = new List<Guid>();

                var completedTranscriptions = new List<Guid>();

                // Loop over items within the container and output the content, length and URI.
                foreach (IListBlobItem item in FilesDirectory.ListBlobs())
                {
                    if (item.GetType() == typeof(CloudBlockBlob))
                    {
                        CloudBlockBlob blob = (CloudBlockBlob)item;
                        var blobSAS = blob.GetSharedAccessSignature(new SharedAccessBlobPolicy() { Permissions = SharedAccessBlobPermissions.Read, SharedAccessExpiryTime = DateTimeOffset.Now.AddDays(1) });

                        var blobURL = blob.StorageUri.PrimaryUri.OriginalString + blobSAS;

                        Uri transcriptionLocation;

                        if (ModelsList != null && ModelsList.Count() > 0)
                        {
                            transcriptionLocation = await client.PostTranscriptionAsync(blob.Name.Substring(blob.Name.LastIndexOf('/') + 1), Description + " - " + myQueueItem.JobId, Locale, new Uri(blobURL), ModelsList).ConfigureAwait(false);
                        }
                        else
                        {
                            transcriptionLocation = await client.PostTranscriptionAsync(blob.Name.Substring(blob.Name.LastIndexOf('/') + 1), Description + " - " + myQueueItem.JobId, Locale, new Uri(blobURL)).ConfigureAwait(false);
                        }

                        createdTranscriptions.Add(new Guid(transcriptionLocation.ToString().Split('/').LastOrDefault()));
                    }
                }

                transcriptions = await GetAllTransactions(client);

                BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId, "Receiving recognition results from speech service", null, "10%");

                // check for the status of our transcriptions every 30 sec. (can also be 1, 2, 5 min depending on usage)
                int completed = 0, running = 0, notStarted = 0;
                while (completed < createdTranscriptions.Count())
                {
                    // get all transcriptions for the user
                    transcriptions = await GetAllTransactions(client);

                    log.Info("Service Details (" + myQueueItem.JobId +") : Running = " + transcriptions.Where(i=> i.Description.Contains(myQueueItem.JobId) && i.Status=="Running").Count() +" NotStarted = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "NotStarted").Count() + " Succeeded = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "Succeeded").Count() + " Failed = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "Failed").Count());

                    //completed = 0; running = 0; notStarted = 0;
                    // for each transcription in the list we check the status
                    foreach (var transcription in transcriptions)
                    {
                        switch (transcription.Status)
                        {
                            case "Failed":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Id) || completedTranscriptions.Contains(transcription.Id))
                                {
                                    continue;
                                }

                                log.Info(string.Format("Failed (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));

                                if (FileRetries.TryGetValue(transcription.Name, out int numberOfRetries))
                                {
                                    if (numberOfRetries < 2)
                                    {
                                        FileRetries[transcription.Name] += 1;

                                        log.Info(string.Format("Failed - Retry < 2 (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));
                                    }
                                    else
                                    {
                                        log.Info(string.Format("Failed - Final Failure (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));

                                        completed++;
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.Name);
                                        voiceFile.Status = "SpeechFailed";
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");
                                        completedTranscriptions.Add(transcription.Id);
                                        continue;
                                    }
                                }
                                else
                                {
                                    FileRetries.Add(transcription.Name, 1);


                                }
                                Uri transcriptionLocation;

                                await client.DeleteTranscriptionAsync(transcription.Id).ConfigureAwait(false);

                                createdTranscriptions.Remove(transcription.Id);

                                if (ModelsList != null && ModelsList.Count() > 0)
                                {
                                    log.Info(string.Format("Failed - Add New Speech Job (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));
                                    transcriptionLocation = await client.PostTranscriptionAsync(transcription.Name, Description, Locale, transcription.RecordingsUrl, ModelsList).ConfigureAwait(false);
                                }
                                else
                                {
                                    log.Info(string.Format("Failed - Add New Speech Job (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));
                                    transcriptionLocation = await client.PostTranscriptionAsync(transcription.Name, Description, Locale, transcription.RecordingsUrl).ConfigureAwait(false);
                                }

                                log.Info(string.Format("Failed - After Adding Failed Speech (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name, transcription.Id));
                                createdTranscriptions.Add(new Guid(transcriptionLocation.ToString().Split('/').LastOrDefault()));



                                break;
                            case "Succeeded":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Id) || completedTranscriptions.Contains(transcription.Id))
                                {
                                    // not creted form here, continue
                                    continue;
                                }
                                completed++;

                                log.Info(string.Format("Success (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.Name,transcription.Id));

                                // if the transcription was successfull, check the results
                                if (transcription.Status == "Succeeded")
                                {
                                    try
                                    {
                                        var resultsUri = transcription.ResultsUrls["channel_0"];

                                        WebClient webClient = new WebClient();

                                        var filename = Path.GetTempFileName();
                                        webClient.DownloadFile(resultsUri, filename);

                                        var results = File.ReadAllText(filename);

                                        var customSpeechResult = JsonConvert.DeserializeObject<CustomSpeechResult>(results);

                                        var blobFileName = transcription.Name;
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, blobFileName);

                                        var referenceTranscript = transcriptValues.FirstOrDefault(i => i.FileName == blobFileName);

                                        if (referenceTranscript != null)
                                        {
                                            voiceFile.Transcript = referenceTranscript.Transcript;
                                            if (customSpeechResult.AudioFileResults[0]?.SegmentResults != null && customSpeechResult.AudioFileResults[0]?.SegmentResults.Count > 0)
                                            {
                                                voiceFile.Recognized = customSpeechResult.AudioFileResults[0].SegmentResults[0].NBest[0].Display;
                                                voiceFile.Status = "Recognized";

                                                log.Info("Success - JobId = "+ myQueueItem.JobId +" Recognized " + transcription.Id + " FileName = " + transcription.Name);

                                                await QueueMessageHelper.SaveCustomProcessingTaskAsync(new CustomProcesingTask() { JobId = myQueueItem.JobId, Message = customSpeechResult.AudioFileResults[0].SegmentResults[0].NBest[0].Display, FileName = blobFileName, JobName = myQueueItem.JobName, CPLName = "LPR" });
                                            }
                                            else
                                            {
                                                voiceFile.Status = "NotRecognized";
                                                log.Info("Success - JobId= " + myQueueItem.JobId + " NotRecognized " + transcription.Id + " FileName = " + transcription.Name);
                                            }
                                        }
                                        else
                                        {
                                            voiceFile.Status = "MissingReferenceTrancript";
                                            log.Info("Success - JobId= " + myQueueItem.JobId + " MissingReferenceTrancript " + transcription.Id + " FileName = " + transcription.Name);
                                        }

                                        log.Info("Success - JobId= " + myQueueItem.JobId + " Save File" + transcription.Id + " FileName = " + transcription.Name);
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");

                                    }
                                    catch (Exception ex)
                                    {
                                        log.Error(ex.Message, ex, "Speech Conversaion Function");
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.Name);
                                        voiceFile.Status = "NotRecognized";
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");

                                    }


                                    completedTranscriptions.Add(transcription.Id);
                                }
                                break;

                            case "Running":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Id) || completedTranscriptions.Contains(transcription.Id))
                                {
                                    // not creted form here, continue
                                    continue;
                                }
                                running++;
                                if (await CheckIfTransactionIdDelayed(transcription, completed, completedTranscriptions, myQueueItem, StrorageConnectionString))
                                {
                                    completed++;
                                    continue;
                                }
                                break;

                            case "NotStarted":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Id) || completedTranscriptions.Contains(transcription.Id))
                                {
                                    // not creted form here, continue
                                    continue;
                                }
                                notStarted++;
                                if (await CheckIfTransactionIdDelayed(transcription, completed, completedTranscriptions, myQueueItem, StrorageConnectionString))
                                {
                                    completed++;
                                    continue;
                                }
                                break;
                        }
                    }

                    UpdateProcessingProgress(myQueueItem.JobId, completed, createdTranscriptions.Count());

                    log.Info(string.Format("Transcriptions status for JobId {0} : {1} completed, {2} running, {3} not started yet",myQueueItem.JobId, completed, running, notStarted));

                    if ((createdTranscriptions.Count - completedTranscriptions.Count) <25 && (createdTranscriptions.Count - completedTranscriptions.Count) > 0)
                    {
                        log.Info(string.Format("Outstanding Speech Jobs JobId {0} are {1}",myQueueItem.JobId,string.Join(",",createdTranscriptions.Except(completedTranscriptions))));
                    }

                    await Task.Delay(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
                }

                BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId, "Finished Speech Recognition", null, "80.0%");

                // delete all completed items Transactions from the speech batch transactions API
                foreach (var item in completedTranscriptions)
                {
                    // delete a transcription
                    await client.DeleteTranscriptionAsync(item).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId, "Error in Speech Conversion - " + ex.Message, null, "0%");
                log.Error(ex.Message, ex, "Speech Conversaion Function");
            }

        }

        private async static Task<IEnumerable<Transcription>> GetAllTransactions(CrisClient.CrisClient client)
        {


            List<Transcription> transcriptions = new List<Transcription>();

            int skip = 0;

            while (true)
            {

                // get all transcriptions for the subscription
                var subTranscriptions = (await client.GetTranscriptionsAsync(skip, 100).ConfigureAwait(false)).ToList();

                if (subTranscriptions == null || subTranscriptions.Count() == 0)
                {
                    return transcriptions;
                }


                transcriptions.AddRange(subTranscriptions);


                skip += 100;
            }
        }

        private async static Task<bool> CheckIfTransactionIdDelayed(Transcription transcription, int completed, List<Guid> completedTranscriptions, SpeechTask myQueueItem, string storageConnectionString)
        {
            if (transcription.LastActionDateTime < DateTime.UtcNow.AddMinutes(-SpeechTransactionDelayThreshould))
            {
                var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.Name);
                voiceFile.Status = "SpeechDelayed";
                await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, storageConnectionString, "BatchJobDetails");
                completedTranscriptions.Add(transcription.Id);
                return true;
            }
            return false;
        }

        private static void UpdateProcessingProgress(string JobId, int completed, int TotalFiles)
        {
            double completionPercent = (double)completed / TotalFiles;

            int partialPercentaion = (int)Math.Ceiling((completionPercent * 70));

            BatchJobStorageHelper.UpdateBatchJobStatus(JobId, "Receiving recognition results from speech service", null, (10 + partialPercentaion).ToString() + "%");

        }

        private static List<TranscriptPair> GetTranscriptValues(CloudBlobContainer container, string JobId, string transcriptFileName)
        {
            CloudBlobDirectory JobDirectory = container.GetDirectoryReference(JobId);
            // Retrieve reference to a blob name
            CloudBlockBlob blockBlob = JobDirectory.GetBlockBlobReference(transcriptFileName);

            List<TranscriptPair> transcriptPairs = new List<TranscriptPair>();

            char[] delimiter = new char[] { '\t' };

            using (var stream = blockBlob.OpenRead())
            {
                using (StreamReader reader = new StreamReader(stream))
                {
                    string line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        string[] columnheaders = line.Split(delimiter);

                        transcriptPairs.Add(new TranscriptPair() { FileName = columnheaders[0], Transcript = columnheaders[1] });
                    }
                }
            }

            return transcriptPairs;
        }
    }

    public class TranscriptionDetails
    {

        public TranscriptionDetails(Guid transcationId, int numberOfTries)
        {
            TranscriptionId = transcationId;
            NumberOfTries = numberOfTries;
        }
        public Guid TranscriptionId { get; set; }
        public int NumberOfTries { get; set; }
    }
}
