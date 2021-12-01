using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Daimler.Speech.Function.Helpers;
using Daimler.Speech.Function.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;

namespace Daimler.Speech.Function
{
    public static class ExtractVoicesFiles
    {
        [FunctionName("ExtractVoicesFiles")]
        public static async System.Threading.Tasks.Task RunAsync([QueueTrigger("voicesfilestasks", Connection = "")]VoicesFilesTask myQueueItem, TraceWriter log)
        {
            string storageConnectionString = ConfigurationManager.AppSettings["StorageConnectionString"];
            // Retrieve storage account from connection string.
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

            BatchJob batchJob = new BatchJob(myQueueItem.BatchJobId)
            {
                Status = "Extracting Audio Files",
                CompletionPercentage= "2%"
            };

            BatchJobStorageHelper.UpdateBatchJob(batchJob);

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
                blockBlob.DownloadToStream(msZippedBlob);
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

            BatchJobStorageHelper.UpdateBatchJob(batchJob);
            await QueueMessageHelper.SaveVoiceTaskAsync(new SpeechTask() { JobName = myQueueItem.JobName,TranscriptFileName= myQueueItem.TranscriptFileName, JobId = myQueueItem.BatchJobId,SpeechLanguageModelId=myQueueItem.SpeechLanguageModelId,SpeechAcousticModelId= myQueueItem.SpeechAcousticModelId });
        }
    }
}
