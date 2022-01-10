using System;
using System.Collections.Generic;
using System.Text;

namespace BatchTesting.Tool.Function.Models
{
    public class Metrics
    {
        public int count { get; set; }
        public double wer { get; set; }
        public double wrr { get; set; }
        public double ser { get; set; }
        public double lpr { get; set; }
    }

    public class Stt
    {
        public string id { get; set; }
        public string @ref { get; set; }
        public string rec { get; set; }
        public double score { get; set; }
    }

    public class Deletion
    {
        public string @string { get; set; }
        public int count { get; set; }
    }

    public class Substitution
    {
        public string string1 { get; set; }
        public string string2 { get; set; }
        public int count { get; set; }
    }

    public class SttDetails
    {
        public List<object> insertions { get; set; }
        public List<Deletion> deletions { get; set; }
        public List<Substitution> substitutions { get; set; }
    }

    public class Lpr
    {
        public string id { get; set; }
        public string @ref { get; set; }
        public string rec { get; set; }
        public double score { get; set; }
    }

    public class WERResults
    {
        public Metrics metrics { get; set; }
        public List<Stt> stt { get; set; }
        public SttDetails stt_details { get; set; }
        public List<Lpr> lpr { get; set; }
    }
}
