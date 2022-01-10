using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
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
