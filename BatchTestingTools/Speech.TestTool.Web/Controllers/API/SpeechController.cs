using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Daimler.Speech.Web.Helpers;
using Daimler.Speech.Web.Infrastructure;
using Daimler.Speech.Web.Infrastructure.Constants;
using Daimler.Speech.Web.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CognitiveServices.Speech;
using Microsoft.Extensions.Options;
using Microsoft.WindowsAzure.Storage.Blob;
using Speech.TestTool.Web.Models;
using Speech.TestTool.Web.Services;

namespace Daimler.Speech.Web.Controllers.API
{
    [Route("api/speech")]
    [ApiController]
    public class SpeechController : ControllerBase
    {      
        private readonly IHostingEnvironment _host;

        private readonly ServicesSettings servicesSettings;

        private readonly IAudioBatch AudioBatch;

        public SpeechController(IHostingEnvironment host, IOptions<ServicesSettings> servicesSettings, IAudioBatch audioBatch)
        {
            _host = host;
            this.servicesSettings = servicesSettings.Value;
            this.AudioBatch = audioBatch;
        }


        [HttpGet("accesstoken")]
        public async Task<TokenResponseModel> GetSpeechAccessToken(string subscriptionKey = "", string region ="")
        {

            if (subscriptionKey.Contains("X"))
            {
                subscriptionKey = this.servicesSettings.SpeechServiceKey;
            }

            var speechTokenManager = new SpeechTokenManager(subscriptionKey, region);

            var tokenResponseModel = await speechTokenManager.GetAccessTokenAsync();

            return tokenResponseModel;
        }

        [HttpGet("RecognizeIntent")]
        public async Task<LuisResponseModel> RecognizeIntent(string utterance, string region, string luisAppId = "", string luisAppKey = "")
        {

            if (luisAppId.Contains("X"))
            {
                luisAppId = this.servicesSettings.LUISAppIdKey;
            }

            if (luisAppKey.Contains("X"))
            {
                luisAppKey = this.servicesSettings.LUISAppKey;
            }

            var luisRecognizerManager = new LuisRecognizerManager(utterance, luisAppId, luisAppKey, region);

            var luisResponseModel = await luisRecognizerManager.GetRecognizedIntentAsync();

            var postprocessorManager = new PostprocessorManager(servicesSettings.PostProcessSvcBaseUri, servicesSettings.PostProcessAuthentication);

            var processedResponseModel = await postprocessorManager.GetPostProcessedResultAsync(luisResponseModel);

            return processedResponseModel;
        }

        [HttpGet("SaveJob")]
        public async Task SaveJob(string jobName, string fileName, string fileNameGuid, string transcriptFileName,string languageModelName, string AcousticModelName, string languageModelId, string AcousticModelId, string LPReference)
        {
           string BatchJobId = jobName + "-" + fileNameGuid;
            BatchJob batchJob = new BatchJob(BatchJobId)
            {
                JobName = jobName,
                Status = "Files Uploaded",
                TranscriptFileName = transcriptFileName,
                CompletionPercentage = "1%",
                SpeechLanguageModelId = languageModelId=="null"? null:languageModelId,
                SpeechAcousticModelId= AcousticModelId == "null" ? null : AcousticModelId,
                SpeechAcousticModelName = AcousticModelName,
                SpeechLanguageModelName = languageModelName,
                LPReferenceFilename = LPReference
            };
            await BatchJobStorageHelper.SaveBatchJobAsync(batchJob, servicesSettings.StorageConnectionString, "BatchJobs");

            await QueueMessageHelper.SaveVoicesFilesTaskAsync(servicesSettings.StorageConnectionString, new VoicesFilesTask() { BatchJobId = BatchJobId, JobName = jobName, FileName = fileName, TranscriptFileName = transcriptFileName, SpeechLanguageModelId = languageModelId,SpeechAcousticModelId=AcousticModelId, LPReferenceFilename = LPReference });            
        }

        [HttpGet("SaveAudioGenerationJob")]
        public async Task SaveAudioGenerationJob(string jobName, string fileNameGuid, string transcriptFileName, string speechType, string language, string audioFont)
        {
            string AudioGenerationJobId = jobName + "-" + fileNameGuid;
            AudioGenerationJob batchJob = new AudioGenerationJob(AudioGenerationJobId)
            {
               JobName = jobName,
               Status = "Files Uploaded",
               TranscriptFileName = transcriptFileName,
               CompletionPercentage = "1%",
               SpeechServiceType = speechType,
               AudioFont = audioFont,
               AudioLanguage = language
            };
            await AudioGenerationJobStorageHelper.SaveAudioGenerationJobAsync(batchJob, servicesSettings.StorageConnectionString);

            await AudioBatch.SendAudioGenerationJobAsync(new AudioGenerationBatchRequest() {
                TTSProvider = speechType,
                Jobname = jobName,
                TranscriptFile = transcriptFileName,
                GenerateTranscript = false,
                Level = 2,
                Language = language,
                AudioFont = audioFont,
                JobId = AudioGenerationJobId

            });

            }


        [HttpGet("HideAudioGenerationJob")]
        public async Task HideAudioGenerationJob(string jobId)
        {
            var testJob = await AudioGenerationJobStorageHelper.GetJobsById(jobId, this.servicesSettings.StorageConnectionString);

            testJob.hide = true;

            AudioGenerationJobStorageHelper.UpdateBatchJob(testJob, this.servicesSettings.StorageConnectionString);
        }

        [HttpGet("HideJob")]
        public async Task HideJob(string jobId)
        {
            var testJob = await BatchJobStorageHelper.GetJobsById(jobId, this.servicesSettings.StorageConnectionString);

            testJob.hide = true;

            BatchJobStorageHelper.UpdateBatchJob(testJob, this.servicesSettings.StorageConnectionString);
        }

        [HttpGet("RestartJob")]
        public async Task RestartJob(string jobId)
        {
            await BatchJobStorageHelper.DeleteJobDetails(servicesSettings.StorageConnectionString, jobId);

            var Job = await BatchJobStorageHelper.GetJobsById(jobId, servicesSettings.StorageConnectionString);

            await QueueMessageHelper.SaveVoiceTaskAsync(servicesSettings.StorageConnectionString, new SpeechTask() { JobName = Job.JobName, TranscriptFileName = Job.TranscriptFileName, JobId = jobId, SpeechLanguageModelId = Job.SpeechLanguageModelId, SpeechAcousticModelId = Job.SpeechAcousticModelId });

            await BatchJobStorageHelper.UpdateBatchJobStatus(servicesSettings.StorageConnectionString, jobId, "Job Restarted", "5%");
        }


        [HttpGet("TranscribeAudioFiles")]
        public async Task<List<LuisResponseModel>> TranscribeAudioFiles(string runid, string region, string locale, string speechAccessToken, string endPointId = "", string luisAppId = "", string luisAppKey = "")
        {
            var luisResponseList = new List<LuisResponseModel>();

            var config = SpeechConfig.FromSubscription("6163316aec59453985977e3429b91d33", region);

            config.SpeechRecognitionLanguage = locale;
            
            var fileSpeechRecognizer = new FileSpeechRecognizer(config, _host);

            var result = await  fileSpeechRecognizer.StartRecognetionAsync();

            foreach (var item in result)
            {
                var luisRecognizerManager = new LuisRecognizerManager(item.Value, luisAppId, luisAppKey, region);

                var luisResponseModel = await luisRecognizerManager.GetRecognizedIntentAsync();

                luisResponseList.Add(luisResponseModel);
            }


            return luisResponseList;
        }

    }
}
