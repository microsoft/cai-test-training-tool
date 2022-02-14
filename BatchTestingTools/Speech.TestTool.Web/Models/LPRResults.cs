using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class LPRResults
    {
        public LPRResults()
        {
        }

        public string JobName { get; set; }
        public string FileName { get; set; }
        public string ValidationLPRRecognized { get; set; }
        public string LPRecognized { get; set; }
        public string LUISEntities { get; set; }
        public double LPRScore { get; set; }
    }
}
