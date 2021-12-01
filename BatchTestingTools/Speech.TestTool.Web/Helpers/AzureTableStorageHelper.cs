using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;

namespace Daimler.Speech.Web.Helpers
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
            try
            {
                var table = GetTable(storageAccountConnectionString, tableName);

                TableOperation insertOperation = TableOperation.Insert(incomingEntity);

                var t = await table.ExecuteAsync(insertOperation);
            }
            catch (System.Exception ex)
            {

                throw;
            }

            return true;
        }

        public static async Task DeleteTableRecordsAsync(string partitionKey, CloudTable historyTable)
        {
            TableQuery<TableEntity> deleteQuery = new TableQuery<TableEntity>()
                .Where(TableQuery.GenerateFilterCondition("PartitionKey", QueryComparisons.Equal, partitionKey))
                .Select(new string[] { "PartitionKey", "RowKey" });

            TableContinuationToken continuationToken = null;

            do
            {
                var tableQueryResult = historyTable.ExecuteQuerySegmentedAsync(deleteQuery, continuationToken);

                continuationToken = tableQueryResult.Result.ContinuationToken;

                // Split into chunks of 100 for batching
                List<List<TableEntity>> rowsChunked = tableQueryResult.Result.Select((x, index) => new { Index = index, Value = x })
                    .Where(x => x.Value != null)
                    .GroupBy(x => x.Index / 100)
                    .Select(x => x.Select(v => v.Value).ToList())
                    .ToList();

                // Delete each chunk of 100 in a batch
                foreach (List<TableEntity> rows in rowsChunked)
                {
                    TableBatchOperation tableBatchOperation = new TableBatchOperation();
                    rows.ForEach(x => tableBatchOperation.Add(TableOperation.Delete(x)));

                    await historyTable.ExecuteBatchAsync(tableBatchOperation);
                }
            }
            while (continuationToken != null);
        }

  
    }
}

