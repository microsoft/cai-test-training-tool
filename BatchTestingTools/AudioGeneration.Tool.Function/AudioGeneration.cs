using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using AudioGeneration.Tool.Function.Helpers;
using AudioGeneration.Tool.Function.Models;
using AudioGeneration.Tool.Function.Services;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.DurableTask;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table.Protocol;
using Newtonsoft.Json;

namespace AudioGeneration.Tool.Function
{
    public class AudioGeneration
    {
        private readonly IAudioFunction audioFunction;
        private readonly IConfiguration configuration;

        private readonly string storageConnectionString;
        private readonly string saveStorageConnectionString;

        private readonly string ContainerName = "audiosynthetization";
        public AudioGeneration(IAudioFunction audioFunction, IConfiguration configuration)
        {
            this.audioFunction = audioFunction;
            this.configuration = configuration;
            storageConnectionString = this.configuration.GetConnectionString("TableStorageConnectionString");
            saveStorageConnectionString = this.configuration.GetConnectionString("SaveStorageConnectionString");
            ContainerName = this.configuration.GetValue<string>("ContainerName");
        }

        [FunctionName("AudioGenerationFn")]
        public async Task<List<string>> RunOrchestrator(
            [OrchestrationTrigger] IDurableOrchestrationContext context)
        {
            bool hasError = false;
            var outputs = new List<string>();

            var job = context.GetInput<AudioGenerationTask>();

            await context.CallActivityAsync<string>("AudioGenerationMainFn_UpdateProgress", new Progress() { JobId = job.JobId, ProgressPrecentage = "2%", Status= "Transcript Extraction" });

            AudioGenerationRequest audioGenerationResult = await context.CallActivityAsync<AudioGenerationRequest>("AudioGenerationMainFn_GenerateTranscript", job);

            List<string> TranscriptFileLines = audioGenerationResult.Transcripts;

            List<List<string>> chunkedList = new List<List<string>>();

            for (int i = 0; i < TranscriptFileLines.Count; i += 10)
            {
                chunkedList.Add(TranscriptFileLines.GetRange(i, Math.Min(10, TranscriptFileLines.Count - i)));
            }

            AudioGenerationRequest audioGenerationRequest = new AudioGenerationRequest() { AudioFont = job.AudioFont, AudioFormat = job.AudioFormat, GenerateTranscript = job.GenerateTranscript, JobId = job.JobId, Language = job.Language, Level = job.Level, TTSProvider = job.TTSProvider };

            //Dictionary<string, string> filesTranscripts = new Dictionary<string, string>();

            StringBuilder stringBuilder = new StringBuilder();

            List<Task<AudioGenerationResponse>> parallelTasks;

            int chunkNumber = 1;

            await context.CallActivityAsync<string>("AudioGenerationMainFn_UpdateProgress", new Progress() { JobId = job.JobId, ProgressPrecentage = "5%", Status = "Audio Generation Started" });


            foreach (var chunk in chunkedList)
            {
                parallelTasks = new List<Task<AudioGenerationResponse>>();
                foreach (var line in chunk)
                {
                    audioGenerationRequest.Text = line;
                    Task<AudioGenerationResponse> task = context.CallActivityAsync<AudioGenerationResponse>("AudioGenerationMainFn_ProcessTranscript", audioGenerationRequest);
                    parallelTasks.Add(task);
                }

                await Task.WhenAll(parallelTasks);

                

                foreach (Task<AudioGenerationResponse> audioGenerationTask in parallelTasks)
                {
                    if (!audioGenerationTask.IsFaulted && audioGenerationTask.Result != null)
                    {
                        //filesTranscripts.Add(audioGenerationTask.Result.output[0].filename, audioGenerationTask.Result.transcription);
                        stringBuilder.AppendLine(audioGenerationTask.Result.output[0].filename + "\t" + audioGenerationTask.Result.transcription);
                    }
                    else
                    {
                        hasError = true;
                    }
                    
                }

                double completionPercent = (double)chunkNumber / chunkedList.Count;

                int partialPercentaion = (int)Math.Ceiling((completionPercent * 45));

                await context.CallActivityAsync<string>("AudioGenerationMainFn_UpdateProgress", new Progress() { JobId = job.JobId, ProgressPrecentage = (5 + partialPercentaion).ToString() + "%", Status = "Audio Generation in progress" });

                chunkNumber++;

            }

            List<Task<string>> compressParallelTasks = new List<Task<string>>();

            await context.CallActivityAsync<string>("AudioGenerationMainFn_UpdateProgress", new Progress() { JobId = job.JobId, ProgressPrecentage = "60%", Status = "Files Compressing" });

            await context.CallActivityAsync("AudioGenerationMainFn_UploadTrascriptFile", new TranscriptToUpload() { FilesTranscript = stringBuilder.ToString(), JobId=job.JobId });

            Task<string> convertedCompressTask = context.CallActivityAsync<string>("AudioGenerationMainFn_CompressFiles", new FolderToCompress() { JobId = job.JobId, FolderName = "converted" });
            compressParallelTasks.Add(convertedCompressTask);
            Task<string> generatedCompressTask = context.CallActivityAsync<string>("AudioGenerationMainFn_CompressFiles", new FolderToCompress() { JobId = job.JobId, FolderName = "generated" });
            compressParallelTasks.Add(generatedCompressTask);
            Task<string> noiseCompressTask = context.CallActivityAsync<string>("AudioGenerationMainFn_CompressFiles", new FolderToCompress() { JobId = job.JobId, FolderName = "noise" });
            compressParallelTasks.Add(noiseCompressTask);

            await Task.WhenAll(compressParallelTasks);

            string convertedFileUrl = convertedCompressTask.Result;

            string generatedFileUrl = generatedCompressTask.Result;

            string noiseFileUrl = noiseCompressTask.Result;

            await AudioGenerationStorageHelper.UpdateAudioGenerationFilesUrl(storageConnectionString, job.JobId, "Completed" + (hasError? " With Error!":""), generatedFileUrl, convertedFileUrl, noiseFileUrl, "100%");

            return outputs;
        }

        private async Task<List<string>> GetTranscriptFileLines(string storageConnectionString, AudioGenerationTask job)
        {
            // Retrieve storage account from connection string.
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

            List<string> transcriptFileContent = new List<string>();


            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Retrieve reference to a previously created container.
            CloudBlobContainer container = blobClient.GetContainerReference("audiogeneration");

            CloudBlobDirectory dir = container.GetDirectoryReference(job.JobId);

            // Retrieve reference to a blob name
            CloudBlockBlob blockBlob = dir.GetBlockBlobReference(job.TranscriptFile);


            using (var stream = await blockBlob.OpenReadAsync())
            {
                using (StreamReader reader = new StreamReader(stream))
                {
                    string line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        transcriptFileContent.Add(line);
                    }
                }
            }

            return transcriptFileContent;
        }

        [FunctionName("AudioGenerationMainFn_UpdateProgress")]
        public async Task UpdateProgress([ActivityTrigger] Progress request, ILogger log)
        {
            await AudioGenerationStorageHelper.UpdateAudioGenerationJobStatus(storageConnectionString, request.JobId, request.Status, request.ProgressPrecentage);

        }

        [FunctionName("AudioGenerationMainFn_GenerateTranscript")]
        public async Task<AudioGenerationRequest> GenerateTranscript([ActivityTrigger] AudioGenerationTask request, ILogger log)
        {
            //Step 1 Call Web Service

            var i = new AudioGenerationRequest();
            i.Transcripts = await GetTranscriptFileLines(storageConnectionString, request);
            return i;
            //Step 2 Add file to table

        }

        [FunctionName("AudioGenerationMainFn_CompressFiles")]
        public async Task<string> CompressFiles([ActivityTrigger] FolderToCompress folderToCompress, ILogger log)
        {

            return await CompressFolders(folderToCompress.JobId, folderToCompress.FolderName);

            //Step 2 Add file to table

        }

        [FunctionName("AudioGenerationMainFn_UploadTrascriptFile")]
        public async Task UploadTrascriptFile([ActivityTrigger] TranscriptToUpload transcriptToUpload, ILogger log)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(saveStorageConnectionString);
            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Retrieve reference to a previously created container.
            CloudBlobContainer container = blobClient.GetContainerReference(ContainerName);

            await UploadTranscriptToFolders(transcriptToUpload.JobId, transcriptToUpload.FilesTranscript, container, "converted");
            await UploadTranscriptToFolders(transcriptToUpload.JobId, transcriptToUpload.FilesTranscript, container, "noise");
            await UploadTranscriptToFolders(transcriptToUpload.JobId, transcriptToUpload.FilesTranscript, container, "generated");

            //Step 2 Add file to table

        }

        private async Task UploadTranscriptToFolders(string jobId, string filesTranscript, CloudBlobContainer cloudBlobContainer, string foldername)
        {
           

            CloudBlobDirectory dir = cloudBlobContainer.GetDirectoryReference(jobId + "/" + foldername);

            // Retrieve reference to a blob name
            CloudBlockBlob blockBlob = dir.GetBlockBlobReference("transcriptions.txt");

            await blockBlob.UploadTextAsync(filesTranscript);
        }

        private async Task<string> CompressFolders(string jobId, string folderName)
        {
            var account = CloudStorageAccount.Parse(saveStorageConnectionString);
            var blobClient = account.CreateCloudBlobClient();
            var container = blobClient.GetContainerReference(ContainerName);

            CloudBlobDirectory FilesDirectory = container.GetDirectoryReference(jobId + "/" + folderName);

            var blob = FilesDirectory.GetBlockBlobReference(jobId + "_" + folderName + ".zip");

            BlobContinuationToken continuationToken = null;

            using (var stream = await blob.OpenWriteAsync())
            using (var zip = new ZipArchive(stream, ZipArchiveMode.Create))
            {
                do
                {
                    var resultSegment = await FilesDirectory.ListBlobsSegmentedAsync(
                        useFlatBlobListing: true,
                        blobListingDetails: BlobListingDetails.None,
                        maxResults: null,
                        currentToken: continuationToken,
                        options: null,
                        operationContext: null
                    );

                    // Get the value of the continuation token returned by the listing call.
                    continuationToken = resultSegment.ContinuationToken;
                    foreach (IListBlobItem item in resultSegment.Results)
                    {
                        if (item.GetType() == typeof(CloudBlockBlob))
                        {

                            CloudBlockBlob fileBlob = (CloudBlockBlob)item;

                            using (var msZippedBlob = new MemoryStream())
                            {
                                await fileBlob.DownloadToStreamAsync(msZippedBlob);

                                msZippedBlob.Seek(0, SeekOrigin.Begin);

                                var entry = zip.CreateEntry(fileBlob.Name.Substring(fileBlob.Name.LastIndexOf("/") + 1), CompressionLevel.Optimal);
                                using (var innerFile = entry.Open())
                                {
                                    await msZippedBlob.CopyToAsync(innerFile);
                                }
                            }

                        }
                    }
                } while (continuationToken != null); // Loop while the continuation token is not null.


            }

            var blobSAS = blob.GetSharedAccessSignature(new SharedAccessBlobPolicy() { Permissions = SharedAccessBlobPermissions.Read, SharedAccessExpiryTime = DateTimeOffset.Now.AddMonths(6) });

            var blobURL = blob.StorageUri.PrimaryUri.OriginalString + blobSAS;

            return blobURL;
        }

        [FunctionName("AudioGenerationMainFn_ProcessTranscript")]
        public async Task<AudioGenerationResponse> ProcessAudio([ActivityTrigger] AudioGenerationRequest request, ILogger log)
        {
            //Step 1 Call Web Service
            try
            {
                var result = await audioFunction.GetGeneratedAudioAsync(request);

                await AudioGenerationStorageHelper.SaveAudioGenerationJobDetailsAsync(new AudioGenerationJobDetails() {FileName = result.output[0].filename, Status="Success",PartitionKey=request.JobId,RowKey= Guid.NewGuid().ToString(),Transcript = request.Text }, storageConnectionString);

                return result;
            }
            catch (Exception ex)
            {

                await AudioGenerationStorageHelper.SaveAudioGenerationJobDetailsAsync(new AudioGenerationJobDetails() { Status = "Error", PartitionKey = request.JobId, RowKey = Guid.NewGuid().ToString(), Transcript = request.Text, Error=ex.Message, Exception= ex.StackTrace }, storageConnectionString);
                log.LogError("Error in Job + " + request.JobId + " Error: " + ex.Message, ex);
                return null;
            }
            //Step 2 Add file to table

        }

        [FunctionName("AudioGeneration_HttpStart")]
        public async Task<HttpResponseMessage> HttpStart(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequestMessage req,
            [DurableClient] IDurableOrchestrationClient starter,
            ILogger log)
        {
            if (req == null)
            {
                throw new Exception("Invalid request body.");
            }

            string requestBody = await req.Content.ReadAsStringAsync().ConfigureAwait(false);

            AudioGenerationTask audioGenerationTask = JsonConvert.DeserializeObject<AudioGenerationTask>(requestBody);
            if (audioGenerationTask == null)
            {
                throw new Exception("Invalid request body.");
            }


            // Function input comes from the request content.
            string instanceId = await starter.StartNewAsync("AudioGenerationFn", audioGenerationTask);

            log.LogInformation($"Started orchestration with ID = '{instanceId}'.");

            return starter.CreateCheckStatusResponse(req, instanceId);
        }
    }
}