using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Models
{
    public class CustomProcesingTask
    {
        public string JobId { get; set; }
        public string JobName { get; set; }
        public string FileName { get; set; }
        public string Message { get; set; }

        public string CPLName { get; set; }
    }
}
