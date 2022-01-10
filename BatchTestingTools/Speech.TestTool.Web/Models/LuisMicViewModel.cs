using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class LuisMicViewModel
    {
        public string SpeechServiceKey { get; set; }
        public string SpeechRegion { get; set; }
        public string LUISAppId { get; set; }
        public string LUISAppKey { get; set; }
        public string EndpointId { get; set; }
    }
}
