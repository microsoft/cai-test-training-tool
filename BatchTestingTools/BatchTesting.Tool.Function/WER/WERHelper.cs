using BatchTesting.Tool.Function.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace BatchTesting.Tool.Function.WER
{
    public class WERHelper
    {
        public static async Task<WERResults> GetWERValue(List<ValidationItem> validationItems, string WERFunctionURL, string WERFunctionKey)
        {
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("x-functions-key", WERFunctionKey);

                var result = await client.PostAsync(WERFunctionURL, new StringContent(JsonConvert.SerializeObject(validationItems, Formatting.None, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }), Encoding.UTF8, "application/json")).ConfigureAwait(false);

                var jsonResponseContent = await result.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (result.IsSuccessStatusCode)
                {
                    return JsonConvert.DeserializeObject<WERResults>(jsonResponseContent);
                }
                else
                {
                    return null;
                }
            }
        }
    }
}
