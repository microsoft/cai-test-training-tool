using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace BatchTesting.Tool.Function.Helpers
{
    public static class ListExtention
    {
        public static List<List<T>> ChunkBy<T>(this IList<T> source, int chunkSize)
        {
            return source
                .Select((x, i) => new { Index = i, Value = x })
                .GroupBy(x => x.Index / chunkSize)
                .Select(x => x.Select(v => v.Value).ToList())
                .ToList();
        }
    }
}
