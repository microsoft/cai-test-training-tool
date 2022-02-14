using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class ServicesSettings
    {
        public string SpeechServiceKey { get; set; }
        public string SpeechEndpointId { get; set; }
        public string LUISAppIdKey { get; set; }
        public string LUISAppKey { get; set; }
        public string PostProcessSvcBaseUri { get; set; }
        public string PostProcessAuthentication { get; set; }
        public string StorageConnectionString { get; set; }
        public string StorageName { get; set; }

        public string AudioGenerationSpeechTypes { get; set; }

        public string Region { get; set; }

        public string TTSSpeechServiceKey { get; set; }

        public string TTSSpeechServiceRegion { get; set; }

        public string GoogleAPPCredentials { get; set; }

        public string TTSLanguages { get; set; }
    }
}
