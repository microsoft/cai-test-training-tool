using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using VIL.CustomProcessingLogic;

namespace Daimler.Speech.Function.Infrastructure
{
    public class PostprocessorManager
    {

        private string _baseUri;

        public PostprocessorManager(string baseUri)
        {
            _baseUri = baseUri;
        }


        public async Task<JObject> GetPostProcessedResultAsync(string inputMessage, string CustomProcessingLoginName)
        {
            if (!string.IsNullOrWhiteSpace(CustomProcessingLoginName))
            {
                var customProcessingLogic = CustomProcessingLogicFactory.GetCustomProcessingLogic(CustomProcessingLoginName);
                var CPLResults = await customProcessingLogic.Execute(inputMessage);
                if (CPLResults != null && CPLResults.Count > 0)
                {
                    return CPLResults;
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        } 
    }
}
