using AudioGeneration.Tool.Function.Models;
using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AudioGeneration.Tool.Function.Helpers
{
    public class AudioGenerationStorageHelper
    {

        static string TempConnectionString = "";
        public async static Task UpdateAudioGenerationJobStatus(string connectionString, string batchJobId, string status,string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, "AudioGenerationJobs");

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

        public async static Task UpdateAudioGenerationFilesUrl(string connectionString, string batchJobId, string status, string generatedFileUrl, string convertedFileUrl, string noiseFileUrl, string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, "AudioGenerationJobs");

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

                if (!string.IsNullOrEmpty(convertedFileUrl))
                {
                    updateEntity.ConvertedFileURL = convertedFileUrl;
                }

                if (!string.IsNullOrEmpty(generatedFileUrl))
                {
                    updateEntity.GeneratedFileURL = generatedFileUrl;
                }

                if (!string.IsNullOrEmpty(noiseFileUrl))
                {
                    updateEntity.NoiseFileURL = noiseFileUrl;
                }

                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.Replace(updateEntity);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }
        public async static Task UpdateAudioGenerationJob(AudioGenerationJob batchJobId)
        {
            var table = AzureTableStorageHelper.GetTable(TempConnectionString, "AudioGenerationJobs");


            if (batchJobId != null)
            {
                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.InsertOrMerge(batchJobId);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }

        public static async Task SaveAudioGenerationJobDetailsAsync(AudioGenerationJobDetails audioGenerationJobDetails, string connectionString)
        {
            await AzureTableStorageHelper.TableInsertAsync(audioGenerationJobDetails, connectionString, Constants.AudioGenerationTables.AudioGenerationJobDetailsTableName);

        }

        internal static void UpdateBatchJob(object batchJob)
        {
            throw new NotImplementedException();
        }
    }
}
