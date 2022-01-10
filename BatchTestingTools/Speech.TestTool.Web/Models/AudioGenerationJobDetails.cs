using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Models
{
    public class AudioGenerationJobDetails : TableEntity
    {
        public AudioGenerationJobDetails()
        {
        }
        public AudioGenerationJobDetails(string JobId, string rowKey)
        {
            this.PartitionKey = JobId;
            this.RowKey = rowKey;
        }

        public string Status { get; set; }

        public string FileName { get; set; }

        public string Transcript { get; set; }

        public string Error { get; set; }

        public string Exception { get; set; }


    }
}
