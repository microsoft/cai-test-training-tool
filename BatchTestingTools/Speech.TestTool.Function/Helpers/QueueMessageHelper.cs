using Daimler.Speech.Function.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Queue;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Helpers
{
    public class QueueMessageHelper
    {
        private static readonly string _storageConnectionString = ConfigurationManager.AppSettings["StorageConnectionString"];

        public static async Task SaveCustomProcessingTaskAsync(CustomProcesingTask CPTMessage)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(_storageConnectionString);

            // Create the queue client.
            CloudQueueClient queueClient = storageAccount.CreateCloudQueueClient();

            // Retrieve a reference to a queue.
            CloudQueue queue = queueClient.GetQueueReference("customprocessingtasks");

            string message = JsonConvert.SerializeObject(CPTMessage);

            // Create a message and add it to the queue.
            CloudQueueMessage queueMessage = new CloudQueueMessage(message);

            //CloudQueueMessage peekedMessage = queue.PeekMessage();
            await queue.AddMessageAsync(queueMessage);

        }

        public static async Task SaveVoiceTaskAsync(SpeechTask speechMessage)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(_storageConnectionString);

            // Create the queue client.
            CloudQueueClient queueClient = storageAccount.CreateCloudQueueClient();

            // Retrieve a reference to a queue.
            CloudQueue queue = queueClient.GetQueueReference("speechtasks");

            string message = JsonConvert.SerializeObject(speechMessage);

            // Create a message and add it to the queue.
            CloudQueueMessage queueMessage = new CloudQueueMessage(message);

            //CloudQueueMessage peekedMessage = queue.PeekMessage();
            await queue.AddMessageAsync(queueMessage);

        }

    }
}
