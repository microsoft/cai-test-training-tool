using Daimler.Speech.Web.Helpers;
using Daimler.Speech.Web.Models;
using Microsoft.WindowsAzure.Storage.Table;
using Speech.TestTool.Web.CrisClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Speech.TestTool.Function.Helpers
{
    public class SpeechModelsHelper
    {
        public async static Task<List<ModelV3>> GetCustomSpeechModels(string crisKey, string hostName, int port)
        {
            CrisClient crisClient = CrisClient.CreateApiV2Client(crisKey, hostName, port);
            var model = await crisClient.GetCustomModelsAsync();
            return model.Models.Where(i => i.Locale == "de-DE" && i.Properties.DeprecationDates.AdaptationDateTime >= DateTime.Now).OrderByDescending(i => i.CreatedDateTime).ToList();
            //return models.Where(i => i.locale == "de-DE" && i.modelKind == "AcousticAndLanguage").ToList();
        }

        public async static Task<List<ModelV3>> GetBaseSpeechModels(string crisKey, string hostName, int port)
        {
            CrisClient crisClient = CrisClient.CreateApiV2Client(crisKey, hostName, port);
            var model = await crisClient.GetBaseModelsAsync();
            return model.Models.Where(i => i.Locale == "de-DE" && i.Properties.DeprecationDates.AdaptationDateTime>= DateTime.Now).OrderByDescending(i => i.CreatedDateTime).ToList();
            //return models.Where(i => i.locale == "de-DE" && i.modelKind == "AcousticAndLanguage").ToList();
        }
    }
}
