using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.CrisClient
{
    public class Properties
    {
        public string Purpose { get; set; }
        public string Deprecated { get; set; }
        public string ModelClass { get; set; }
        public string VadKind { get; set; }
        public string IsDynamicGrammarSupported { get; set; }
        public string UsesHalide { get; set; }
    }


    public class Model
    {
        public string modelKind { get; set; }
        public List<object> datasets { get; set; }
        public DateTime lastActionDateTime { get; set; }
        public string status { get; set; }
        public string id { get; set; }
        public DateTime createdDateTime { get; set; }
        public string locale { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public Properties properties { get; set; }
        public Model baseModel { get; set; }
    }
}
