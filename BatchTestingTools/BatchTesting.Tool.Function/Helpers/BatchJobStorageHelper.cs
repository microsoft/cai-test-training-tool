using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using BatchTesting.Tool.Function.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BatchTesting.Tool.Function.Helpers
{
    public class BatchJobStorageHelper
    {
        public static async Task SaveBatchJobAsync(BatchJob batchJob, string connectionString, string tableName)
        {
            await AzureTableStorageHelper.TableInsertAsync(batchJob, connectionString, tableName);
        }

        public async static Task UpdateBatchJobStatus(string batchJobId, string connectionString, string batchJobTableName, string status, WERResults wERResults = null, string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, batchJobTableName);

            TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", batchJobId);

            TableResult retrievedResult = await table.ExecuteAsync(retrieveOperation);

            BatchJob updateEntity = (BatchJob)retrievedResult.Result;

            if (updateEntity != null)
            {

                updateEntity.Status = status;
                if (wERResults != null)
                {
                    updateEntity.WER = wERResults.metrics.wer;
                    updateEntity.WRR = wERResults.metrics.wrr;
                    updateEntity.SER = wERResults.metrics.ser;
                    updateEntity.LPR = wERResults.metrics.lpr;
                }

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

        public async static Task UpdateBatchJob(BatchJob batchJobId, string connectionString, string batchJobTableName)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, batchJobTableName);

            if (batchJobId != null)
            {
                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.InsertOrMerge(batchJobId);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }

        public static async Task SaveVoiceFileAsync(VoiceFile voiceFile, string connectionString, string tableName)
        {
            await AzureTableStorageHelper.TableInsertAsync(voiceFile, connectionString, tableName);
        }

        public async static Task<List<BatchJob>> GetJobsWithStatus(string Status, string connectionString, string batchJobTableName)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, batchJobTableName);
            var query = new TableQuery<BatchJob>().Where(TableQuery.CombineFilters(TableQuery.GenerateFilterCondition("Status", QueryComparisons.Equal, Status), TableOperators.And , TableQuery.GenerateFilterConditionForDate("Timestamp",QueryComparisons.GreaterThanOrEqual, DateTime.Now.AddDays(-5))));

            List<BatchJob> retList = new List<BatchJob>();

            TableContinuationToken token = null;

            TableQuerySegment<BatchJob> currSeg = null;

            while (currSeg == null || currSeg.ContinuationToken != null)
            {
                currSeg = await table.ExecuteQuerySegmentedAsync(query, token);
                retList.AddRange(currSeg.Results);
            }            
            
            return retList;
        }

        public async static Task<BatchJob> GetJobsById(string Id, string connectionString, string batchJobTableName)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, batchJobTableName);
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

        public async static Task<List<VoiceFile>> GetJobDetails(string JobId, string storageConnectionString, string batchJobDetailsTableName)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, batchJobDetailsTableName);
            var query = new TableQuery<VoiceFile>().Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, JobId));


            List<VoiceFile> retList = new List<VoiceFile>();

            TableContinuationToken token = null;

            TableQuerySegment<VoiceFile> currSeg = null;

            while (currSeg == null || currSeg.ContinuationToken != null)
            {
                currSeg = await table.ExecuteQuerySegmentedAsync(query, token);
                token = currSeg.ContinuationToken;
                retList.AddRange(currSeg.Results);
            }
          
            return retList;
        }

        public async static Task UpdateDetailsProcessed(string jobId, string jobName, string fileName, string Status, string processedTrascript, string LPRecognition, string LUISEntity, JToken AllLPRecognition, JToken AllLUISEntity, string connectionString, string batchJobTableName)
        {
            var table = AzureTableStorageHelper.GetTable(connectionString, batchJobTableName);

            TableOperation retrieveOperation = TableOperation.Retrieve<VoiceFile>(jobId, fileName);

            TableResult retrievedResult = await table.ExecuteAsync(retrieveOperation);

            VoiceFile updateEntity = (VoiceFile)retrievedResult.Result;

            if (updateEntity != null)
            {
                // Change the phone number.
                updateEntity.Processed = processedTrascript;

                updateEntity.Status = Status;

                if (!string.IsNullOrEmpty(LPRecognition))
                {
                    updateEntity.LPRecognized = LPRecognition;
                }

                if (!string.IsNullOrEmpty(LUISEntity))
                {
                    updateEntity.LUISEntities = LUISEntity;
                }

                if (AllLPRecognition != null)
                {
                    updateEntity.LPRecognizedJson = JsonConvert.SerializeObject(AllLPRecognition);
                }

                if (AllLUISEntity != null)
                {
                    updateEntity.LUISEntitiesJson = JsonConvert.SerializeObject(AllLUISEntity);
                }


                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.Replace(updateEntity);

                // Execute the operation.
                await table.ExecuteAsync(updateOperation);
            }
        }
    }
}
