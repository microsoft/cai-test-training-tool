using Daimler.Speech.Web.Models;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Queue;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Helpers
{
    public class QueueMessageHelper
    {       

        public static async Task SaveVoicesFilesTaskAsync(string storageConnectionString ,VoicesFilesTask speechMessage)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);

            // Create the queue client.
            CloudQueueClient queueClient = storageAccount.CreateCloudQueueClient();

            // Retrieve a reference to a queue.
            CloudQueue queue = queueClient.GetQueueReference("voicesfilestasks");

            string message = JsonConvert.SerializeObject(speechMessage);

            // Create a message and add it to the queue.
            CloudQueueMessage queueMessage = new CloudQueueMessage(message);

            //CloudQueueMessage peekedMessage = queue.PeekMessage();
            await queue.AddMessageAsync(queueMessage);

        }

        public static async Task SaveVoiceTaskAsync(string storageConnectionString, SpeechTask speechMessage)
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
