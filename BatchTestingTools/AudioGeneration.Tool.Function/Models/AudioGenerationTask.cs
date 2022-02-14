using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
{
    public class AudioGenerationTask
    {
        public string Language { get; set; }

        public string TTSProvider { get; set; }

        public string AudioFont { get; set; }

        public bool GenerateTranscript { get; set; }

        public string AudioFormat { get; set; }

        public int Level { get; set; }

        public string JobId { get; set; }

        public string JobName { get; set; }

        public string TranscriptFile { get; set; }
    }
}
