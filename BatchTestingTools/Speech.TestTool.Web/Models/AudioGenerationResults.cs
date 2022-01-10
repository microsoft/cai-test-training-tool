using Speech.TestTool.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class AudioGenerationResults
    {
        public AudioGenerationJob  Job { get; set; }
        public List<AudioGenerationJobDetails> JobDetails { get; set; }
    }
}
