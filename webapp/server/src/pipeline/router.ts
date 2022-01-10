import express, { Router } from 'express';
var axios = require("axios")
var azure = require("azure-storage");
var { BlobServiceClient } = require("@azure/storage-blob");

const fs = require('fs');
const router: Router = express.Router({});
// services


// routes

router.use(function (req, res, next) {
  console.log("accessing release pipeline route");
  next();
});


router.post("/start", async function (req, res) {
  const ENVIRONMENT = 'test';
  const HOST = 'westus.api.cognitive.microsoft.com'
  const SERVICE = '/qnamaker/v4.0'
  const KB_URL = '/knowledgebases/'
  const KB_UAT = req.query.kbId
  const METHOD = KB_URL + KB_UAT + '/' + ENVIRONMENT + '/qna/'
  const TEST_URL_UAT = 'cog-goblabla-qna-uat.azurewebsites.net'
  const TEST_URL_PRD = 'cog-goblabla-qna-prd.azurewebsites.net' 
  const PARTITION_KEY =  req.query.partitionKey
  const TESTSET = req.query.testsetName
  const SA_CONNECTION_STRING = process.env.SA_CONNECTION_STRING

  var kbs_uat = await get_kb_in_env("TEST")
  var kbs_prod = await get_kb_in_env("PROD")

  var kb_name;

  for(var kb in kbs_uat.data["knowledgebases"]){
    console.log(kbs_uat.data["knowledgebases"][kb])
    if(KB_UAT == kbs_uat.data["knowledgebases"][kb]["id"]){
      console.log("KB found in TEST.");
      kb_name = kbs_uat.data["knowledgebases"][kb]["name"];
    }
    else{
      update_status(PARTITION_KEY, "FAILED")
      console.log("Error: KB with ID " + KB_UAT + " not found!");
      res.status(400).json({ message: "KB not found!" });
      return;
    }
  }
  
  var test_success = false;
  triggerTestExecution("TEST", TESTSET, KB_UAT, PARTITION_KEY)
  .then((result) => {
    test_success = result
  })
  .catch((err) => {
    console.log("error in test knowledge base route:", err);
    res.status(400).json({ message: err });
  });
  
  if (test_success = true) {
      console.log("Test of knowledgebase in UAT successful!")
  }
  else{
      update_status(PARTITION_KEY, "FAILED");
      console.log("Test for UAT failed! Stopping deployment process.");
      return;
  }
  
  // download knowledgebase from UAT and save it as .json
  get_qna(KB_UAT, "TEST")
  console.log("downloaded kb from TEST")
  await new Promise(r => setTimeout(r, 20000)); 
  // find matching knowledgebase in PROD / if not found: create it
  var kb_target = "empty"
  for(var kb_prod in kbs_prod.data["knowledgebases"]){
    if(kb_name == kbs_uat.data["knowledgebases"][kb_prod]["name"]){
      kb_target = kbs_uat.data["knowledgebases"][kb]["id"];
    }
  }

  var new_kb_prd = false
  if (kb_target == "empty") {
      console.log("No KB with name " + kb_name + " found in PROD. Creating new...")
      new_kb_prd = true
      create_kb(kb_name)
      await new Promise(r => setTimeout(r, 20000));   // refactor with status check
  }
  
  console.log("Accesing file from TEST");
  var content;
  // backup and update knowledgebase in PROD
  fs.readFile(KB_UAT + '.json', 'utf8', function(err, data) {
    if (err) console.log(err);
    console.log('OK: ' + KB_UAT + '.json');
    content = JSON.parse(data);
  });
  kbs_prod = await get_kb_in_env("PROD");
  for(var kb_prod in kbs_prod.data["knowledgebases"]){
    if(kb_name == kbs_prod.data["knowledgebases"][kb_prod]["name"]){
      kb_target = kbs_prod.data["knowledgebases"][kb_prod]["id"];
    }
  }
  console.log("KB Target " + kb_target)

  get_qna(kb_target, "PROD")
  replace_kb(kb_target, content)
  
  await new Promise(r => setTimeout(r, 30000));
  
  // test knowledgebase in PROD / if fail: replace with old version, else: publish
  
  triggerTestExecution("PROD", TESTSET, kb_target, PARTITION_KEY)
  .then((result) => {
    test_success = result
  })
  .catch((err) => {
    console.log("error in test prd knowledge base route:", err);
    res.status(400).json({ message: err });
  });
  
  if (test_success == true){
      console.log("Test of knowledgebase in PROD successful!")
  }
  else{
      update_status(PARTITION_KEY, "FAILED")
      console.log("Test of knowledgebase in PROD failed!")
      // if (new_kb_prd == false){
      //     with open(kb_target + '.json', encoding='utf-8') as json_file:
      //         data = json.load(json_file)
      //     path2 = SERVICE + KB_URL + kb_target
      //     replace_kb(path2, json.dumps(data))
      // }
      // console.log("Test for PROD failed! Restored previous knowledgebase.");
      return;
  }

  publish_kb(kb_target)
  update_status(PARTITION_KEY, "SUCCESSFUL") 

});



async function get_kb_in_env(environment){
  console.log("Getting KBs")
  var subscription =
  environment === "TEST"
    ? process.env.QNA_ACCESS_KEY_UAT
    : process.env.QNA_PROD_KEY;
  var headers = {
    "Ocp-Apim-Subscription-Key": subscription,
  };
  var requestOptions = {
    method: "GET",
    headers: headers,
  };
  return await axios.get(process.env.API_KNOWLEDGE_BASE, requestOptions);
}

async function get_qna(kb_id, environment){
  var subscription =
  environment === "TEST"
    ? process.env.QNA_ACCESS_KEY_UAT
    : process.env.QNA_PROD_KEY;
  var headers = {
    "Ocp-Apim-Subscription-Key": subscription,
  };
  var requestOptions = {
    method: "GET",
    headers: headers,
  };
  var response = await axios.get(process.env.API_KNOWLEDGE_BASE + kb_id + '/test/qna/', requestOptions);
  if (response.status = 200){
    console.log("saving kb to file");
    // console.log(response)
    //console.log(response.data)
    fs.writeFileSync(kb_id + '.json', JSON.stringify(response.data));
  }
}

async function create_kb(name){
  var url = process.env.API_KNOWLEDGE_BASE + "create"
  var req = {
    "name": name
  }
  var headers = {
    'Ocp-Apim-Subscription-Key': process.env.QNA_PROD_KEY,
    "Content-Type": "application/json",
    'Content-Length': JSON.stringify(req).length.toString()
  };

  var requestOptions = {
    headers: headers,
    method: "POST",
  };
  console.log("Create:")
  var response = await axios.post(url, req, requestOptions);
}

async function replace_kb(kb_id, content){
  var url = process.env.API_KNOWLEDGE_BASE + kb_id 
  var headers = {
    'Ocp-Apim-Subscription-Key': process.env.QNA_PROD_KEY,
    "Content-Type": "plain/text",
    //'Content-Length': content.length.toString()
  };

  var requestOptions = {
    headers: headers,
    method: "PUT",
  };
  await axios.put(url, content, requestOptions)
  .then((result) => {
    console.log("Update of PROD successful")
  })
  .catch((err) => {
    console.log(err.message);
  });
}

async function publish_kb(kb_id){
  var url = process.env.API_KNOWLEDGE_BASE + kb_id
  var headers = {
    'Ocp-Apim-Subscription-Key': process.env.QNA_PROD_KEY,
  };

  var requestOptions = {
    headers: headers,
    method: "POST",
  };
  await axios.post(url, null, requestOptions)
  .then((result) => {
    console.log("Publish of PROD successful")
  })
  .catch((err) => {
    console.log(err.message);
  });
}

function update_status(runId, message){
  var tableService = azure.createTableService(process.env.SA_CONNECTION_STRING);

  var entity = {
    PartitionKey: { "_": runId },
    RowKey: { "_": "deploy" },
    status: { "_": message },
  };
  tableService.mergeEntity(
    "QnADeploymentJobs",
    entity,
    function (error, result, response) {
      if (error) {
        console.log("error, could not insert entity: ", error);
      }
    }
  );
}

async function triggerTestExecution(
  environment,
  testset,
  knowledgeBaseId,
  runId
) {
  var testHost = environment == "PROD" ? "https://qna-cai-batch-testing-prod.azurewebsites.net" : "https://qna-cai-batch-testing.azurewebsites.net";
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
    // only use first 11 for prod testing
  var test_length = environment == "TEST" ? lines.length : Math.round(lines.length * parseInt(process.env.QNA_PRD_DEPLOYMENT_TEST_COVERAGE_IN_PERCENT) / 100)
  for (let idx = 0; idx < test_length; idx++) {
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

      console.log(req)
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
      if (environment == "TEST") {
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
        promptsUAT: { "_": prompts },
        answerPRD: { "_": " " },
        scorePRD: { "_": " " },
        idPRD: { "_": " " },
        metadataPRD: { "_": " " },
        contextPRD: { "_": " " },
        promptsPRD: { "_": " " }
      };
    }
    else {
      entity = {
        PartitionKey: { "_": runId },
        RowKey: { "_": idx.toString() },
        answerPRD: { "_": response.data["answers"][0]["answer"] },
        scorePRD: { "_": response.data["answers"][0]["score"] },
        idPRD: { "_": response.data["answers"][0]["id"] },
        metadataPRD: { "_": metadata.join() },
        contextPRD: { "_": response.data["answers"][0]["context"]["isContextOnly"] },
        promptsPRD: { "_": prompts },
      };
    }

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
        promptsUAT: { "_": "Error" },
        answerPRD: { "_": "Error" },
        scorePRD: { "_": "Error" },
        idPRD: { "_": "Error" },
        metadataPRD: { "_": "Error" },
        contextPRD: { "_": "Error" },
        promptsPRD: { "_": "Error" }

      };
    }
    //console.log(entity)
    tableService.insertOrMergeEntity(
      "QnADeploymentTestDetailResults",
      entity,
      function (error, result, response) {
        if (error) {
          console.log("error, could not insert entity 1: ", error);
        }
      }
    );
  }

  if (environment == "PROD"){
    return;
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
    RowKey: { "_": "deploy" },
    result: { "_": (testsetLength - failures) + "/" + testsetLength },
    status: { "_": failures == 0 ? "SUCCESSFUL" : "FAILED" },
  };
  tableService.mergeEntity(
    "QnADeploymentJobs",
    entity,
    function (error, result, response) {
      if (error) {
        console.log("error, could not insert entity: ", error);
      }
    }
  );
  return testSuccessful;
}


  async function getEndpointKey(environment) {
    var headers = {
      "Ocp-Apim-Subscription-Key":
        environment == "PROD"
          ? process.env.QNA_PROD_KEY
          : process.env.QNA_ACCESS_KEY_UAT,
    };
    var requestOptions = {
      method: "GET",
      headers: headers,
    };
  
    return axios
      .get("https://westus.api.cognitive.microsoft.com/qnamaker/v4.0" + "/endpointkeys", requestOptions)
      .then((result) => {
        return result.data["primaryEndpointKey"];
      })
      .catch((err) => {
        console.log(
          `error getting endopint key from: ${"https://westus.api.cognitive.microsoft.com/qnamaker/v4.0" + "/endpointkeys"
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

export const pipelineRouter = router;
