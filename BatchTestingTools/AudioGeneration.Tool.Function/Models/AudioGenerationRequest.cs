using System;
using System.Collections.Generic;
using System.Security.Principal;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
{
    public class AudioGenerationRequest
    {
        public string Language { get; set; }

        public string TTSProvider { get; set; }

        public string AudioFont { get; set; }

        public bool GenerateTranscript { get; set; }

        public string Text { get; set; }

        public string AudioFormat { get; set; }

        public int Level { get; set; }

        public string JobId { get; set; }

        public List<string> Transcripts { get; set; }
    }
}
