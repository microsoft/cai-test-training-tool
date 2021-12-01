using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BatchTesting.Tool.Function.Helpers;
using BatchTesting.Tool.Function.Models;
using BatchClient;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Newtonsoft.Json;

namespace BatchTesting.Tool.Function
{
    public class SpeechConversion
    {
        private readonly IConfiguration configuration;

        private string SubscriptionKey;

        private int SpeechTransactionDelayThreshold = 240;

        private static string HostName;
        private const int Port = 443;

        //name and description
        private const string Description = "Daimler Speech";

        // recordings and locale
        private const string Locale = "de-DE";
        

        private readonly string storageConnectionString;

        private readonly string batchJobTableName;

        public SpeechConversion(IConfiguration configuration)
        {
            this.configuration = configuration;
            storageConnectionString = this.configuration.GetConnectionString("TableStorageConnectionString");

            batchJobTableName = this.configuration.GetValue<string>("BatchJobTableName");

            SubscriptionKey = configuration.GetValue<string>("SpeechSubscriptionKey");

            HostName = configuration.GetValue<string>("region") + ".api.cognitive.microsoft.com";

            SpeechTransactionDelayThreshold = configuration.GetValue<int>("SpeechTransactionDelayThreshold");
        }

        [FunctionName("SpeechConversion")]
        public async Task Run([QueueTrigger("speechtasks", Connection = "TableStorageConnectionString")] SpeechTask myQueueItem, ILogger log)
        {
            log.LogInformation($"C# Queue trigger function processed: {myQueueItem}");

            try
            {
                await BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId, storageConnectionString,batchJobTableName, "Queuing Job to Speech Service", null, "6%");
                string StrorageConnectionString = storageConnectionString;

                CloudStorageAccount storageAccount = CloudStorageAccount.Parse(StrorageConnectionString);

                Dictionary<string, int> FileRetries = new Dictionary<string, int>();

                List<Uri> ModelsList = new List<Uri>();

                // Create the blob client.
                CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
                // Retrieve reference to a previously created container.
                CloudBlobContainer container = blobClient.GetContainerReference("voices");

                CloudBlobDirectory FilesDirectory = container.GetDirectoryReference(myQueueItem.JobId + "/files");

                List<TranscriptPair> transcriptValues = await GetTranscriptValues(container, myQueueItem.JobId, myQueueItem.TranscriptFileName);

                var client = BatchClient.BatchClient.CreateApiV3Client(SubscriptionKey, HostName);

                var toBeDeletedTranscriptions = new List<Transcription>();

                IEnumerable<Transcription> transcriptions = new List<Transcription>();

                transcriptions = await GetAllTransactions(client);

                toBeDeletedTranscriptions = transcriptions.Where(i => i.CreatedDateTime < DateTime.UtcNow.AddDays(-1)).ToList();

                // delete all pre-existing completed transcriptions. If transcriptions are still running or not started, they will not be deleted
                foreach (var item in toBeDeletedTranscriptions)
                {
                    // delete a transcription
                    await client.DeleteTranscriptionAsync(item.Self).ConfigureAwait(false);
                }


                if (!string.IsNullOrWhiteSpace(myQueueItem.SpeechLanguageModelId))
                {
                    try {
                        ModelsList.Add(new Uri(myQueueItem.SpeechLanguageModelId));
                    }
                    catch (Exception)
                    {
                        
                    }
                   
                }

                if (!string.IsNullOrWhiteSpace(myQueueItem.SpeechAcousticModelId))
                {
                    try
                    {
                        ModelsList.Add(new Uri(myQueueItem.SpeechAcousticModelId));
                    }
                    catch (Exception)
                    {

                    }
                }


                var createdTranscriptions = new List<Uri>();

                var completedTranscriptions = new List<Uri>();

                BlobContinuationToken token = null;

                BlobResultSegment currSeg = null;

                while (currSeg == null || currSeg.ContinuationToken != null)
                {
                    currSeg = await FilesDirectory.ListBlobsSegmentedAsync(token);

                    // Loop over items within the container and output the content, length and URI.
                    foreach (IListBlobItem item in currSeg.Results)
                    {
                        if (item.GetType() == typeof(CloudBlockBlob))
                        {
                            CloudBlockBlob blob = (CloudBlockBlob)item;
                            var blobSAS = blob.GetSharedAccessSignature(new SharedAccessBlobPolicy() { Permissions = SharedAccessBlobPermissions.Read, SharedAccessExpiryTime = DateTimeOffset.Now.AddDays(1) });

                            var blobURL = blob.StorageUri.PrimaryUri.OriginalString + blobSAS;

                            Transcription createdTranscription;

                            // <transcriptiondefinition>
                            var newTranscription = new Transcription
                            {
                                DisplayName = blob.Name.Substring(blob.Name.LastIndexOf('/') + 1),
                                Locale = Locale,
                                ContentUrls = new[] { new Uri(blobURL) },
                                Description = Description + " - " + myQueueItem.JobId,                                
                                Properties = new TranscriptionProperties
                                {
                                    IsWordLevelTimestampsEnabled = true,
                                    TimeToLive = TimeSpan.FromDays(1)
                                }
                            };

                            if (ModelsList != null && ModelsList.Count() > 0)
                            {
                                newTranscription.Model = new EntityReference() { Self = ModelsList.FirstOrDefault() };
                                createdTranscription = await client.CreateTranscriptionAsync(newTranscription); 
                            }
                            else
                            {
                                createdTranscription = await client.CreateTranscriptionAsync(newTranscription);
                            }

                            createdTranscriptions.Add(createdTranscription.Self);
                        }
                    }
                }

               

                transcriptions = await GetAllTransactions(client);

                await BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId,storageConnectionString,batchJobTableName, "Receiving recognition results from speech service", null, "10%");

                // check for the status of our transcriptions every 30 sec. (can also be 1, 2, 5 min depending on usage)
                int completed = 0, running = 0, notStarted = 0;
                while (completed < createdTranscriptions.Count())
                {
                    // get all transcriptions for the user
                    transcriptions = await GetAllTransactions(client);

                    log.LogInformation("Service Details (" + myQueueItem.JobId + ") : Running = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "Running").Count() + " NotStarted = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "NotStarted").Count() + " Succeeded = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "Succeeded").Count() + " Failed = " + transcriptions.Where(i => i.Description.Contains(myQueueItem.JobId) && i.Status == "Failed").Count());

                    //completed = 0; running = 0; notStarted = 0;
                    // for each transcription in the list we check the status
                    foreach (var transcription in transcriptions)
                    {
                        switch (transcription.Status)
                        {
                            case "Failed":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Self) || completedTranscriptions.Contains(transcription.Self))
                                {
                                    continue;
                                }

                                log.LogInformation(string.Format("Failed (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));

                                if (FileRetries.TryGetValue(transcription.DisplayName, out int numberOfRetries))
                                {
                                    if (numberOfRetries < 2)
                                    {
                                        FileRetries[transcription.DisplayName] += 1;

                                        log.LogInformation(string.Format("Failed - Retry < 2 (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));
                                    }
                                    else
                                    {
                                        log.LogInformation(string.Format("Failed - Final Failure (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));

                                        completed++;
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.DisplayName);
                                        voiceFile.Status = "SpeechFailed";
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");
                                        completedTranscriptions.Add(transcription.Self);
                                        continue;
                                    }
                                }
                                else
                                {
                                    FileRetries.Add(transcription.DisplayName, 1);


                                }
                                Transcription createdTranscription;

                                await client.DeleteTranscriptionAsync(transcription.Self).ConfigureAwait(false);

                                createdTranscriptions.Remove(transcription.Self);

                                var newTranscription = new Transcription
                                {
                                    DisplayName = transcription.DisplayName,
                                    Locale = Locale,
                                    ContentUrls = transcription.ContentUrls,
                                    Description = Description + " - " + myQueueItem.JobId,
                                    Properties = new TranscriptionProperties
                                    {
                                        IsWordLevelTimestampsEnabled = true,
                                        TimeToLive = TimeSpan.FromDays(1)
                                    }
                                };

                                if (ModelsList != null && ModelsList.Count() > 0)
                                {
                                    log.LogInformation(string.Format("Failed - Add New Speech Job (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));
                                    newTranscription.Model = new EntityReference() { Self = ModelsList.FirstOrDefault() };
                                    createdTranscription = await client.CreateTranscriptionAsync(newTranscription);
                                }
                                else
                                {
                                    log.LogInformation(string.Format("Failed - Add New Speech Job (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));
                                    createdTranscription = await client.CreateTranscriptionAsync(newTranscription);
                                }

                                log.LogInformation(string.Format("Failed - After Adding Failed Speech (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));
                                createdTranscriptions.Add(createdTranscription.Self);



                                break;
                            case "Succeeded":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Self) || completedTranscriptions.Contains(transcription.Self))
                                {
                                    // not creted form here, continue
                                    continue;
                                }
                                completed++;

                                log.LogInformation(string.Format("Success (JobId = {0}): File name = {1} Speech Id= {2}", myQueueItem.JobId, transcription.DisplayName, transcription.Self));

                                // if the transcription was successfull, check the results
                                if (transcription.Status == "Succeeded")
                                {
                                    try
                                    {
                                       
                                        var paginatedfiles = await client.GetTranscriptionFilesAsync(transcription.Links.Files).ConfigureAwait(false);
                                        var resultFile = paginatedfiles.Values.FirstOrDefault(f => f.Kind == ArtifactKind.Transcription);
                                        var result = await client.GetTranscriptionResultAsync(new Uri(resultFile.Links.ContentUrl)).ConfigureAwait(false);

                                        var blobFileName = transcription.DisplayName;
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, blobFileName);

                                        var referenceTranscript = transcriptValues.FirstOrDefault(i => i.FileName == blobFileName);

                                        if (referenceTranscript != null)
                                        {
                                            voiceFile.Transcript = referenceTranscript.Transcript;
                                            if (result.RecognizedPhrases != null && result.RecognizedPhrases.All(phrase => phrase.RecognitionStatus.Equals("Success", StringComparison.Ordinal)))
                                            {
                                                voiceFile.Recognized = result.CombinedRecognizedPhrases.FirstOrDefault().Display;
                                                voiceFile.Status = "Recognized";

                                                log.LogInformation("Success - JobId = " + myQueueItem.JobId + " Recognized " + transcription.Self + " FileName = " + transcription.DisplayName);

                                                await QueueMessageHelper.SaveCustomProcessingTaskAsync(new CustomProcesingTask() { JobId = myQueueItem.JobId, Message = voiceFile.Recognized, FileName = blobFileName, JobName = myQueueItem.JobName, CPLName = "LPR" },storageConnectionString);
                                            }
                                            else
                                            {
                                                voiceFile.Status = "NotRecognized";
                                                log.LogInformation("Success - JobId= " + myQueueItem.JobId + " NotRecognized " + transcription.Self + " FileName = " + transcription.DisplayName);
                                            }
                                        }
                                        else
                                        {
                                            voiceFile.Status = "MissingReferenceTrancript";
                                            log.LogInformation("Success - JobId= " + myQueueItem.JobId + " MissingReferenceTrancript " + transcription.Self + " FileName = " + transcription.DisplayName);
                                        }

                                        log.LogInformation("Success - JobId= " + myQueueItem.JobId + " Save File" + transcription.Self + " FileName = " + transcription.DisplayName);
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");

                                    }
                                    catch (Exception ex)
                                    {
                                        log.LogError(ex.Message, ex, "Speech Conversaion Function");
                                        var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.DisplayName);
                                        voiceFile.Status = "NotRecognized";
                                        await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, StrorageConnectionString, "BatchJobDetails");

                                    }


                                    completedTranscriptions.Add(transcription.Self);
                                }
                                break;

                            case "Running":
                                // we check to see if it was one of the transcriptions we created from this client.
                                if (!createdTranscriptions.Contains(transcription.Self) || completedTranscriptions.Contains(transcription.Self))
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
                                if (!createdTranscriptions.Contains(transcription.Self) || completedTranscriptions.Contains(transcription.Self))
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

                    await UpdateProcessingProgress(myQueueItem.JobId, completed, createdTranscriptions.Count());

                    log.LogInformation(string.Format("Transcriptions status for JobId {0} : {1} completed, {2} running, {3} not started yet", myQueueItem.JobId, completed, running, notStarted));

                    if ((createdTranscriptions.Count - completedTranscriptions.Count) < 25 && (createdTranscriptions.Count - completedTranscriptions.Count) > 0)
                    {
                        log.LogInformation(string.Format("Outstanding Speech Jobs JobId {0} are {1}", myQueueItem.JobId, string.Join(",", createdTranscriptions.Except(completedTranscriptions))));
                    }

                    await Task.Delay(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
                }

                await BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId,storageConnectionString,batchJobTableName, "Finished Speech Recognition", null, "80.0%");

                // delete all completed items Transactions from the speech batch transactions API
                foreach (var item in completedTranscriptions)
                {
                    // delete a transcription
                    await client.DeleteTranscriptionAsync(item).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                await BatchJobStorageHelper.UpdateBatchJobStatus(myQueueItem.JobId,storageConnectionString,batchJobTableName, "Error in Speech Conversion - " + ex.Message, null, "0%");
                log.LogError(ex.Message, ex, "Speech Conversaion Function");
            }
        }


        private async Task<IEnumerable<Transcription>> GetAllTransactions(BatchClient.BatchClient client)
        {
            List<Transcription> transcriptions = new List<Transcription>();


            // get all transcriptions for the subscription
            PaginatedTranscriptions paginatedTranscriptions = null;
            do
            {
                if (paginatedTranscriptions == null)
                {
                    paginatedTranscriptions = await client.GetTranscriptionsAsync().ConfigureAwait(false);
                }
                else
                {
                    paginatedTranscriptions = await client.GetTranscriptionsAsync(paginatedTranscriptions.NextLink).ConfigureAwait(false);
                }

                transcriptions.AddRange(paginatedTranscriptions.Values);


            }
            while (paginatedTranscriptions.NextLink != null);

            return transcriptions;
          
        }

        private async Task<bool> CheckIfTransactionIdDelayed(Transcription transcription, int completed, List<Uri> completedTranscriptions, SpeechTask myQueueItem, string storageConnectionString)
        {
            if (transcription.LastActionDateTime < DateTime.UtcNow.AddMinutes(-SpeechTransactionDelayThreshold))
            {
                var voiceFile = new VoiceFile(myQueueItem.JobId, transcription.DisplayName);
                voiceFile.Status = "SpeechDelayed";
                await BatchJobStorageHelper.SaveVoiceFileAsync(voiceFile, storageConnectionString, "BatchJobDetails");
                completedTranscriptions.Add(transcription.Self);
                return true;
            }
            return false;
        }

        private async Task UpdateProcessingProgress(string JobId, int completed, int TotalFiles)
        {
            double completionPercent = (double)completed / TotalFiles;

            int partialPercentaion = (int)Math.Ceiling((completionPercent * 70));

            await BatchJobStorageHelper.UpdateBatchJobStatus(JobId,storageConnectionString,batchJobTableName, "Receiving recognition results from speech service", null, (10 + partialPercentaion).ToString() + "%");

        }

        private async Task<List<TranscriptPair>> GetTranscriptValues(CloudBlobContainer container, string JobId, string transcriptFileName)
        {
            CloudBlobDirectory JobDirectory = container.GetDirectoryReference(JobId);
            // Retrieve reference to a blob name
            CloudBlockBlob blockBlob = JobDirectory.GetBlockBlobReference(transcriptFileName);

            List<TranscriptPair> transcriptPairs = new List<TranscriptPair>();

            char[] delimiter = new char[] { '\t' };

            using (var stream = await blockBlob.OpenReadAsync())
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
