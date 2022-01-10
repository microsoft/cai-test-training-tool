using Microsoft.AspNetCore.Hosting;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Daimler.Speech.Web.Infrastructure
{
    public class FileSpeechRecognizer
    {
        private readonly SpeechConfig _speechConfig;
        private readonly string _locale;
        private readonly IHostingEnvironment _host;
        private SpeechRecognizer recognizer;
        private TaskCompletionSource<int> stopRecognitionTaskCompletionSource;
        private Dictionary<string, string> transcriptionResults = new Dictionary<string, string>();

        public FileSpeechRecognizer(SpeechConfig speechConfig, IHostingEnvironment host)
        {
            _speechConfig = speechConfig;
            _host = host;
        }

        public async Task<Dictionary<string, string>> StartRecognetionAsync()
        {

            //var stopRecognition = new TaskCompletionSource<int>();

            // Creates a speech recognizer using file as audio input.
            // Replace with your own audio file name.
            var folderPath = GetFolderPath();

            var filePaths = Directory.GetFiles(folderPath, "*.wav",SearchOption.TopDirectoryOnly);

            foreach (var file in filePaths)
            {

                stopRecognitionTaskCompletionSource = new TaskCompletionSource<int>();

                var audioConfig = AudioConfig.FromWavFileInput(file);
                
                recognizer = new SpeechRecognizer(_speechConfig, audioConfig);
                

                // Subscribes to events.
                //recognizer.Recognizing += (s, e) =>
                //{
                //    Console.WriteLine($"RECOGNIZING: Text={e.Result.Text}");
                //};

                recognizer.Recognized += (s, e) =>
                {
                    if (e.Result.Reason == ResultReason.RecognizedSpeech)
                    {
                        Console.WriteLine($"RECOGNIZED: Text={e.Result.Text}");
                        if (transcriptionResults.ContainsKey(e.SessionId))
                        {
                            transcriptionResults[e.SessionId] = transcriptionResults[e.SessionId] + " " + e.Result.Text;
                        }
                        else
                        {
                            transcriptionResults.Add(e.SessionId, e.Result.Text);
                        }

                    }
                    else if (e.Result.Reason == ResultReason.NoMatch)
                    {
                        Console.WriteLine($"NOMATCH: Speech could not be recognized.");
                    }
                };

                recognizer.Canceled += (s, e) =>
                {
                    Console.WriteLine($"CANCELED: Reason={e.Reason}");

                    if (e.Reason == CancellationReason.Error)
                    {
                        Console.WriteLine($"CANCELED: ErrorCode={e.ErrorCode}");
                        Console.WriteLine($"CANCELED: ErrorDetails={e.ErrorDetails}");
                        Console.WriteLine($"CANCELED: Did you update the subscription info?");
                    }

                    stopRecognitionTaskCompletionSource.TrySetResult(0);
                };

                recognizer.SessionStarted += (s, e) =>
                {
                    Console.WriteLine("\n    Session started event.");
                };

                recognizer.SessionStopped += (s, e) =>
                {
                    Console.WriteLine("\n    Session stopped event.");
                    Console.WriteLine("\nStop recognition.");
                    stopRecognitionTaskCompletionSource.TrySetResult(0);
                };

                // Starts continuous recognition. Uses StopContinuousRecognitionAsync() to stop recognition.
                await recognizer.StartContinuousRecognitionAsync().ConfigureAwait(false);

                // Waits for completion.
                // Use Task.WaitAny to keep the task rooted.
                Task.WaitAny(new[] { stopRecognitionTaskCompletionSource.Task });

                // Stops recognition.
                await recognizer.StopContinuousRecognitionAsync().ConfigureAwait(false);

                recognizer.Dispose();
                //Subscribe for events and get the transcription
            }

            return transcriptionResults;

        }

        private string GetFolderPath()
        {

            return $"{_host.ContentRootPath}\\AudioFiles";

            //var folderPath = string.Empty;

            //if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HOME")))
            //{
            //    //On Azure Func
            //    var funcAppHome = Path.Combine(Environment.GetEnvironmentVariable("HOME"), "site\\wwwroot\\app_data\\jobs\\continuous\\MessagesProcessor");
            //    folderPath = Path.Combine(funcAppHome, "AudioFiles");
            //}
            //else
            //{
            //    //Local Machine Run
            //    folderPath = $".\\AudioFiles";
            //}

            //return folderPath;
        }
    }
}
