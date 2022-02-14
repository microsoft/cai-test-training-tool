using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Infrastructure
{
 
    public class SpeechTokenManager
    {

        private string subscriptionKey;
        private string region;
        private string fetchTokenUri;

        public SpeechTokenManager(string subscriptionKey, string region)
        {
            this.subscriptionKey = subscriptionKey;
            this.region = region;
            this.fetchTokenUri = $"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken";
        }

        public async Task<TokenResponseModel> GetAccessTokenAsync()
        {
            var tokenResponseModel = await FetchTokenAsync(fetchTokenUri, subscriptionKey).ConfigureAwait(false);
            return tokenResponseModel;
        }

        private async Task<TokenResponseModel> FetchTokenAsync(string fetchUri, string subscriptionKey)
        {
            using (var client = new HttpClient())
            {
                try
                {
                    client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                    UriBuilder uriBuilder = new UriBuilder(fetchUri);

                    var result = await client.PostAsync(uriBuilder.Uri.AbsoluteUri, null);

                    if (result.IsSuccessStatusCode)
                    {
                        var token = await result.Content.ReadAsStringAsync();
                        return new TokenResponseModel()
                        {
                            IsSuccess = true,
                            Token = token
                        };
                    }

                    var jsonResponse = await result.Content.ReadAsStringAsync();

                    var jObject = JObject.Parse(jsonResponse);
                    var jToken = jObject.GetValue("message");

                    return new TokenResponseModel()
                    {
                        IsSuccess = false,
                        ErrorMessage = jToken.ToString()
                    };
                }
                catch (Exception e)
                {

                    return new TokenResponseModel()
                    {
                        IsSuccess = false,
                        ErrorMessage = e.Message
                    };
                }
            }
        }
    }

    public class TokenResponseModel
    {
        public bool IsSuccess { get; set; }
        public string Token { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
