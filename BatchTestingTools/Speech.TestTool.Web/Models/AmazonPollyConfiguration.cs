using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class AmazonPollyConfiguration
    {
        public string AccessKeyId { get; set; }
        public string KeySecret { get; set; }
        public string Region { get; set; }
    }
}
