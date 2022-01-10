using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
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
