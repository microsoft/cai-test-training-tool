using Daimler.Speech.Web.Models;
using Google.Cloud.TextToSpeech.V1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class AudioGenerationPageData
    {
        public StorageDetails StorageInfo { get; set; }

        public List<string> SpeechTypes { get; set; }

        public List<string> TTSLanguages { get; set; }

        public List<SpeechVoice> MSSpeechVoices { get; set; }

        public List<Voice> GoogleVoices { get; set; }

        public List<Amazon.Polly.Model.Voice> AmazonVoices { get; set; }

    }
}
