using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class AudioGenerationBatchRequest
    {
        public string Language { get; set; }

        public string TTSProvider { get; set; }

        public string AudioFont { get; set; }

        public bool GenerateTranscript { get; set; }

        public string AudioFormat { get; set; }

        public int Level { get; set; }

        public string JobId { get; set; }

        public string Jobname { get; set; }

        public string TranscriptFile { get; set; }

    }
}
