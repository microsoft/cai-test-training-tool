using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AudioGeneration.Tool.Function.Helpers
{
    public static class CloudTableExtension
    {

        private static readonly int TableServiceBatchMaximumOperations = 100;

        public async static Task<IList<TableResult>> ExecuteBatchAsLimitedBatches(this CloudTable table,
                                                      TableBatchOperation batch)
        {
            if (IsBatchCountUnderSupportedOperationsLimit(batch))
            {
                return await table.ExecuteBatchAsync(batch);
            }

            var result = new List<TableResult>();
            var limitedBatchOperationLists = GetLimitedBatchOperationLists(batch);
            foreach (var limitedBatchOperationList in limitedBatchOperationLists)
            {
                var limitedBatch = CreateLimitedTableBatchOperation(limitedBatchOperationList);
                var limitedBatchResult = await table.ExecuteBatchAsync(limitedBatch);
                result.AddRange(limitedBatchResult);
            }

            return result;
        }

        private static bool IsBatchCountUnderSupportedOperationsLimit(TableBatchOperation batch)
        {
            return batch.Count <= TableServiceBatchMaximumOperations;
        }

        private static IEnumerable<List<TableOperation>> GetLimitedBatchOperationLists(TableBatchOperation batch)
        {
            return batch.ChunkBy(TableServiceBatchMaximumOperations);
        }

        private static TableBatchOperation CreateLimitedTableBatchOperation(IEnumerable<TableOperation> limitedBatchOperationList)
        {
            var limitedBatch = new TableBatchOperation();
            foreach (var limitedBatchOperation in limitedBatchOperationList)
            {
                limitedBatch.Add(limitedBatchOperation);
            }

            return limitedBatch;
        }
    }
}
