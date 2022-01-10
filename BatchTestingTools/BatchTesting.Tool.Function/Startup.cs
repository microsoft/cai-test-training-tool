using BatchTesting.Tool.Function;
using BatchTesting.Tool.Function.Models;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Azure.WebJobs.Host.Bindings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Extensions.Http;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;

[assembly: FunctionsStartup(typeof(Startup))]
namespace BatchTesting.Tool.Function
{
    public class Startup : FunctionsStartup
    {

        /// <summary>
        /// The HTTP handler lifetime
        /// </summary>
        private const int HTTP_HANDLER_LIFETIME = 5;

        /// <summary>
        /// The retry wait for conflict
        /// </summary>
        private const int RETRY_WAIT_FOR_CONFLICT = 1;

        /// <summary>
        /// The retry count
        /// </summary>
        private const int RETRY_COUNT = 2;

        /// <summary>
        /// Defines the configuration
        /// </summary>
        private IConfigurationRoot configuration;

        public override void Configure(IFunctionsHostBuilder builder)
        {
            builder.Services.AddLogging();
            builder.Services.AddApplicationInsightsTelemetry();

            var executioncontextoptions = builder.Services.BuildServiceProvider().GetService<IOptions<ExecutionContextOptions>>().Value;
            var currentDirectory = executioncontextoptions.AppDirectory;

            IConfigurationBuilder configurationBuilder = new ConfigurationBuilder()
               .SetBasePath(currentDirectory)
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
               .AddEnvironmentVariables();

            this.configuration = configurationBuilder.Build();

            builder.Services.AddHttpClient("WithTransientAndThrottlingRetry")
              .SetHandlerLifetime(TimeSpan.FromMinutes(HTTP_HANDLER_LIFETIME))
              .AddPolicyHandler((c) =>
              {
                  return HttpPolicyExtensions
                          .HandleTransientHttpError()
                          .OrResult(msg => msg.StatusCode == HttpStatusCode.TooManyRequests)
                          .WaitAndRetryAsync(RETRY_COUNT, retryAttempt => TimeSpan.FromSeconds(RETRY_WAIT_FOR_CONFLICT));
              });

            builder.Services.AddSingleton<IConfiguration>(this.configuration);

          
        }
    }
}
