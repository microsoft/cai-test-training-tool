using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Models
{
    public class VoicesFilesTask
    {
        public string JobName { get; set; }
        public string FileName { get; set; }
        public string TranscriptFileName { get; set; }

        public string SpeechLanguageModelId { get; set; }

        public string SpeechAcousticModelId { get; set; }
        public string LPReferenceFilename { get; set; }

        public string BatchJobId { get; set; }
    }
}
