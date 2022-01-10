using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Speech.TestTool.Function.Models
{
    public class ValidationItem
    {
        [JsonProperty("id")]
        public string Id { get; set; }
        [JsonProperty("ref")]
        public string Reference { get; set; }
        [JsonProperty("rec")]
        public string Recognized { get; set; }
        [JsonProperty("lp_ref")]
        public string LPReference { get; set; }
        [JsonProperty("lp_rec")]
        public string LPRecognized { get; set; }
    }
}
