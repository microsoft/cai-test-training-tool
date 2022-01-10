using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace BatchTesting.Tool.Function.CustomProcessingLogic
{
    public class LPRCustomProcessingLogic : ICustomProcessingLogic
    {

        private readonly IConfiguration configuration;

        private readonly string _LPRFunctionURL;
        private readonly string _LPRFunctionKey;

        public LPRCustomProcessingLogic(IConfiguration configuration)
        {

            this.configuration = configuration;
            _LPRFunctionURL = this.configuration.GetValue<string>("LPRCPLFunctionURL");
            _LPRFunctionKey = this.configuration.GetValue<string>("LPRCPLFunctionKey");

        }
        public async Task<JObject> Execute(string text)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("x-functions-key", _LPRFunctionKey);

                    var result = await client.GetAsync(_LPRFunctionURL + "?query=" + text).ConfigureAwait(false);

                    var jsonResponseContent = await result.Content.ReadAsStringAsync().ConfigureAwait(false);

                    if (result.IsSuccessStatusCode)
                    {
                        return JObject.Parse(jsonResponseContent);
                    }
                    else
                    {
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {

                return null;
            }
        }
    }
}
