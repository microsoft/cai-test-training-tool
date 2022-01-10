using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Models
{
    public class AudioGenerationJob : TableEntity
    {
        public AudioGenerationJob()
        {
        }
        public AudioGenerationJob(string rowKey)
        {
            this.PartitionKey = "AudioGenerationJob";
            this.RowKey = rowKey;
        }
        public string JobName { get; set; }

        public string Status { get; set; }

        public string CompletionPercentage { get; set; }

        public int LinesCount { get; set; }

        public string TranscriptFileName { get; set; }

        public string SpeechServiceType { get; set; }

        public string AudioFont { get; set; }

        public string AudioFormat { get; set; }

        public string AudioLanguage { get; set; }

        public string ConvertedFileURL { get; set; }

        public string NoiseFileURL { get; set; }

        public string GeneratedFileURL { get; set; }

        public bool hide { get; set; }
    }
}
