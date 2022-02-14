using Speech.TestTool.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Speech.TestTool.Web.Services
{
    public interface IAudioBatch
    {
        Task SendAudioGenerationJobAsync(AudioGenerationBatchRequest audioGenerationRequest);
    }
}
