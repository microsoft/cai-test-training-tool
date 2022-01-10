import express, { json, Router } from 'express';

const router: Router = express.Router({});

const azure = require('azure-storage');

router.get('/actions', async (req, res) => {
        var query = new azure.TableQuery();
        res.status(200).json(await ExecuteQuery(query));
});

router.get('/actions/baseProperties', async (req, res) => {
    if(!req.user.permissions.includes("BMT_Settings_Reader")){
        res.status(403).json({message: "Not authorized!", status: 403});
      } else {
        var query = new azure.TableQuery();
        let names;
        names = await ExecuteQuery(query);
        
        var settings = names.filter(m => m.key == "All_Botselection")[0].options;
        var actionNames = names.filter(m => m.key == "All_Actionselection")[0].options;
        var actionDropdowns = names.filter(m => m.key == "All_Actionselection")[0].values['dev'];
       
        var actionList = [];
        for (var i = 0; i < actionNames.length; i ++ ){
            var singleObj = {};
            singleObj['name'] = actionNames[i];
            singleObj['properties'] = new Array(actionDropdowns[i]);
            actionList.push(singleObj);
        }

        res.status(200).json({
        botName: settings,
        actionName: actionList,
    });
}
});

router.get('/actions/:setting/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_Settings_Reader")){
        res.status(403).json({message: "Not authorized!", status: 403});
      } else {
        var setting = req.params.setting;
        var actionId = req.params.actionId;

        var query = new azure.TableQuery().where('PartitionKey == ? and RowKey == ?', setting, actionId);
        var result = await ExecuteQuery(query)
        res.status(200).json(result[0]);
      }
})

router.delete('/actions/:setting/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_Settings")){
        res.status(403).json({message: "Not authorized!", status: 403});
      } else {
        var setting = req.params.setting;
        var actionId = req.params.actionId;

        var entity = {
            PartitionKey: { "_": setting },
            RowKey: { "_": actionId }
        }
        var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
        var result = await new Promise((resolve) => tableSvc.deleteEntity("BotManagementToolSettings", entity, function (error, response) {
            if (!error) {
                return resolve(true)
            }
            return resolve(false)
        }))
        if (result) {
            res.status(200).send()
        } else {
            res.status(400).send()
        }
      }
})

router.post('/actions', async (req, res) => {
    if(!req.user.permissions.includes("BMT_Settings")){
        res.status(403).json({message: "Not authorized!", status: 403});
      } else {
        return await UpsertAction(req, res);
      }
})

router.put('/actions/:setting/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_Settings")){
        res.status(403).json({message: "Not authorized!", status: 403});
      } else {
        return await UpsertAction(req, res);
      }
})

router.get('/environments', async (req, res) => {
   res.status(200).json(JSON.parse(process.env.QNA_ENV));
});


async function UpsertAction(req, res) {
    var action = req.body;

    var query = new azure.TableQuery().where('PartitionKey == ? and RowKey == ?', action.setting, action.key);
    var exisitngEntity = await ExecuteQuery(query)

    if (exisitngEntity[0] != undefined && action.etag != undefined) {
        if (action.etag != exisitngEntity[0].etag) {
            res.status(409).send();
            return;
        }
    }


    var entity = {
        PartitionKey: { "_": action.setting },
        RowKey: { "_": action.key },
        ActionName: { "_": action.actionName },
        PropertyName: { "_": action.propertyName },
        Options: { "_": JSON.stringify(action.options) },
        Default: { "_": action.default },
        Values: { "_": JSON.stringify(action.values) },
        etag: { "_": GenerateETag(action) }
    }

    var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
    var result = await new Promise((resolve) => tableSvc.insertOrReplaceEntity("BotManagementToolSettings", entity, function (error, result, response) {
        if (!error) {
            return resolve(true)
        }
        return resolve(false)
    }))
    console.log(result);
    if (result) {
        res.status(200).send();
    } else {
        res.status(400).send();
    }
}

async function ExecuteQuery(query) {
    var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
    return await new Promise((resolve) => tableSvc.createTableIfNotExists("BotManagementToolSettings", function (error, result, response) {
        if (!error) {
            // Table exists or created
            let queryResults = new Array<any>();
            var nextContinuationToken = null;
            return tableSvc.queryEntities("BotManagementToolSettings",
                query,
                nextContinuationToken,
                function (error, results) {
                    if (error) throw error;

                    results.entries.forEach(entity => {
                        if (entity.ActionName != undefined && entity.PropertyName != undefined && entity.Options != undefined && entity.Values != undefined) {
                            queryResults.push({ key: entity.RowKey._, setting: entity.PartitionKey._, actionName: entity.ActionName._, propertyName: entity.PropertyName._, options: JSON.parse(entity.Options._), default: entity.Default._, values: JSON.parse(entity.Values._), etag: entity.etag?._ })
                        } else {
                            console.warn(`Entity ${JSON.stringify(entity)} has misisng fields`)
                        }
                    });

                    if (results.continuationToken) {
                        nextContinuationToken = results.continuationToken;
                    }

                    return resolve(queryResults);
                })
        }
    }));
}

export const settingRouter = router;



function GenerateETag(action: any) {
    var crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(action)).digest('hex');
}

