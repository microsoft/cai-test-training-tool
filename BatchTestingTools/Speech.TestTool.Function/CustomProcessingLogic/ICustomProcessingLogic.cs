using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace VIL.CustomProcessingLogic
{
    public interface ICustomProcessingLogic
    {
        Task<JObject> Execute(string text);
    }
}