using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BatchTesting.Tool.Function.Models
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
