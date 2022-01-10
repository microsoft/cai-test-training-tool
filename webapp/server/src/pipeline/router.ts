import express, { Router } from 'express';
var axios = require("axios")


const router: Router = express.Router({});
// services

async function startReleasePipeline(partitionKey, kbId, testsetName, comment) {
  var headers = {
    "Content-Type": "application/json",
  };

  var requestBody = {
    definitionId: 55,
    description:comment,
    isDraft: false,
    reason: "none",
    manualEnvironments: null,
    variables: {
      partition_key: {
        value: partitionKey,
      },
      kb_id: {
        value: kbId,
      },
      testset: {
        value: testsetName,
      },
      stage: {
        value: process.env.ENVIRONMENT,
      },
    },
  };

  var requestOptions = {
    method: "POST",
    headers: headers,
    auth: {
      username: "",
      password: process.env.DEVOPS_PAT,
    },
  };

  return axios.post(process.env.PIPELINE_ENDPOINT, requestBody, requestOptions);
}

async function startBotTest(buildParameters, userName) {
  var headers = {
    "Content-Type": "application/json",
  };

  console.log(buildParameters);
  var requestBody = {
    parameters: JSON.stringify({
      botname: buildParameters.botname,
      filenames: buildParameters.filenames.join(", "),
      usedevstroage: process.env.ENVIRONMENT == "DEV",
      comment: buildParameters.comment,
      user: userName,
      jobid: buildParameters.jobid,
    }),
    definition: { id: 108 }
  }

  console.log(requestBody)
  var data = JSON.stringify(requestBody);

  var config = {
    method: 'post',
    url: process.env.BOTTEST_ENDPOINT,
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Basic OnNqc213cDdzMmJlemc2ejd6bmxjaTJ0Z2FkZXl6cjRjYmxsN2tjZWtqZGtpYjZ4ejc0ZHE=', 
    },
    data : data
  };

  return axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    return response.data
  })
  .catch(function (error) {
    console.log(error);
  });
  
}

// routes

router.use(function (req, res, next) {
  console.log("accessing release pipeline route");
  next();
});

router.post("/startbottest", function (req, res) {
    var userName = req.user.profile.displayName;
    let buildParameters = req.body.buildParameters;

    startBotTest(buildParameters, userName).
      then((result) => {
        res.status(200).json(result);
      }).catch((err) => {
        console.log("error starting the build: ", err);
        res.status(400).json({ message: err });
      });
});

router.post("/start", function (req, res) {
    startReleasePipeline(
      req.query.partitionKey,
      req.query.kbId,
      req.query.testsetName,
      req.query.comment
    )
      .then((result) => {
        res.status(200).json({ message: "start successful" });
      })
      .catch((err) => {
        console.log("error starting the release pipeline: ", err);
        res.status(400).json({ message: err });
      });
});

export const pipelineRouter = router;
