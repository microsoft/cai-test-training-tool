using Newtonsoft.Json;
using Speech.TestTool.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.CrisClient
{
    public class CrisClient
    {
        private const int MinRetryBackoffInMilliseconds = 10;
        private const int MaxRetryBackoffInMilliseconds = 100;
        private const int MaxNumberOfRetries = 5;
        private const string OneAPIOperationLocationHeaderKey = "Operation-Location";

        private readonly HttpClient client;
        private readonly string speechToTextBasePath;

        private CrisClient(HttpClient client)
        {
            this.client = client;
            speechToTextBasePath = "speechtotext/v3.0/";
        }

        public static CrisClient CreateApiV2Client(string key, string hostName, int port)
        {
            var client = new HttpClient();
            client.Timeout = TimeSpan.FromMinutes(25);
            client.BaseAddress = new UriBuilder(Uri.UriSchemeHttps, hostName, port).Uri;

            client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", key);

            return new CrisClient(client);
        }

        public async Task<SpeechModelsV3> GetCustomModelsAsync()
        {
            var path = $"{this.speechToTextBasePath}models";
            List<ModelV3> models = new List<ModelV3>();
            var result = await this.GetAsync<SpeechModelsV3>(path);
            models.AddRange(result.Models);
            while (result.NextLink != null)
            {
                result = await this.GetAsync<SpeechModelsV3>(result.NextLink.ToString());
                models.AddRange(result.Models);
            }

            result.Models = models;

            return result;
        }


        public async Task<SpeechModelsV3> GetBaseModelsAsync()
        {
            var path = $"{this.speechToTextBasePath}models/base";
            List<ModelV3> models = new List<ModelV3>();
            var result = await this.GetAsync<SpeechModelsV3>(path);
            models.AddRange(result.Models);
            while (result.NextLink != null)
            {
                result = await this.GetAsync<SpeechModelsV3>(result.NextLink.ToString());
                models.AddRange(result.Models);
            }

            result.Models = models;

            return result;
        }



        public async Task<List<Project>> GetCustomProjectsAsync()
        {
            var path = $"{this.speechToTextBasePath}projects";
            List<Project> projects = new List<Project>();
            var result = await this.GetAsync<ProjectsV3>(path);
            projects.AddRange(result.Projects);
            while (result.NextLink != null)
            {
                result = await this.GetAsync<ProjectsV3>(result.NextLink.ToString());
                projects.AddRange(result.Projects);
            }

            foreach (Project project in projects)
            {
                List<ModelV3> models = new List<ModelV3>();
                var modelResult = await this.GetAsync<SpeechModelsV3>(project.links.models);
                models.AddRange(modelResult.Models);
                while (modelResult.NextLink != null)
                {
                    modelResult = await this.GetAsync<SpeechModelsV3>(modelResult.NextLink.ToString());
                    models.AddRange(modelResult.Models);
                }

                project.Models = models;
            }

            return projects;
        }


        private static async Task<Uri> GetLocationFromPostResponseAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw await CreateExceptionAsync(response).ConfigureAwait(false);
            }

            IEnumerable<string> headerValues;
            if (response.Headers.TryGetValues(OneAPIOperationLocationHeaderKey, out headerValues))
            {
                if (headerValues.Any())
                {
                    return new Uri(headerValues.First());
                }
            }

            return response.Headers.Location;
        }

        private async Task<Uri> PostAsJsonAsync<TPayload>(string path, TPayload payload)
        {
            var cc = new StringContent("");
            using (var response = await this.client.PostAsync(path, cc).ConfigureAwait(false))
            {
                return await GetLocationFromPostResponseAsync(response).ConfigureAwait(false);
            }
        }

        private async Task<TResponse> GetAsync<TResponse>(string path)
        {
            using (var response = await this.client.GetAsync(path).ConfigureAwait(false))
            {
                var contentType = response.Content.Headers.ContentType;

                if (response.IsSuccessStatusCode && string.Equals(contentType.MediaType, "application/json", StringComparison.OrdinalIgnoreCase))
                {
                    var result = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                    return JsonConvert.DeserializeObject<TResponse>(result);
                }
                else
                {
                    throw new Exception("Error in Calling Service, Error: " + response.StatusCode);
                }
            }
        }

        private static async Task<FailedHttpClientRequestException> CreateExceptionAsync(HttpResponseMessage response)
        {
            switch (response.StatusCode)
            {
                case HttpStatusCode.Forbidden:
                    return new FailedHttpClientRequestException(response.StatusCode, "No permission to access this resource.");
                case HttpStatusCode.Unauthorized:
                    return new FailedHttpClientRequestException(response.StatusCode, "Not authorized to see the resource.");
                case HttpStatusCode.NotFound:
                    return new FailedHttpClientRequestException(response.StatusCode, "The resource could not be found.");
                case HttpStatusCode.UnsupportedMediaType:
                    return new FailedHttpClientRequestException(response.StatusCode, "The file type isn't supported.");
                case HttpStatusCode.BadRequest:
                    {
                        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                        var shape = new { Message = string.Empty };
                        var result = JsonConvert.DeserializeAnonymousType(content, shape);
                        if (result != null && !string.IsNullOrEmpty(result.Message))
                        {
                            return new FailedHttpClientRequestException(response.StatusCode, result.Message);
                        }

                        return new FailedHttpClientRequestException(response.StatusCode, response.ReasonPhrase);
                    }

                default:
                    return new FailedHttpClientRequestException(response.StatusCode, response.ReasonPhrase);
            }
        }
    }
}
