using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class Links
    {
        public string evaluations { get; set; }
        public string datasets { get; set; }
        public string models { get; set; }
        public string endpoints { get; set; }
        public string transcriptions { get; set; }
    }

    public class Properties
    {
        public int datasetCount { get; set; }
        public int evaluationCount { get; set; }
        public int modelCount { get; set; }
        public int transcriptionCount { get; set; }
        public int endpointCount { get; set; }
    }

    public class CustomProperties
    {
        public string PortalAPIVersion { get; set; }
    }

    public class Project
    {
        public string self { get; set; }
        public Links links { get; set; }
        public Properties properties { get; set; }
        public DateTime createdDateTime { get; set; }
        public string locale { get; set; }
        public string displayName { get; set; }
        public string description { get; set; }
        public CustomProperties customProperties { get; set; }
    }


    public class Projects
    {
        [JsonProperty("values")]
        public List<Project> projects { get; set; }
    }
}
