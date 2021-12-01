using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Speech.TestTool.Function.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Speech.TestTool.Function.WER
{
   
    public class WERHelper
    {
        private readonly static string _WERFunctionURL = ConfigurationManager.AppSettings["WERFunctionURL"];
        private readonly static string _WERFunctionKey = ConfigurationManager.AppSettings["WERFunctionKey"];
        public static async Task<WERResults> GetWERValue(List<ValidationItem> validationItems)
        {
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("x-functions-key", _WERFunctionKey);

                var result = await client.PostAsync(_WERFunctionURL, new StringContent(JsonConvert.SerializeObject(validationItems, Formatting.None,new JsonSerializerSettings{NullValueHandling = NullValueHandling.Ignore}), Encoding.UTF8, "application/json")).ConfigureAwait(false);

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
