using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
{
    public class Output
    {
        public string level { get; set; }
        public string filename { get; set; }
        public bool success { get; set; }
    }

    public class AudioGenerationResponse
    {
        public int code { get; set; }
        public string job_id { get; set; }
        public string service { get; set; }
        public string text { get; set; }
        public string transcription { get; set; }
        public bool transcribe { get; set; }
        public string level { get; set; }
        public IList<Output> output { get; set; }
    }
}
