using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;

namespace BatchTesting.Tool.Function.CustomProcessingLogic
{
    public static class CustomProcessingLogicFactory
    {
        private static ConcurrentDictionary<string, ICustomProcessingLogic> _CustomProcessingLogics = new ConcurrentDictionary<string, ICustomProcessingLogic>();

        public static ICustomProcessingLogic GetCustomProcessingLogic(string CPLName, IConfiguration configuration)
        {
            if (_CustomProcessingLogics.TryGetValue(CPLName, out ICustomProcessingLogic result))
            {
                return result;
            }
            else
            {
                switch (CPLName)
                {
                    case "LPR":
                        ICustomProcessingLogic customProcessingLogic = new LPRCustomProcessingLogic(configuration);
                        _CustomProcessingLogics.TryAdd("LPR", customProcessingLogic);
                        return customProcessingLogic;
                    default:
                        return null;
                }
            }

        }
    }
}
