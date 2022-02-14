using Daimler.Speech.Web.Models;
using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Helpers
{
    public class BatchJobStorageHelper
    {       
        public static async Task SaveBatchJobAsync(BatchJob batchJob, string connectionString, string tableName)
        {
            await AzureTableStorageHelper.TableInsertAsync(batchJob,connectionString,tableName);

        }

        public async static Task<BatchJob> GetJobsById(string Id, string storageConnectionString)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.BatchJobTableName);
            TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", Id);

            var BatchJobs = await table.ExecuteAsync(retrieveOperation);
            if (BatchJobs.Result != null)
            {
                return (BatchJob)BatchJobs.Result;
            }
            else
            {
                return null;
            }
        }

        public async static Task<List<VoiceFile>> GetJobDetails(string JobId, string storageConnectionString)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.BatchJobDetailsTableName);
            var query = new TableQuery<VoiceFile>().Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, JobId));
            TableContinuationToken token = null;
            var DetailsTable = await table.ExecuteQuerySegmentedAsync(query,token);
            return DetailsTable.ToList();
        }

        public async static Task UpdateBatchJobStatus(string storageConnectionString, string batchJobId, string status, string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.BatchJobTableName);

            TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", batchJobId);

            TableResult retrievedResult = await table.ExecuteAsync(retrieveOperation);

            BatchJob updateEntity = (BatchJob)retrievedResult.Result;

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

        public async static void UpdateBatchJob(BatchJob batchJob, string storageConnectionString)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, Constants.BatchJobTableName);

            //TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", batchJobId.RowKey);

            //TableResult retrievedResult = table.Execute(retrieveOperation);

            //BatchJob updateEntity = (BatchJob)retrievedResult.Result;

            if (batchJob != null)
            {
                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.InsertOrMerge(batchJob);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }

        public async static Task DeleteJobDetails(string connectionString, string partitionKey)
        {
            var detailsTable = AzureTableStorageHelper.GetTable(connectionString, Constants.BatchJobDetailsTableName);

            await AzureTableStorageHelper.DeleteTableRecordsAsync(partitionKey, detailsTable);
        }
    }
}
