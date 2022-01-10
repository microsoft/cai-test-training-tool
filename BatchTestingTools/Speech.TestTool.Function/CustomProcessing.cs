using System;
using System.Configuration;
using Daimler.Speech.Function.Helpers;
using Daimler.Speech.Function.Infrastructure;
using Daimler.Speech.Function.Models;

using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Daimler.Speech.Function
{
    public static class CustomProcessing
    {
        static string PostProcessSvcBaseUri = ConfigurationManager.AppSettings["PostProcessSvcBaseUri"];

        [FunctionName("CustomProcessing")]
        public async static void Run([QueueTrigger("customprocessingtasks", Connection = "")]CustomProcesingTask myQueueItem, TraceWriter log)
        {
            try
            {
                log.Info("Custom Processing (JobId = "+ myQueueItem.JobId +" FileName= " + myQueueItem.FileName + " Message= "+ myQueueItem.Message +")");
                var postprocessorManager = new PostprocessorManager(PostProcessSvcBaseUri);

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

                BatchJobStorageHelper.UpdateDetailsProcessed(myQueueItem.JobId, myQueueItem.JobName, myQueueItem.FileName, JobDetailStatus, QueryProcessed, LPRecognition, LUISEntity, allCPLEntities, allLUISEntities);

                log.Info("Custom Processing Done (JobId = " + myQueueItem.JobId + " FileName= " + myQueueItem.FileName + " Message= " + myQueueItem.Message + ")");
            }
            catch (Exception ex)
            {
                log.Error(ex.Message, ex, "Custom Processing");
                BatchJobStorageHelper.UpdateDetailsProcessed(myQueueItem.JobId, myQueueItem.JobName, myQueueItem.FileName, "ProcessingFailed", "", "", "", null, null);
            }
        }
    }
}
