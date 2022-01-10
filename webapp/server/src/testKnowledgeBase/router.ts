import express, { Router } from 'express';
var axios = require("axios");
var azure = require("azure-storage");
var { BlobServiceClient } = require("@azure/storage-blob");


const router: Router = express.Router({});

// services

var HOST = "https://westus.api.cognitive.microsoft.com";
var SERVICE = "/qnamaker/v4.0";
var TEST_URL_UAT = "https://cog-goblabla-qna-uat.azurewebsites.net";
var TEST_URL_PRD = "https://cog-goblabla-qna-prd.azurewebsites.net";

async function triggerTestExecution(
  environment,
  testset,
  knowledgeBaseId,
  runId
) {
  var testHost = environment == "PROD" ? TEST_URL_PRD : TEST_URL_UAT;
  var headers = {
    Authorization: await getEndpointKey(environment),
    "Content-Type": "application/json",
  };

  var blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.SA_CONNECTION_STRING
  );
  var containerClient = blobServiceClient.getContainerClient(
    process.env.CONTAINER_NAME
  );
  var blobClient = containerClient.getBlobClient(testset);
  var downloadBlockBlobResponse = await blobClient.download();
  var downloadedFile = (
    await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
  ).toString();

  var resultId = [],
    resultMeta = [],
    resultContext = [],
    resultPrompts = [],
    resultScore = [];

  var tableService = azure.createTableService(process.env.SA_CONNECTION_STRING);

  var lines = downloadedFile.split("\n");
  for (let idx = 0; idx < lines.length; idx++) {
    try {
      if (idx < 1) continue;
      if (lines[idx].split(";").length !== 7) continue;
      var elements = lines[idx].split(";");
      var req = {};

      if (elements[3].trim().toLowerCase() == "true") {

        for (let idx_context = 0; idx_context < lines.length; idx_context++) {
          if (idx_context < 1) continue;
          if (lines[idx_context].split(";").length !== 7) continue;
          var elements_context = lines[idx_context].split(";");
          var qna_id = '"QnaId":' + elements[5].trim();
          var qna_id_alt = '"QnaId"":' + elements[5].trim();

          if (elements_context[4].toLowerCase().includes(qna_id.toLowerCase()) || elements_context[4].toLowerCase().includes(qna_id_alt.toLowerCase())) {
            req = {
              question: elements[0],
              context: {
                previousQnAId: elements_context[5]
              },
              isTest: true
            };
            break;
          }
        }
      }
      else {
        if (elements[4].includes("[]")) {
          req = {
            question: elements[0],
            isTest: true,
          };
        }
        else {
          var prev_id = elements[4].toLowerCase().split('"qnaid"').pop().split(',"')[0]
          prev_id = prev_id.match(/\d+/)[0];
          req = {
            question: elements[0],
            context: {
              previousQnAId: prev_id
            },
            isTest: true
          };
        }
      }

      var url =
        testHost +
        "/qnamaker/knowledgebases/" +
        knowledgeBaseId +
        "/generateAnswer";
      var requestOptions = {
        headers: headers,
        method: "POST",
      };
      var response = await axios.post(url, req, requestOptions);
      var rawMetadata = response.data["answers"][0]["metadata"];
      var metadata = [];
      for (var entry of rawMetadata) {
        metadata.push(entry["name"] + ":" + entry["value"]);
      }

      var expectedScoreChecked = 0;
      if (elements[6].trim() == "") {
        expectedScoreChecked = 100;
      }
      else {
        expectedScoreChecked = parseInt(elements[6].trim());
      }

      resultId.push(
        response.data["answers"][0]["id"].toString() == elements[5].trim()
      );
      resultMeta.push(metadata.includes(elements[2].trim()) || elements[2].trim() == "");
      resultContext.push(
        response.data["answers"][0]["context"]["isContextOnly"].toString().toLowerCase() ==
        elements[3].trim().toLowerCase()
      );
      var prompts = JSON.stringify(response.data["answers"][0]["context"]["prompts"]);
      if (prompts.substring(0, 1) == '"') {
        prompts = prompts.substring(1, prompts.length - 1);
      }
      prompts = prompts.split('""').join('"');

      var exsp_prompts = elements[4].trim();
      if (exsp_prompts.substring(0, 1) == '"') {
        exsp_prompts = exsp_prompts.substring(1, exsp_prompts.length - 1);
      }
      exsp_prompts = exsp_prompts.split('""').join('"');

      resultPrompts.push(
        prompts.toLowerCase() ==
        exsp_prompts.toLowerCase()
      );
      resultScore.push(
        parseInt(response.data["answers"][0]["score"]) >= expectedScoreChecked
      );

      // console.log(idx)
      // console.log(resultId)
      // console.log(resultMeta)
      // console.log(resultContext)
      // console.log(resultPrompts)
      // console.log(resultScore)



      var entity = {};
      entity = {
        PartitionKey: { "_": runId },
        RowKey: { "_": idx.toString() },
        question: { "_": elements[0].trim() },
        expectation: { "_": elements[1].trim() },
        expectedMetadata: { "_": elements[2].trim() },
        expectedContext: { "_": elements[3].trim() },
        expectedPrompts: { "_": exsp_prompts },
        expectedId: { "_": elements[5].trim() },
        expectedScore: { "_": expectedScoreChecked },
        answerUAT: { "_": response.data["answers"][0]["answer"] },
        scoreUAT: { "_": response.data["answers"][0]["score"] },
        idUAT: { "_": response.data["answers"][0]["id"] },
        metadataUAT: { "_": metadata.join() },
        contextUAT: { "_": response.data["answers"][0]["context"]["isContextOnly"] },
        promptsUAT: { "_": prompts }
      };

    } catch (e) {
      console.log(e);
      console.log(elements);
      var entity = {};
      entity = {
        PartitionKey: { "_": runId },
        RowKey: { "_": idx.toString() },
        question: { "_": elements },
        expectation: { "_": "Please check input for this testcase." },
        expectedMetadata: { "_": "_Error" },
        expectedContext: { "_": "_Error" },
        expectedPrompts: { "_": "_Error" },
        expectedId: { "_": "Error" },
        expectedScore: { "_": "Error" },
        answerUAT: { "_": "Error" },
        scoreUAT: { "_": "Error"},
        idUAT: { "_": "Error" },
        metadataUAT: { "_": "Error" },
        contextUAT: { "_": "Error" },
        promptsUAT: { "_": "Error" }
      };
    }
    //console.log(entity)
    tableService.insertOrMergeEntity(
      "QnABatchTestDetailResults",
      entity,
      function (error, result, response) {
        if (error) {
          console.log("error, could not insert entity 1: ", error);
        }
      }
    );
  }

  var testSuccessful = true;
  var failures = 0;
  for (var idx in resultId) {
    if (
      resultId[idx] == false ||
      resultMeta[idx] == false ||
      resultContext[idx] == false ||
      resultPrompts[idx] == false ||
      resultScore[idx] == false
    ) {
      console.log(`Test failed for Test #: ${idx}`);
      failures++;
      testSuccessful = false;
    }
  }

  var testsetLength = resultId.length;
  var succeeded = resultId.reduce(function (pv, cv) {
    return pv + cv;
  }, 0);

  entity = {
    PartitionKey: { "_": runId },
    RowKey: { "_": "test" },
    result: { "_": (testsetLength - failures) + "/" + testsetLength },
    status: { "_": failures == 0 ? "Erfolgreich" : "Fehlgeschlagen" },
  };
  tableService.mergeEntity(
    "QnABatchTestJobs",
    entity,
    function (error, result, response) {
      if (error) {
        console.log("error, could not insert entity 3: ", error);
      }
    }
  );
  return testSuccessful;
}

async function getEndpointKey(environment) {
  var headers = {
    "Ocp-Apim-Subscription-Key":
      environment == "PROD"
        ? process.env.QNA_ACCESS_KEY_PRD
        : process.env.QNA_ACCESS_KEY_UAT,
  };
  var requestOptions = {
    method: "GET",
    headers: headers,
  };

  return axios
    .get(HOST + SERVICE + "/endpointkeys", requestOptions)
    .then((result) => {
      return result.data["primaryEndpointKey"];
    })
    .catch((err) => {
      console.log(
        `error getting endopint key from: ${HOST + SERVICE + "/endpointkeys"
        }: `,
        err
      );
      return "error";
    });
}

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

// routes

router.use(function (req, res, next) {
  console.log("accessing test knowdledge base route");
  next();
});

router.post("/start", function (req, res) {
    triggerTestExecution(
      req.query.environment,
      req.query.testset,
      req.query.knowledgeBaseId,
      req.query.runId
    )
      .then((result) => {
        res.status(200).json({ message: result });
      })
      .catch((err) => {
        console.log("error in test knowledge base route:", err);
        res.status(400).json({ message: err });
      });
});

export const testKnowledgeBaseRouter = router;
