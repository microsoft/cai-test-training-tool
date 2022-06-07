import express, { Router } from 'express';
var axios = require("axios")


const router: Router = express.Router({});
// services

async function getKnowledgeBases(environment) {
  var keys = process.env.QNA_KEY.split('"');
  var filtered_keys = keys.filter(function(el, index) {
    return index % 2 === 1;
  });
   var allKnowledgeBases = [];
  if(environment == -1){
    for(let i = 0; i < filtered_keys.length; i++){
      var subscription = filtered_keys[i]
      var headers = {
        "Ocp-Apim-Subscription-Key": subscription,
      };
      var requestOptions = {
        method: "GET",
        headers: headers,
      };
      var tmp = await axios.get(process.env.API_KNOWLEDGE_BASE, requestOptions)
      allKnowledgeBases.push(tmp.data.knowledgebases[0]);
    }
  } else {
    var subscription = filtered_keys[environment]
    var headers = {
      "Ocp-Apim-Subscription-Key": subscription,
    };
    var requestOptions = {
      method: "GET",
      headers: headers,
    };
    var tmp = await axios.get(process.env.API_KNOWLEDGE_BASE, requestOptions)
    allKnowledgeBases.push(tmp.data.knowledgebases[0]);
  }
  return allKnowledgeBases;
}

// routes

router.use(function (req, res, next) {
  console.log("accessing knowledge base route");
  next();
});

router.get("/get", async function (req, res) {
    var result = await getKnowledgeBases(req.query.environment)
    res.status(200).json({ message: result }); 
});

export const knowledgeBaseRouter = router;
