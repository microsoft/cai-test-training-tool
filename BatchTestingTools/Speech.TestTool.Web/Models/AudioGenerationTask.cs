using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Models
{
    public class SpeechTask
    {
        public string JobId { get; set; }
        public string JobName { get; set; }
        public string TranscriptFileName { get; set; }
        public string SpeechLanguageModelId { get; set; }

        public string SpeechAcousticModelId { get; set; }
    }
}
