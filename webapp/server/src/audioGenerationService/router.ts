import express, { Router } from 'express';
var axios = require("axios")

const router: Router = express.Router({});

async function postAudioBatchJob(req) {
    
    var url = `${process.env.AUDIO_BATCH_FUNCTION_URL}`


    var headers = {
        "x-functions-key": process.env.AUDIO_BATCH_FUNCTION_KEY,
      };
      var requestOptions = {
        method: "POST",
        headers: headers,
      };

    var response = await axios.post(url, req , requestOptions);
    

    return response;
}

router.post('/Job', async (req, res) => {

    let response = await postAudioBatchJob(req.body);

    console.log(response.data);

    res.json({
        "Response": response.data
    });
})

export const audioGenerationRouter = router;

