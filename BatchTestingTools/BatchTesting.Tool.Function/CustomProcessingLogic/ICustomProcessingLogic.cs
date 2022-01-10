using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace BatchTesting.Tool.Function.CustomProcessingLogic
{
    public interface ICustomProcessingLogic
    {
        Task<JObject> Execute(string text);
    }
}
