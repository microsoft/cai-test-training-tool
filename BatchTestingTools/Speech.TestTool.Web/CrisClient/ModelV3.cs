using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.CrisClient
{
    public partial class SpeechModelsV3
    {
        [JsonProperty("values")]
        public List<ModelV3> Models { get; set; }

        [JsonProperty("@nextLink")]
        public Uri NextLink { get; set; }
    }

    public partial class ModelV3
    {
        [JsonProperty("self")]
        public string Self { get; set; }

        [JsonProperty("lastActionDateTime")]
        public DateTimeOffset LastActionDateTime { get; set; }

        [JsonProperty("properties")]
        public PropertiesV3 Properties { get; set; }

        public string Id
        {
            get
            {
                return Self.Substring(Self.LastIndexOf("/") + 1);
            }
        }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("createdDateTime")]
        public DateTimeOffset CreatedDateTime { get; set; }

        [JsonProperty("locale")]
        public string Locale { get; set; }

        [JsonProperty("displayName")]
        public string DisplayName { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }
    }

    public partial class PropertiesV3
    {
        [JsonProperty("deprecationDates")]
        public DeprecationDates DeprecationDates { get; set; }
    }

    public partial class DeprecationDates
    {
        [JsonProperty("adaptationDateTime")]
        public DateTimeOffset AdaptationDateTime { get; set; }

        [JsonProperty("transcriptionDateTime")]
        public DateTimeOffset TranscriptionDateTime { get; set; }
    }
}
