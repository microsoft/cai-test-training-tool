using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Infrastructure
{
    public class PostprocessorManager
    {
    
        private readonly string _baseUri;

        private readonly string _authorizationKey;

        public PostprocessorManager( string baseUri, string authorizationKey)
        {
            _baseUri = baseUri;
            _authorizationKey = authorizationKey;
        }

        public async Task<LuisResponseModel> GetPostProcessedResultAsync(LuisResponseModel inputModel)
        {
            var postProcessedResult = await PostProcessedResultAsync(inputModel).ConfigureAwait(false);
            return postProcessedResult;
        }

        public async Task<LuisResponseModel> PostProcessedResultAsync(LuisResponseModel inputModel)
        {
            try
            {
                using (var client = new HttpClient())
                {
         
                    var requestBody = new LuisResponseModel[] { inputModel };

                    var serializerSettings = new JsonSerializerSettings
                    {
                        ContractResolver = new CamelCasePropertyNamesContractResolver()
                    };

                    var requestString = JsonConvert.SerializeObject(requestBody, serializerSettings);

                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authorizationKey);
                    
                    var response = await client.PostAsync(_baseUri, new StringContent(requestString, Encoding.UTF8, "application/json"));
                    var jsonResponseContent = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {

                        var jArray = JArray.Parse(jsonResponseContent);
                        var jToken = jArray[0]["text"];
                        var queryProcessed = jToken.ToString();

                        inputModel.QueryProcessed = queryProcessed;

                        return inputModel;
                    }

                    return inputModel;
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
}
