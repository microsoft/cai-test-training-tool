using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace Daimler.Speech.Web.Infrastructure
{
    public class LuisRecognizerManager
    {
        private string utterance;
        private string luisAppId;
        private string luisAppKey;
        private string luisEndpointUri;

        public LuisRecognizerManager(string utterance, string luisAppId, string luisAppKey, string region)
        {
            this.utterance = utterance;
            this.luisAppId = luisAppId;
            this.luisAppKey = luisAppKey;
            this.luisEndpointUri = $"https://{region}.api.cognitive.microsoft.com/luis/v2.0/apps/{luisAppId}";
        }

        public async Task<LuisResponseModel> GetRecognizedIntentAsync()
        {
            var intentResult = await RecognizeIntentAsync(utterance, luisAppKey).ConfigureAwait(false);
            return intentResult;
        }

        public async Task<LuisResponseModel> RecognizeIntentAsync(string utterance, string luisAppKey)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var queryString = HttpUtility.ParseQueryString(string.Empty);

                    // The request header contains your subscription key
                    client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", luisAppKey);

                    queryString["q"] = utterance;

                    // These optional request parameters are set to their default values
                    queryString["timezoneOffset"] = "0";
                    queryString["verbose"] = "false";
                    queryString["spellCheck"] = "false";
                    queryString["staging"] = "false";

                    var endpointUri = luisEndpointUri + "?" + queryString;
                    var result = await client.GetAsync(endpointUri);
                    var jsonResponseContent = await result.Content.ReadAsStringAsync();

                    if (result.IsSuccessStatusCode)
                    {
                        var luisResponseModel = JsonConvert.DeserializeObject<LuisResponseModel>(jsonResponseContent);
                        luisResponseModel.IsSuccess = true;
                        return luisResponseModel;
                    }

                    var jObject = JObject.Parse(jsonResponseContent);
                    var jToken = jObject.GetValue("message");

                    return new LuisResponseModel()
                    {
                        IsSuccess = false,
                        ErrorMessage = jToken.ToString()
                    };
                }
            }
            catch (Exception e)
            {
                return new LuisResponseModel()
                {
                    IsSuccess = false,
                    ErrorMessage = e.Message
                };
            }
        }
    }


    public class LuisResponseModel
    {
        //[JsonProperty("RecognizeSpeech")]
        public int Id { get; set; } = 1;
        public string Query { get; set; }
        public string QueryProcessed { get; set; }
        //public TopScoringIntent TopScoringIntent { get; set; }
        public ResolvedEntity[] Entities { get; set; }
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }

    public class TopScoringIntent
    {
        public string Intent { get; set; }
        public float Score { get; set; }
    }

    public class ResolvedEntity
    {
        public string Entity { get; set; }
        public string Type { get; set; }
        public int StartIndex { get; set; }
        public int EndIndex { get; set; }
        public float Score { get; set; }
    }



}
