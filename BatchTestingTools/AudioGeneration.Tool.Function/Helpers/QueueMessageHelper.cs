using AudioGeneration.Tool.Function.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Queue;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AudioGeneration.Tool.Function.Helpers
{
    public class QueueMessageHelper
    {

        public static async Task SaveCustomProcessingTaskAsync(CustomProcesingTask CPTMessage, string storageConnectionString)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

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

        public static async Task SaveVoiceTaskAsync(SpeechTask speechMessage, string storageConnectionString)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

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
