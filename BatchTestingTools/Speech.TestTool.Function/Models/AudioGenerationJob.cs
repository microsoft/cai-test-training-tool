using Microsoft.WindowsAzure.Storage.Table;

namespace Daimler.Speech.Function.Models
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

        public bool hide { get; set; }
    }
}
