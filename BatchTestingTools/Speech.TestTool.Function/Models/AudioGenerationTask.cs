using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class AudioGenerationTask
    {
        public string JobId { get; set; }
        public string JobName { get; set; }
        public string TranscriptFileName { get; set; }
        public string SpeechType { get; set; }
    }
}
