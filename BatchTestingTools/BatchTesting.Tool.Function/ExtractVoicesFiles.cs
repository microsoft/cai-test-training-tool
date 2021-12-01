using System;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using BatchTesting.Tool.Function.Helpers;
using BatchTesting.Tool.Function.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;

namespace BatchTesting.Tool.Function
{
    public class ExtractVoicesFiles
    {

        private readonly IConfiguration configuration;

        private readonly string storageConnectionString;

        private readonly string batchJobTableName;

        public ExtractVoicesFiles(IConfiguration configuration)
        {
            this.configuration = configuration;
            storageConnectionString = this.configuration.GetConnectionString("TableStorageConnectionString");

            batchJobTableName = this.configuration.GetValue<string>("BatchJobTableName");
        }


        [FunctionName("ExtractVoicesFiles")]
        public async Task Run([QueueTrigger("voicesfilestasks", Connection = "TableStorageConnectionString")] VoicesFilesTask myQueueItem, ILogger log)
        {

            // Retrieve storage account from connection string.
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

            BatchJob batchJob = new BatchJob(myQueueItem.BatchJobId)
            {
                Status = "Extracting Audio Files",
                CompletionPercentage = "2%"
            };

            await BatchJobStorageHelper.UpdateBatchJob(batchJob, storageConnectionString, batchJobTableName);

            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

            // Retrieve reference to a previously created container.
            CloudBlobContainer container = blobClient.GetContainerReference("voices");

            CloudBlobDirectory dir = container.GetDirectoryReference(myQueueItem.BatchJobId);

            // Retrieve reference to a blob name
            CloudBlockBlob blockBlob = dir.GetBlockBlobReference(myQueueItem.FileName);

            int FilesCount = 0;

            // Save blob contents to a Memory Stream.
            using (var msZippedBlob = new MemoryStream())
            {
                await blockBlob.DownloadToStreamAsync(msZippedBlob);
                using (ZipArchive zip = new ZipArchive(msZippedBlob))
                {
                    FilesCount = zip.Entries.Count;
                    foreach (var entry in zip.Entries)
                    {
                        using (StreamReader sr = new StreamReader(entry.Open()))
                        {
                            CloudBlockBlob cloudBlockBlob = container.GetBlockBlobReference(myQueueItem.BatchJobId + "/files/" + entry.Name);
                            await cloudBlockBlob.UploadFromStreamAsync(sr.BaseStream);
                        }
                    }
                }
            }

            batchJob.Status = "Audio Files Extracted";
            batchJob.CompletionPercentage = "5%";

            batchJob.FilesCount = FilesCount;

            await BatchJobStorageHelper.UpdateBatchJob(batchJob, storageConnectionString, batchJobTableName);
            await QueueMessageHelper.SaveVoiceTaskAsync(new SpeechTask() { JobName = myQueueItem.JobName, TranscriptFileName = myQueueItem.TranscriptFileName, JobId = myQueueItem.BatchJobId, SpeechLanguageModelId = myQueueItem.SpeechLanguageModelId, SpeechAcousticModelId = myQueueItem.SpeechAcousticModelId }, storageConnectionString);

        }
    }
}
