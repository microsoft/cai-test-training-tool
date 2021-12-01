using Daimler.Speech.Function.Models;
using Microsoft.WindowsAzure.Storage.Table;
using Speech.TestTool.Function.Helpers;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Helpers
{
    public class AudioGenerationJobStorageHelper
    {       
        public static async Task SaveAudioGenerationJobAsync(AudioGenerationJob audioGenerationJob, string connectionString)
        {
            await AzureTableStorageHelper.TableInsertAsync(audioGenerationJob, connectionString, Constants.AudioGenerationJobsTableName);

        }

        public async static Task<AudioGenerationJob> GetJobsById(string Id, string storageConnectionString)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.AudioGenerationJobsTableName);
            TableOperation retrieveOperation = TableOperation.Retrieve<AudioGenerationJob>("AudioGenerationJob", Id);

            var AudioGenertionJobs = await table.ExecuteAsync(retrieveOperation);
            if (AudioGenertionJobs.Result != null)
            {
                return (AudioGenerationJob)AudioGenertionJobs.Result;
            }
            else
            {
                return null;
            }
        }


        public async static Task UpdateBatchJobStatus(string storageConnectionString, string batchJobId, string status, string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.AudioGenerationJobsTableName);

            TableOperation retrieveOperation = TableOperation.Retrieve<AudioGenerationJob>("AudioGenerationJob", batchJobId);

            TableResult retrievedResult = await table.ExecuteAsync(retrieveOperation);

            AudioGenerationJob updateEntity = (AudioGenerationJob)retrievedResult.Result;

            if (updateEntity != null)
            {

                updateEntity.Status = status;

                if (!string.IsNullOrEmpty(completionPercentage))
                {
                    updateEntity.CompletionPercentage = completionPercentage;
                }

                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.Replace(updateEntity);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }

        public async static void UpdateBatchJob(AudioGenerationJob batchJob, string storageConnectionString)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.AudioGenerationJobsTableName);

            if (batchJob != null)
            {
                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.InsertOrMerge(batchJob);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }

    }
}
