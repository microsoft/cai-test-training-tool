using AudioGeneration.Tool.Function.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AudioGeneration.Tool.Function.Services
{
    public interface IAudioFunction
    {
        Task<AudioGenerationResponse> GetGeneratedAudioAsync(AudioGenerationRequest audioGenerationRequest);
    }
}
