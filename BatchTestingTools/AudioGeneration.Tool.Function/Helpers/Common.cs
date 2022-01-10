using AudioGeneration.Tool.Function.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AudioGeneration.Tool.Function.Helpers
{
    public class Common
    {
        public async static Task<List<TranscriptPair>> GetTranscriptValues(string JobId, string transcriptFileName, string storageConnectionString)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);
            // Create the blob client.
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
            // Retrieve reference to a previously created container.
            CloudBlobContainer container = blobClient.GetContainerReference("voices");

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
                        if (!string.IsNullOrWhiteSpace(line))
                        {
                            string[] columnheaders = line.Split(delimiter);
                            if (columnheaders.Count() == 2)
                            {
                                transcriptPairs.Add(new TranscriptPair() { FileName = columnheaders[0], Transcript = columnheaders[1] });
                            }
                        }
                    }
                }
            }

            return transcriptPairs;
        }
    }
}
