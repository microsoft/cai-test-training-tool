import express, { Router, Request } from 'express';
var azure = require("azure-storage");


const router: Router = express.Router({});

// services

// services
async function getTableStorage(tableName) {
  var query = new azure.TableQuery();
  return ExecuteQuery(tableName,query)
}

async function createJob(tableName, body, userName) {

  if(body.bot) {

  body["user"] = userName;
  body["environment"] = process.env.ENVIRONMENT;
  }
  else{
    body["username"] = userName;
  }

  var entity = new Object();

  for (var prop in body) {
    if (Object.prototype.hasOwnProperty.call(body, prop)) {
      if (body[prop] != undefined) {
        entity[prop] = new Object({ _: body[prop] });
      }
    }
  }

  var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
  var result = await new Promise((resolve) => tableSvc.insertOrReplaceEntity(tableName, entity, function (error) {
    if (!error) {
      return resolve(true)
    }
    return resolve(false)
  }))
  return result;
}

async function deleteEntity(tableName, partitionKey, rowKey) {
  var entity = {
    PartitionKey: { "_": partitionKey },
    RowKey: { "_": rowKey }
  }
  var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
  var result = await new Promise((resolve) => tableSvc.deleteEntity(tableName, entity, function (error, response) {
    if (!error) {
      return resolve(true)
    }
    return resolve(false)
  }))

  return result;
}

async function getPartitionFromTable(tableName, partitionKey) {
  var query = new azure.TableQuery().where('PartitionKey == ?', partitionKey);
  return await ExecuteQuery(tableName, query)
}

async function getEntityFromTable(tableName, partitionKey, rowKey) {
  var query = new azure.TableQuery().where('PartitionKey == ? and RowKey == ?', partitionKey, rowKey);
  return await ExecuteQuery(tableName, query)
}

// routes
router.get("/", async function (req, res) {
    var result = await getTableStorage(req.query.tableName)
    res.status(200).json({ message: result });
  }
);

router.get("/:tableName/:partitionKey", async function (req, res) {
    var result = await getPartitionFromTable(req.params.tableName, req.params.partitionKey);
    res.status(200).json({message: result });
});

router.get("/:tableName/:partitionKey/:rowKey", async function (req, res) {
    var result = await getEntityFromTable(req.params.tableName, req.params.partitionKey, req.params.rowKey);
    res.status(200).json(result);
});

router.post("/job", async function (req, res) {
  var userName = req.user.profile.displayName;
  await createJob(req.query.tableName, req.body, userName)
  res.status(200).json({ message: "job created successfully" });
});


router.delete("/:tableName/:partitionKey/:rowKey", async function (req, res) {
  var result = await deleteEntity(req.params.tableName, req.params.partitionKey, req.params.rowKey);
  res.status(result ? 200 : 400);
});


async function ExecuteQuery(tableName, query) {
  var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
  return await new Promise((resolve) => tableSvc.createTableIfNotExists(tableName, function (error) {
    if (!error) {
      // Table exists or created
      let queryResults = new Array<any>();

      var nextContinuationToken = null;
      return tableSvc.queryEntities(tableName,
        query,
        nextContinuationToken,
        function (error, results) {
          if (error) throw error;

          results.entries.forEach(entity => {
            var parsedObject = new Object();

            for (var prop in entity) {
              if (Object.prototype.hasOwnProperty.call(entity, prop)) {
                if (entity[prop]["_"] != undefined) {
                  parsedObject[prop] = entity[prop]["_"];
                } else {
                  parsedObject[prop] = '';
                }
              }
            }


            queryResults.push(parsedObject)
          });

          if (results.continuationToken) {
            nextContinuationToken = results.continuationToken;
          }

          return resolve(queryResults);
        })
    }
  })); 
  }

export const tableStorageRouter = router;
