import express, { Router } from 'express';
var axios = require("axios")


const router: Router = express.Router({});
// services

async function getKnowledgeBases(environment) {

  var keys = process.env.QNA_KEY.split('"');
  var filtered_keys = keys.filter(function(el, index) {
    return index % 2 === 1;
  });
  var subscription = filtered_keys[environment]
  var headers = {
    "Ocp-Apim-Subscription-Key": subscription,
  };
  var requestOptions = {
    method: "GET",
    headers: headers,
  };
  return await axios.get(process.env.API_KNOWLEDGE_BASE, requestOptions);
}

// routes

router.use(function (req, res, next) {
  console.log("accessing knowledge base route");
  next();
});

router.get("/get", async function (req, res) {
    var result = await getKnowledgeBases(req.query.environment)
    if(result.status == 200) {
        res.status(200).json({ message: result.data });
    } else {
      res.status(400);
    }
});

export const knowledgeBaseRouter = router;
