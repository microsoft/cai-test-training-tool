using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class VoiceFile : TableEntity
    {
        public VoiceFile()
        {
        }
        public VoiceFile(string JobName, string FileName)
        {
            this.PartitionKey = JobName;
            this.RowKey = FileName;
        }
        public string Status { get; set; }
        public string Transcript { get; set; }
        public string LPTranscript { get; set; }
        public string Recognized { get; set; }
        public string ValidationRecognized { get; set; }
        public string ValidationLPRRecognized { get; set; }
        public string Processed { get; set; }
        public string LPRecognized { get; set; }
        public string LUISEntities { get; set; }
        public string LPRecognizedJson { get; set; }
        public string LUISEntitiesJson { get; set; }
        public double Score { get; set; }
        public double LPRScore { get; set; }
    }
}
