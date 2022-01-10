using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Daimler.Speech.Function.Helpers;
using Daimler.Speech.Function.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table;
using Microsoft.WindowsAzure.Storage.Table.Protocol;
using Speech.TestTool.Function.Helpers;
using Speech.TestTool.Function.Models;
using Speech.TestTool.Function.WER;

namespace Speech.TestTool.Function
{
    public static class JobStatusUpdater
    {
        [FunctionName("JobStatusUpdater")]
        public async static void Run([TimerTrigger("0 */3 * * * *")]TimerInfo myTimer, TraceWriter log)
        {
            try
            {
                var BatchJobs = BatchJobStorageHelper.GetJobsWithStatus("Finished Speech Recognition");

                foreach (var jobs in BatchJobs)
                {
                    var JobDetails = BatchJobStorageHelper.GetJobDetails(jobs.RowKey);
                    if (jobs.FilesCount == JobDetails.Where(i => i.Status == "Processed" || i.Status == "NotRecognized" || i.Status == "MissingReferenceTrancript" || i.Status == "SpeechDelayed" || i.Status == "ProcessingFailed" || i.Status == "SpeechFailed").Count())
                    {
                        await BatchTestValidation(jobs, JobDetails);
                    }
                    var detailsStuckInProcessing = JobDetails.Where(i => i.Status == "Recognized" && DateTime.UtcNow.Subtract(i.Timestamp.UtcDateTime).TotalMinutes >= 1 && DateTime.UtcNow.Subtract(i.Timestamp.UtcDateTime).TotalMinutes<=600).ToList();

                    foreach (var jobDetail in detailsStuckInProcessing)
                    {
                        await QueueMessageHelper.SaveCustomProcessingTaskAsync(new CustomProcesingTask() { JobId = jobs.RowKey, Message = jobDetail.Recognized, FileName = jobDetail.RowKey, JobName = jobs.JobName, CPLName = "LPR" });
                    }

                }
            }
            catch (Exception ex)
            {
                log.Error(ex.Message, ex);
            }
        }

        private async static Task BatchTestValidation(BatchJob jobs, List<VoiceFile> jobDetails)
        {
            var transcriptPairs = Common.GetTranscriptValues(jobs.RowKey, jobs.LPReferenceFilename);

            List<ValidationItem> validationItems = new List<ValidationItem>();


            foreach (var jobDetail in jobDetails)
            {
                var transcriptPair = transcriptPairs.FirstOrDefault(i => i.FileName == jobDetail.RowKey);

                validationItems.Add(new ValidationItem() { Id = jobDetail.RowKey, Recognized = string.IsNullOrEmpty( jobDetail.Processed)? "" : jobDetail.Processed, Reference = jobDetail.Transcript, LPRecognized = transcriptPair != null? string.IsNullOrEmpty(jobDetail.LPRecognized)?"": jobDetail.LPRecognized : jobDetail.LPRecognized, LPReference = transcriptPair != null ? transcriptPair.Transcript : null });
            }

            var results = await WERHelper.GetWERValue(validationItems);

            if (results != null)
            {
                await UpdateJobDetails(jobs.RowKey, results);
                string jobStatus = "Done";
                bool isErrorAvailable = false;

                if (jobDetails.FindIndex(i => i.Status == "SpeechFailed") > -1 )
                { 
                    if (!isErrorAvailable)
                    {
                        jobStatus += " With Errors: ";
                        isErrorAvailable = true;
                    }

                    jobStatus += "\n - " + "Speech Failed";
                }

                if (jobDetails.FindIndex(i => i.Status == "SpeechDelayed") > -1)
                {
                    if (!isErrorAvailable)
                    {
                        jobStatus += " With Errors: ";
                        isErrorAvailable = true;
                    }

                    jobStatus += "\n - " + "Speech Delayed";
                }

                if (jobDetails.FindIndex(i => i.Status == "ProcessingFailed") > -1)
                {
                    if (!isErrorAvailable)
                    {
                        jobStatus += " With Errors: ";
                        isErrorAvailable = true;
                    }

                    jobStatus += "\n - " + "Processing Failed";
                }

                if (jobDetails.FindIndex(i => i.Status == "MissingReferenceTrancript") > -1)
                {
                    if (!isErrorAvailable)
                    {
                        jobStatus += " With Errors: ";
                        isErrorAvailable = true;
                    }

                    jobStatus += "\n - " + "Missing Reference Trancript";
                }

                BatchJobStorageHelper.UpdateBatchJobStatus(jobs.RowKey, jobStatus, results, "100%");
            }
            else
            {
                BatchJobStorageHelper.UpdateBatchJobStatus(jobs.RowKey, "Failure in final test results step", null, "100%");
            }
        }



        private async static Task UpdateJobDetails(string JobId, WERResults results)
        {
            var table = AzureTableStorageHelper.GetTable(ConfigurationManager.AppSettings["StorageConnectionString"], ConfigurationManager.AppSettings["BatchJobDetailsTableName"]);
            TableBatchOperation batchOperation = new TableBatchOperation();

            foreach (var sttResult in results.stt)
            {
                VoiceFile voiceFile = new VoiceFile(JobId, sttResult.id);
                voiceFile.Score = sttResult.score;
                voiceFile.ValidationRecognized = sttResult.rec;
                var lPRResult = results.lpr.FirstOrDefault(i => i.id == sttResult.id);
                if (lPRResult != null)
                {
                    voiceFile.ValidationLPRRecognized = lPRResult.rec;
                    voiceFile.LPRScore = lPRResult.score;
                    voiceFile.LPTranscript = lPRResult.@ref;
                }
                batchOperation.InsertOrMerge(voiceFile);
            }
            if (batchOperation.Count > 0)
            {
                await table.ExecuteBatchAsLimitedBatches(batchOperation);
            }
            
        }

        private static bool IsBatchCountUnderSupportedOperationsLimit(TableBatchOperation batch)
        {
            return batch.Count <= TableConstants.TableServiceBatchMaximumOperations;
        }

        private static IEnumerable<List<TableOperation>> GetLimitedBatchOperationLists(TableBatchOperation batch)
        {
            return batch.ChunkBy(TableConstants.TableServiceBatchMaximumOperations);
        }

        private static TableBatchOperation CreateLimitedTableBatchOperation(IEnumerable<TableOperation> limitedBatchOperationList)
        {
            var limitedBatch = new TableBatchOperation();
            foreach (var limitedBatchOperation in limitedBatchOperationList)
            {
                limitedBatch.Add(limitedBatchOperation);
            }

            return limitedBatch;
        }

        public async static Task<IList<TableResult>> ExecuteBatchAsLimitedBatches(this CloudTable table,
                                                              TableBatchOperation batch)
        {
            if (IsBatchCountUnderSupportedOperationsLimit(batch))
            {
                return await table.ExecuteBatchAsync(batch);
            }

            var result = new List<TableResult>();
            var limitedBatchOperationLists = GetLimitedBatchOperationLists(batch);
            foreach (var limitedBatchOperationList in limitedBatchOperationLists)
            {
                var limitedBatch = CreateLimitedTableBatchOperation(limitedBatchOperationList);
                var limitedBatchResult = await table.ExecuteBatchAsync(limitedBatch);
                result.AddRange(limitedBatchResult);
            }

            return result;
        }


    }
}
