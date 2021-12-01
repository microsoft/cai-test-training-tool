using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace VIL.CustomProcessingLogic
{
    public static class CustomProcessingLogicFactory
    {
        private static ConcurrentDictionary<string,ICustomProcessingLogic> _CustomProcessingLogics = new ConcurrentDictionary<string, ICustomProcessingLogic>();

        public static ICustomProcessingLogic GetCustomProcessingLogic(string CPLName)
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
                        ICustomProcessingLogic customProcessingLogic = new LPRCustomProcessingLogic();
                        _CustomProcessingLogics.TryAdd("LPR", customProcessingLogic);
                        return customProcessingLogic;
                    default:
                        return null;
                }
            }

        }
    }
}