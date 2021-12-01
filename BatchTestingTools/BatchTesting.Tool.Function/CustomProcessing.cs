using System;
using System.Threading.Tasks;
using BatchTesting.Tool.Function.Helpers;
using BatchTesting.Tool.Function.Infrastructure;
using BatchTesting.Tool.Function.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace BatchTesting.Tool.Function
{
    public class CustomProcessing
    {

        private readonly IConfiguration configuration;

        private readonly string storageConnectionString;

        private readonly string batchJobDetailsTableName;

        public CustomProcessing(IConfiguration configuration)
        {
            this.configuration = configuration;
            storageConnectionString = this.configuration.GetConnectionString("TableStorageConnectionString");

            batchJobDetailsTableName = this.configuration.GetValue<string>("BatchJobDetailsTableName");
        }

        [FunctionName("CustomProcessing")]
        public async Task Run([QueueTrigger("customprocessingtasks", Connection = "TableStorageConnectionString")] CustomProcesingTask myQueueItem, ILogger log)
        {
            try
            {
                log.LogInformation("Custom Processing (JobId = " + myQueueItem.JobId + " FileName= " + myQueueItem.FileName + " Message= " + myQueueItem.Message + ")");
                var postprocessorManager = new PostprocessorManager( configuration);

                var processedResponseModel = await postprocessorManager.GetPostProcessedResultAsync(myQueueItem.Message, myQueueItem.CPLName);

                string LPRecognition = string.Empty;
                string LUISEntity = string.Empty;
                JToken allCPLEntities = null;
                JToken allLUISEntities = null;
                string QueryProcessed = string.Empty;
                string JobDetailStatus = string.Empty;

                if (processedResponseModel != null)
                {

                    QueryProcessed = processedResponseModel["cplQuery"]?.ToString();
                    if (processedResponseModel["cplEntities"].HasValues)
                    {
                        allCPLEntities = processedResponseModel["cplEntities"];
                        foreach (var lpEntity in processedResponseModel["cplEntities"])
                        {
                            LPRecognition += (!string.IsNullOrEmpty(LPRecognition) ? ", " : "") + lpEntity?["entity"]?.ToString();
                        }
                    }

                    if (processedResponseModel["entities"].HasValues)
                    {
                        allLUISEntities = processedResponseModel["entities"];
                        foreach (var lpLUISEntity in processedResponseModel["entities"])
                        {
                            LUISEntity += (!string.IsNullOrEmpty(LUISEntity) ? ", " : "") + lpLUISEntity?["entity"]?.ToString();
                        }
                    }

                    JobDetailStatus = "Processed";
                }
                else
                {
                    JobDetailStatus = "ProcessingFailed";
                }

                await BatchJobStorageHelper.UpdateDetailsProcessed(myQueueItem.JobId, myQueueItem.JobName, myQueueItem.FileName, JobDetailStatus, QueryProcessed, LPRecognition, LUISEntity, allCPLEntities, allLUISEntities, storageConnectionString, batchJobDetailsTableName);

                log.LogInformation("Custom Processing Done (JobId = " + myQueueItem.JobId + " FileName= " + myQueueItem.FileName + " Message= " + myQueueItem.Message + ")");
            }
            catch (Exception ex)
            {
                log.LogError(ex.Message, ex, "Custom Processing");
                await BatchJobStorageHelper.UpdateDetailsProcessed(myQueueItem.JobId, myQueueItem.JobName, myQueueItem.FileName, "ProcessingFailed", "", "", "", null, null, storageConnectionString, batchJobDetailsTableName);
            }
        }
    }
}
