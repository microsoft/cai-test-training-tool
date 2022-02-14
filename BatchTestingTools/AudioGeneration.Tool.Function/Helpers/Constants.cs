using System;
using System.Collections.Generic;
using System.Text;

namespace AudioGeneration.Tool.Function.Helpers
{
    public class Constants
    {
        public class AudioFunctionQueries
        {
            public const string Language = "lang";
            public const string TTSProvider = "provider";
            public const string AudioFont = "font";
            public const string Transcribe = "transcribe";
            public const string Text = "input";
            public const string Format = "format";
            public const string Level = "level";
            public const string JobId = "jobid";

        }

        public  class AudioGenerationTables
        {
            public const string AudioGenerationJobDetailsTableName = "AudioGenerationJobDetails";

        }
    }
}
