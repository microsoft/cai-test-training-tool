import express, { json, Router } from 'express';
var axios = require("axios")

const router: Router = express.Router({});

async function getBaseModels() {
    
    var url = `https://${process.env.SPEECH_SERVICE_REGION}.api.cognitive.microsoft.com/speechtotext/v3.0/models/base`
    var models = new Array();

    var headers = {
        "Ocp-Apim-Subscription-Key": process.env.SPEECH_SERVICE_KEY,
      };
      var requestOptions = {
        method: "GET",
        headers: headers,
      };
      
        while(url != null && url != undefined) {
            var response = await axios.get(url, requestOptions);
            url = response.data["@nextLink"]
            for (let index = 0; index < response.data.values.length; index++) {
                const model = response.data.values[index];
                if(model.properties?.deprecationDates?.transcriptionDateTime && 
                    new Date(model.properties.deprecationDates.transcriptionDateTime)  < new Date()) {
                        // model is deprecated
                        continue
                    }
                if(models.filter(x=>x.displayName === model.locale).length == 0) {
                    models.push(new Object({displayName: model.locale, options: new Array}))
                }
                models.filter(x=>x.displayName === model.locale)[0].options.push(new Object({id:model.self,displayName:model.displayName})) 
            }
        }      

    return models;
}

async function getCustomModels() {
    
    var urlProjects = `https://${process.env.SPEECH_SERVICE_REGION}.api.cognitive.microsoft.com/speechtotext/v3.0/projects`
    var models = new Array();

    var headers = {
        "Ocp-Apim-Subscription-Key": process.env.SPEECH_SERVICE_KEY,
      };
      var requestOptions = {
        method: "GET",
        headers: headers,
      };
      
        while(urlProjects != null && urlProjects != undefined) {
            var projectsResponse = await axios.get(urlProjects, requestOptions);
            urlProjects = projectsResponse.data["@nextLink"]
            for (let i = 0; i < projectsResponse.data.values.length; i++) {
                const project = projectsResponse.data.values[i];
                var modelsUrl = project?.links?.models;
                if(modelsUrl) {
                    while(modelsUrl != null && modelsUrl != undefined) {
                        var modelsResponse = await axios.get(modelsUrl, requestOptions);
                        modelsUrl = modelsResponse.data["@nextLink"]
                        for (let j = 0; j < modelsResponse.data.values.length; j++) {
                            const model = modelsResponse.data.values[j];
                            if(models.filter(x=>x.displayName === project.displayName).length == 0) {
                                models.push(new Object({displayName: project.displayName, options: new Array}))
                            }
                            models.filter(x=>x.displayName === project.displayName)[0].options.push(new Object({id:model.self,displayName:model.displayName})) 
                        }
                    }
                }
            }
        }      

    return models;
}

async function getMicrosoftVoicesToken() {
    
    var url = `https://${process.env.SPEECH_SERVICE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`

    var models = new Array();

    var headers = {
        "Ocp-Apim-Subscription-Key": process.env.SPEECH_SERVICE_KEY,
      };
      var requestOptions = {
        method: "POST",
        headers: headers,
      };

      var response = await axios.post(url,null ,requestOptions);

      if(response.status == 200) {
        return response.data;
    } else {
        return "";
    }
}

async function getMicrosoftVoices() {

    let token = await getMicrosoftVoicesToken();

    if(token == null && token == "" )
    {
        return [];
    }
    
    var url = `https://${process.env.SPEECH_SERVICE_REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`
    var models = new Array();

    var headers = {
        "Authorization": 'Bearer ' + token,
      };

      var requestOptions = {
        method: "GET",
        headers: headers,
      };

      var response = await axios.get(url, requestOptions);
      
    if (response.status == 200) {
        return response.data;
    } else {
        return [];
    }
}

router.get('/models', async (req, res) => {

    let baseModels = await getBaseModels();
    let customModels = await getCustomModels();

    res.json({
        "None": [],
        "Base": baseModels,
        "Custom": customModels
    });
})


router.get('/voices', async (req, res) => {

    let microsoftVoices = await getMicrosoftVoices();

    res.json({
        "None": [],
        "Microsoft": microsoftVoices,
        "Amazon": [],
        "Google":[]
    });
})

export const speechServiceRouter = router;

