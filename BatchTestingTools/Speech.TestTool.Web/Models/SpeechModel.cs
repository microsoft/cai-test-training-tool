using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Models
{
    public class SpeechModel:TableEntity
    {
        public SpeechModel()
        {

        }

        public SpeechModel(string ModelId)
        {
            this.PartitionKey = "Models";
            this.RowKey = ModelId;
        }
        
        public string ModelName { get; set; }
        public bool Active { get; set; }
    }
}
