using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Speech.TestTool.Web.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Services
{
    public class AudioBatch : IAudioBatch
    {
        /// <summary>
        /// Defines the httpClient
        /// </summary>
        private readonly HttpClient httpClient;

        /// <summary>
        /// The API configuration
        /// </summary>
        private readonly AudioBatchFunctionConfiguration apiConfiguration;

        public AudioBatch(HttpClient httpClient, AudioBatchFunctionConfiguration apiConfiguration)
        {
            this.httpClient = httpClient;
            this.apiConfiguration = apiConfiguration;
        }
        public async Task SendAudioGenerationJobAsync(AudioGenerationBatchRequest audioGenerationRequest)
        {
            var uriBuilder = new UriBuilder($"{this.apiConfiguration.BaseUrl}/{this.apiConfiguration.Api}");

            var serializerSettings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };

            var requestString = JsonConvert.SerializeObject(audioGenerationRequest, serializerSettings);


            using (var request = new HttpRequestMessage(HttpMethod.Post, uriBuilder.Uri))
            {
                if(!string.IsNullOrEmpty(this.apiConfiguration.Key))
                {
                    request.Headers.Add("x-functions-key", this.apiConfiguration.Key);
                }
                
                request.Content = new StringContent(requestString, Encoding.UTF8, "application/json");
                var response = await this.httpClient.SendAsync(request).ConfigureAwait(false);

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

            }

        }
    }
}
