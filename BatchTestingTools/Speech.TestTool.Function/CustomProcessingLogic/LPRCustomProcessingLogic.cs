using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Azure;
using Newtonsoft.Json.Linq;

namespace VIL.CustomProcessingLogic
{
    public class LPRCustomProcessingLogic : ICustomProcessingLogic
    {

        private readonly static string _LPRFunctionURL = ConfigurationManager.AppSettings["LPRCPLFunctionURL"];
        private readonly static string _LPRFunctionKey = ConfigurationManager.AppSettings["LPRCPLFunctionKey"];        
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