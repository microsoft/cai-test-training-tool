using Daimler.Speech.Function.Models;
using Microsoft.WindowsAzure.Storage.Table;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Speech.TestTool.Function.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Helpers
{
    public class BatchJobStorageHelper
    {
        public static async Task SaveBatchJobAsync(BatchJob batchJob, string connectionString, string tableName)
        {
            await AzureTableStorageHelper.TableInsertAsync(batchJob, connectionString, tableName);
        }

        public static void UpdateBatchJobStatus(string batchJobId, string status, WERResults wERResults = null, string completionPercentage = null)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobTableName"]);

            TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", batchJobId);

            TableResult retrievedResult = table.Execute(retrieveOperation);

            BatchJob updateEntity = (BatchJob)retrievedResult.Result;

            if (updateEntity != null)
            {

                updateEntity.Status = status;
                if (wERResults != null)
                {
                    //updateEntity.TestResults = JsonConvert.SerializeObject(wERResults);
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
                table.Execute(updateOperation);
            }
        }

        public static void UpdateBatchJob(BatchJob batchJobId)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobTableName"]);

            //TableOperation retrieveOperation = TableOperation.Retrieve<BatchJob>("BatchJob", batchJobId.RowKey);

            //TableResult retrievedResult = table.Execute(retrieveOperation);

            //BatchJob updateEntity = (BatchJob)retrievedResult.Result;

            if (batchJobId != null)
            {
                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.InsertOrMerge(batchJobId);

                // Execute the operation.
                table.Execute(updateOperation);
            }
        }

        public static async Task SaveVoiceFileAsync(VoiceFile voiceFile, string connectionString, string tableName)
        {
            await AzureTableStorageHelper.TableInsertAsync(voiceFile, connectionString, tableName);
        }

        public static List<BatchJob> GetJobsWithStatus(string Status)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobTableName"]);
            var query = new TableQuery<BatchJob>().Where(TableQuery.GenerateFilterCondition("Status", QueryComparisons.Equal, Status));
            var BatchJobs = table.ExecuteQuery(query);
            return BatchJobs.ToList();            
        }

        public async static Task<BatchJob> GetJobsById(string Id)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobTableName"]);
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

        public static List<VoiceFile> GetJobDetails(string JobId)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobDetailsTableName"]);
            var query = new TableQuery<VoiceFile>().Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, JobId));
            var DetailsTable = table.ExecuteQuery(query);
            return DetailsTable.ToList();
        }

        public static void UpdateDetailsProcessed(string jobId,string jobName, string fileName, string Status, string processedTrascript, string LPRecognition, string LUISEntity, JToken AllLPRecognition, JToken AllLUISEntity)
        {            
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobDetailsTableName"]);

            TableOperation retrieveOperation = TableOperation.Retrieve<VoiceFile>(jobId, fileName);

            TableResult retrievedResult = table.Execute(retrieveOperation);

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

                if (AllLPRecognition!= null)
                {
                    updateEntity.LPRecognizedJson =  JsonConvert.SerializeObject(AllLPRecognition);
                }

                if (AllLUISEntity != null)
                {
                    updateEntity.LUISEntitiesJson = JsonConvert.SerializeObject(AllLUISEntity);
                }


                // Create the Replace TableOperation.
                TableOperation updateOperation = TableOperation.Replace(updateEntity);

                // Execute the operation.
                table.Execute(updateOperation);                
            }
        }
    }
}
