using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class BatchJobResults
    {
        public BatchJob  Job { get; set; }
        public List<VoiceFile> JobDetails { get; set; }
        public List<VoiceFile> LPDetails { get; set; }
    }
}
