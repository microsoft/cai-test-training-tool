using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BatchTesting.Tool.Function.Helpers;
using BatchTesting.Tool.Function.Models;
using BatchTesting.Tool.Function.WER;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage.Table;

namespace BatchTesting.Tool.Function
{
    public class JobStatusUpdater
    {
        private readonly IConfiguration configuration;

        private readonly string storageConnectionString;

        private readonly string batchJobTableName;

        private readonly string batchJobDetailsTableName;

        private readonly string WERFunctionURL;
        private readonly string WERFunctionKey;

        public JobStatusUpdater(IConfiguration configuration)
        {
            this.configuration = configuration;
            storageConnectionString = this.configuration.GetConnectionString("TableStorageConnectionString");

            batchJobTableName = this.configuration.GetValue<string>("BatchJobTableName");
            batchJobDetailsTableName = this.configuration.GetValue<string>("BatchJobDetailsTableName");

            WERFunctionURL = this.configuration.GetValue<string>("WERFunctionURL");
            WERFunctionKey = this.configuration.GetValue<string>("WERFunctionKey");
        }


        [FunctionName("JobStatusUpdater")]
        public async Task Run([TimerTrigger("0 */5 * * * *")] TimerInfo myTimer, ILogger log)
        {
            try
            {
                var BatchJobs = await BatchJobStorageHelper.GetJobsWithStatus("Finished Speech Recognition", storageConnectionString, batchJobTableName);

                foreach (var jobs in BatchJobs)
                {
                    var JobDetails = await BatchJobStorageHelper.GetJobDetails(jobs.RowKey, storageConnectionString, batchJobDetailsTableName);
                    if (jobs.FilesCount == JobDetails.Where(i => i.Status == "Processed" || i.Status == "NotRecognized" || i.Status == "MissingReferenceTrancript" || i.Status == "SpeechDelayed" || i.Status == "ProcessingFailed" || i.Status == "SpeechFailed").Count())
                    {
                        await BatchTestValidation(jobs, JobDetails);
                    }
                    var detailsStuckInProcessing = JobDetails.Where(i => i.Status == "Recognized" && DateTime.UtcNow.Subtract(i.Timestamp.UtcDateTime).TotalMinutes >= 1 && DateTime.UtcNow.Subtract(i.Timestamp.UtcDateTime).TotalMinutes <= 600).ToList();

                    foreach (var jobDetail in detailsStuckInProcessing)
                    {
                        await QueueMessageHelper.SaveCustomProcessingTaskAsync(new CustomProcesingTask() { JobId = jobs.RowKey, Message = jobDetail.Recognized, FileName = jobDetail.RowKey, JobName = jobs.JobName, CPLName = "LPR" }, storageConnectionString);
                    }

                }
            }
            catch (Exception ex)
            {
                log.LogError(ex.Message, ex);
            }
        }

        private async Task BatchTestValidation(BatchJob jobs, List<VoiceFile> jobDetails)
        {
            List<TranscriptPair> transcriptPairs = new List<TranscriptPair>();
            if (!string.IsNullOrEmpty(jobs.LPReferenceFilename))
            {
                transcriptPairs = await Common.GetTranscriptValues(jobs.RowKey, jobs.LPReferenceFilename, storageConnectionString);
            }


            List<ValidationItem> validationItems = new List<ValidationItem>();


            foreach (var jobDetail in jobDetails)
            {
                var transcriptPair = transcriptPairs.FirstOrDefault(i => i.FileName == jobDetail.RowKey);

                validationItems.Add(new ValidationItem() { Id = jobDetail.RowKey, Recognized = string.IsNullOrEmpty(jobDetail.Processed) ? "" : jobDetail.Processed, Reference = jobDetail.Transcript, LPRecognized = transcriptPair != null ? string.IsNullOrEmpty(jobDetail.LPRecognized) ? "" : jobDetail.LPRecognized : jobDetail.LPRecognized, LPReference = transcriptPair != null ? transcriptPair.Transcript : null });
            }

            var results = await WERHelper.GetWERValue(validationItems, WERFunctionURL, WERFunctionKey);

            if (results != null)
            {
                await UpdateJobDetails(jobs.RowKey, results);
                string jobStatus = "Done";
                bool isErrorAvailable = false;

                if (jobDetails.FindIndex(i => i.Status == "SpeechFailed") > -1)
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

                await BatchJobStorageHelper.UpdateBatchJobStatus(jobs.RowKey, storageConnectionString, batchJobTableName, jobStatus, results, "100%");
            }
            else
            {
                await BatchJobStorageHelper.UpdateBatchJobStatus(jobs.RowKey, "Failure in final test results step", null, "100%");
            }
        }



        private async Task UpdateJobDetails(string JobId, WERResults results)
        {
            var table = AzureTableStorageHelper.GetTable(storageConnectionString, batchJobDetailsTableName);
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

    }
}
