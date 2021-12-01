using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Function.Helpers
{
    public class AzureTableStorageHelper
    {
        public static CloudTable GetTable(string storageConnectionString, string tableName)
        {
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(storageConnectionString);
            CloudTableClient tableClient = storageAccount.CreateCloudTableClient();
            CloudTable table = tableClient.GetTableReference(tableName);
            return table;
        }

        public static async Task<bool> TableInsertAsync<TInput>(TInput incomingEntity, string storageAccountConnectionString, string tableName) where TInput : TableEntity
        {
            var table = GetTable(storageAccountConnectionString, tableName);

            TableOperation insertOperation = TableOperation.Insert(incomingEntity);

            var t = await table.ExecuteAsync(insertOperation);

            return true;
        }


    }
}
