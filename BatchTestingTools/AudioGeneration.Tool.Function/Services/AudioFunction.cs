using AudioGeneration.Tool.Function.Helpers;
using AudioGeneration.Tool.Function.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace AudioGeneration.Tool.Function.Services
{
    public class AudioFunction : IAudioFunction
    {

        /// <summary>
        /// Defines the httpClient
        /// </summary>
        private readonly HttpClient httpClient;

        /// <summary>
        /// The API configuration
        /// </summary>
        private readonly AudioFunctionApiConfiguration apiConfiguration;


        public AudioFunction(HttpClient httpClient, AudioFunctionApiConfiguration apiConfiguration)
        {
            this.httpClient = httpClient;
            this.apiConfiguration = apiConfiguration;
        }

        public async Task<AudioGenerationResponse> GetGeneratedAudioAsync(AudioGenerationRequest audioGenerationRequest)
        {
            AudioGenerationResponse audioGeneration;
            var uriBuilder = new UriBuilder($"{this.apiConfiguration.BaseUrl}/{this.apiConfiguration.Api}");

            var query = HttpUtility.ParseQueryString(uriBuilder.Query);

            query[Constants.AudioFunctionQueries.AudioFont] = audioGenerationRequest.AudioFont;
            query[Constants.AudioFunctionQueries.JobId] = audioGenerationRequest.JobId;
            query[Constants.AudioFunctionQueries.Language] = audioGenerationRequest.Language;
            query[Constants.AudioFunctionQueries.Level] = audioGenerationRequest.Level.ToString();
            query[Constants.AudioFunctionQueries.Text] = HttpUtility.HtmlEncode(audioGenerationRequest.Text);
            query[Constants.AudioFunctionQueries.Transcribe] = audioGenerationRequest.GenerateTranscript.ToString();
            query[Constants.AudioFunctionQueries.TTSProvider] = audioGenerationRequest.TTSProvider;

            uriBuilder.Query = query.ToString();

            using (var request = new HttpRequestMessage(HttpMethod.Get, uriBuilder.Uri))
            {
                request.Headers.Add("x-functions-key", this.apiConfiguration.Key);
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

                var result = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                audioGeneration = JsonConvert.DeserializeObject<AudioGenerationResponse>(result);

            }

            return audioGeneration;
        }
    }
}
