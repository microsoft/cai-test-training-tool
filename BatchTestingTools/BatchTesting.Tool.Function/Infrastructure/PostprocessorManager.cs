using BatchTesting.Tool.Function.CustomProcessingLogic;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace BatchTesting.Tool.Function.Infrastructure
{
    public class PostprocessorManager
    {
        private readonly IConfiguration configuration;

        public PostprocessorManager( IConfiguration configuration)
        {
            this.configuration = configuration;            
        }

        public async Task<JObject> GetPostProcessedResultAsync(string inputMessage, string CustomProcessingLoginName)
        {
            if (!string.IsNullOrWhiteSpace(CustomProcessingLoginName))
            {
                var customProcessingLogic = CustomProcessingLogicFactory.GetCustomProcessingLogic(CustomProcessingLoginName, configuration);
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
