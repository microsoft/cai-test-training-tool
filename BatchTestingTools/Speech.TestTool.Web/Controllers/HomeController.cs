using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Daimler.Speech.Web.Models;
using Daimler.Speech.Web.Infrastructure;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;
using Daimler.Speech.Web.Infrastructure.Constants;
using Microsoft.Extensions.Options;
using Daimler.Speech.Web.Helpers;
using Microsoft.WindowsAzure.Storage;
using Speech.TestTool.Function.Helpers;
using Microsoft.AspNetCore.Authorization;
using Speech.TestTool.Web.Models;
using System.Net.Http;
using Newtonsoft.Json;
using System.Globalization;
using Google.Cloud.TextToSpeech.V1;
using System.Text.Encodings.Web;
using Amazon.Polly;
using Amazon.Runtime;
using Microsoft.Extensions.Configuration;
using Amazon.Polly.Model;
using System.Web;

namespace Daimler.Speech.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly string MSSpeechServiceAuthenticationURL = "https://{0}.api.cognitive.microsoft.com/sts/v1.0/issueToken";
        private readonly string MSSpeechServiceVoicesURL = "https://{0}.tts.speech.microsoft.com/cognitiveservices/voices/list";
        private readonly ServicesSettings servicesSettings;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        public HomeController(IOptions<ServicesSettings> servicesSettings, HttpClient httpClient, IConfiguration configuration)
        {
            this.servicesSettings = servicesSettings.Value;
            this._httpClient = httpClient;
            this._configuration = configuration;
        }

        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> BatchTest()
        {

            string StorageConnectionString = servicesSettings.StorageConnectionString;

            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(StorageConnectionString);

            var customProjects = await SpeechModelsHelper.GetCustomProjects(servicesSettings.SpeechServiceKey, servicesSettings.Region + ".api.cognitive.microsoft.com", 443);

            var baseModels = await SpeechModelsHelper.GetBaseSpeechModels(servicesSettings.SpeechServiceKey, servicesSettings.Region + ".api.cognitive.microsoft.com", 443); ;

            List<string> locales = baseModels.Select(i => i.Locale).Distinct().ToList();

            locales.Sort();

            string SAS = storageAccount.GetSharedAccessSignature(new SharedAccessAccountPolicy() { Permissions = SharedAccessAccountPermissions.Write | SharedAccessAccountPermissions.Read, Services = SharedAccessAccountServices.Table | SharedAccessAccountServices.Blob, Protocols = SharedAccessProtocol.HttpsOnly, ResourceTypes = SharedAccessAccountResourceTypes.Container | SharedAccessAccountResourceTypes.Object | SharedAccessAccountResourceTypes.Service, SharedAccessExpiryTime = DateTimeOffset.Now.AddDays(1) });

            StorageDetails storageDetails = new StorageDetails() { StorageSAS = SAS, StorageAccountName = servicesSettings.StorageName };
            BatchJobPageData batchJobPageData = new BatchJobPageData() { BaseModels = baseModels, AllProjects = customProjects, BaseModelsLanguages = locales, StorageInfo = storageDetails };

            return View(batchJobPageData);
        }

        public async Task<IActionResult> AudioGeneration()
        {

            string StorageConnectionString = servicesSettings.StorageConnectionString;

            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(StorageConnectionString);

            List<string> SpeechTypes = servicesSettings.AudioGenerationSpeechTypes != null ? servicesSettings.AudioGenerationSpeechTypes.Split(",").ToList() : new List<string>();

            List<string> ttsLanguages = servicesSettings.TTSLanguages != null ? servicesSettings.TTSLanguages.Split(",").ToList() : new List<string>();

            List<SpeechVoice> speechVoices = await GetMicrosoftSpeechVoices();

            var GVoices = ListVoices();

            var AmazonVoices = await GetAmazonVoices();

            //List<string> SpeechVoices = new List<string>() { "Hedda","Stefan", "Katja (Neural)"};

            string SAS = storageAccount.GetSharedAccessSignature(new SharedAccessAccountPolicy() { Permissions = SharedAccessAccountPermissions.Write | SharedAccessAccountPermissions.Read, Services = SharedAccessAccountServices.Table | SharedAccessAccountServices.Blob, Protocols = SharedAccessProtocol.HttpsOnly, ResourceTypes = SharedAccessAccountResourceTypes.Container | SharedAccessAccountResourceTypes.Object | SharedAccessAccountResourceTypes.Service, SharedAccessExpiryTime = DateTimeOffset.Now.AddDays(1) });

            StorageDetails storageDetails = new StorageDetails() { StorageSAS = SAS, StorageAccountName = servicesSettings.StorageName };
            AudioGenerationPageData AudioGenerationJobPageData = new AudioGenerationPageData() { StorageInfo = storageDetails, SpeechTypes = SpeechTypes, MSSpeechVoices = speechVoices, GoogleVoices = GVoices, AmazonVoices = AmazonVoices, TTSLanguages = ttsLanguages };

            return View(AudioGenerationJobPageData);
        }

        private async Task<List<Amazon.Polly.Model.Voice>> GetAmazonVoices()
        {
            var amazonConfig = this._configuration.GetSection("AmazonPolly").Get<AmazonPollyConfiguration>();

            if (!string.IsNullOrEmpty(amazonConfig.AccessKeyId) && !string.IsNullOrEmpty(amazonConfig.KeySecret) && !string.IsNullOrEmpty(amazonConfig.Region))
            {



                AmazonPollyClient amazonPollyClient = new AmazonPollyClient(amazonConfig.AccessKeyId, amazonConfig.KeySecret, Amazon.RegionEndpoint.GetBySystemName(amazonConfig.Region));

                DescribeVoicesResponse describeVoicesResponse = await amazonPollyClient.DescribeVoicesAsync(new DescribeVoicesRequest());

                return describeVoicesResponse.Voices;
            }
            else
            {
                return new List<Amazon.Polly.Model.Voice>();
            }


        }


        // [START tts_list_voices]
        /// <summary>
        /// Lists all the voices available for speech synthesis.
        /// </summary>
        /// <param name="desiredLanguageCode">Language code to filter on</param>
        public List<Google.Cloud.TextToSpeech.V1.Voice> ListVoices(string desiredLanguageCode = "")
        {
            if (!string.IsNullOrEmpty(servicesSettings.GoogleAPPCredentials))
            {

                TextToSpeechClientBuilder textToSpeechClientBuilder = new TextToSpeechClientBuilder();
                textToSpeechClientBuilder.JsonCredentials = servicesSettings.GoogleAPPCredentials.ToString();
                TextToSpeechClient client = textToSpeechClientBuilder.Build();

                // Performs the list voices request
                var response = client.ListVoices(new ListVoicesRequest
                {
                    LanguageCode = desiredLanguageCode
                });

                return response.Voices.ToList();
            }
            else
            {
                return new List<Google.Cloud.TextToSpeech.V1.Voice>();
            }
        }


        private async Task<List<SpeechVoice>> GetMicrosoftSpeechVoices()
        {
            List<SpeechVoice> MSSpeechVoices;

            string token;
            using (var request = new HttpRequestMessage(HttpMethod.Post, string.Format(MSSpeechServiceAuthenticationURL, servicesSettings.TTSSpeechServiceRegion)))
            {
                request.Headers.Add("Ocp-Apim-Subscription-Key", this.servicesSettings.TTSSpeechServiceKey);
                var response = await this._httpClient.SendAsync(request).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    dynamic errMsg = (dynamic)JsonConvert.DeserializeObject(await response.Content.ReadAsStringAsync().ConfigureAwait(false));
                    throw new Exception(string.Format(
                        CultureInfo.CurrentCulture,
                        "StatusCode: {0}, ErrorCode: {1}, Error: {2}",
                        (int)response.StatusCode,
                        errMsg?.ErrorCode,
                        errMsg?.Error));
                }

                token = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                //token = JsonConvert.DeserializeObject<string>(result);

            }


            using (var request = new HttpRequestMessage(HttpMethod.Get, string.Format(MSSpeechServiceVoicesURL, servicesSettings.TTSSpeechServiceRegion)))
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                var response = await this._httpClient.SendAsync(request).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    dynamic errMsg = (dynamic)JsonConvert.DeserializeObject(await response.Content.ReadAsStringAsync().ConfigureAwait(false));
                    throw new Exception(string.Format(
                        CultureInfo.CurrentCulture,
                        "StatusCode: {0}, ErrorCode: {1}, Error: {2}",
                        (int)response.StatusCode,
                        errMsg?.ErrorCode,
                        errMsg?.Error));
                }

                var result = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                MSSpeechVoices = JsonConvert.DeserializeObject<List<SpeechVoice>>(result);

            }


            return MSSpeechVoices;
        }

        public async Task<IActionResult> BatchTestResults(string Id)
        {
            var batchJob = await BatchJobStorageHelper.GetJobsById(Id, servicesSettings.StorageConnectionString);
            var batchJobDetails = await BatchJobStorageHelper.GetJobDetails(batchJob.RowKey, servicesSettings.StorageConnectionString);
            foreach (var detail in batchJobDetails)
            {
                detail.ETag = "";
                detail.LPRecognizedJson = "";
                detail.LUISEntitiesJson = "";
            }

            var LPResults = batchJobDetails.Where(i => !string.IsNullOrEmpty(i.ValidationLPRRecognized)).Select(u => new VoiceFile { LPRScore = u.LPRScore, LUISEntities = u.LUISEntities, RowKey = u.RowKey, ValidationLPRRecognized = u.ValidationLPRRecognized, LPTranscript = u.LPTranscript, Recognized = u.Recognized }).ToList();

            BatchJobResults batchJobResults = new BatchJobResults() { Job = batchJob, JobDetails = batchJobDetails, LPDetails = LPResults };
            return View(batchJobResults);
        }

        public async Task<IActionResult> AudioGenerationResults(string Id)
        {
            var batchJob = await AudioGenerationJobStorageHelper.GetJobsById(Id, servicesSettings.StorageConnectionString);
            var batchJobDetails = await AudioGenerationJobStorageHelper.GetJobDetails(batchJob.RowKey, servicesSettings.StorageConnectionString);
            foreach (var detail in batchJobDetails)
            {
                detail.Transcript = HttpUtility.HtmlEncode(detail.Transcript);
                detail.ETag = "";
                detail.Exception = "";
            }

            AudioGenerationResults batchJobResults = new AudioGenerationResults() { Job = batchJob, JobDetails = batchJobDetails };
            return View(batchJobResults);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult LuisMic()
        {

            HttpContext.Session.SetString(SessionKeys.SpeechServiceSessionKey, servicesSettings.SpeechServiceKey);
            //HttpContext.Session.SetString(SessionKeys.SpeechRegionSessionKey, "northeurope");
            HttpContext.Session.SetString(SessionKeys.SpeechEndpointIdSessionKey, servicesSettings.SpeechEndpointId);
            HttpContext.Session.SetString(SessionKeys.LUISAppIdSessionKey, servicesSettings.LUISAppIdKey);
            HttpContext.Session.SetString(SessionKeys.LUISAppKeySessionKey, servicesSettings.LUISAppKey);

            var model = new LuisMicViewModel()
            {
                SpeechServiceKey = MaskString(HttpContext.Session.GetString(SessionKeys.SpeechServiceSessionKey)),
                SpeechRegion = "westeurope",
                EndpointId = HttpContext.Session.GetString(SessionKeys.SpeechEndpointIdSessionKey),
                LUISAppId = MaskString(HttpContext.Session.GetString(SessionKeys.LUISAppIdSessionKey)),
                LUISAppKey = MaskString(HttpContext.Session.GetString(SessionKeys.LUISAppKeySessionKey))
            };
            return View(model);
        }



        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        private string MaskString(string input)
        {

            if (string.IsNullOrEmpty(input))
            {
                return string.Empty;
            }

            var firstDigits = input.Substring(0, 6);
            var lastDigits = input.Substring(input.Length - 6, 6);

            var requiredMask = new String('X', input.Length - firstDigits.Length - lastDigits.Length);

            var maskedString = string.Concat(firstDigits, requiredMask, lastDigits);
            //var maskedInputWithSpaces = Regex.Replace(maskedString, ".{4}", "$0 ");
            return maskedString;
        }
    }
}
