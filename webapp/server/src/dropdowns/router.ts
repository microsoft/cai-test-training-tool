import express, { json, Router } from 'express';

const router: Router = express.Router({});

const azure = require('azure-storage');

router.get('/actions', async (req, res) => {
    if(!req.user.permissions.includes("BMT_BOT_CAM_Reader")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        var query = new azure.TableQuery();
        res.status(200).json(await ExecuteQuery(query));
    }
});

router.get('/actions/baseProperties', async (req, res) => {
    if(!req.user.permissions.includes("BMT_BOT_CAM_Reader")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        res.status(200).json({
        botName: JSON.parse(process.env.BOT_NAME_OPTIONS),
        actionName: JSON.parse(process.env.ACTION_NAME_OPTIONS),
    });
}
});

router.get('/actions/:botName/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_BOT_CAM_Reader")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        var botName = req.params.botName;
        var actionId = req.params.actionId;

        var query = new azure.TableQuery().where('PartitionKey == ? and RowKey == ?', botName, actionId);
        var result = await ExecuteQuery(query)
        res.status(200).json(result[0]);
    }
})

router.delete('/actions/:botName/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_BOT_CAM")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        var botName = req.params.botName;
        var actionId = req.params.actionId;

        var entity = {
            PartitionKey: { "_": botName },
            RowKey: { "_": actionId }
        }
        var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
        var result = await new Promise((resolve) => tableSvc.deleteEntity("DropdownOptions", entity, function (error, response) {
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
    if(!req.user.permissions.includes("BMT_BOT_CAM")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        return await UpsertAction(req, res);
      }
})

router.put('/actions/:botName/:actionId', async (req, res) => {
    if(!req.user.permissions.includes("BMT_BOT_CAM")){
        res.status(403).json({message: "Not authorized!", status: 403});
    } else {
        return await UpsertAction(req, res);
    }
})

async function UpsertAction(req, res) {
    var action = req.body;

    var query = new azure.TableQuery().where('PartitionKey == ? and RowKey == ?', action.botName, action.key);
    var exisitngEntity = await ExecuteQuery(query)

    if (exisitngEntity[0] != undefined && action.etag != undefined) {
        if (action.etag != exisitngEntity[0].etag) {
            res.status(409).send();
            return;
        }
    }


    var entity = {
        PartitionKey: { "_": action.botName },
        RowKey: { "_": action.key },
        ActionName: { "_": action.actionName },
        PropertyName: { "_": action.propertyName },
        Options: { "_": JSON.stringify(action.options) },
        Default: { "_": action.default },
        Values: { "_": JSON.stringify(action.values) },
        etag: { "_": GenerateETag(action) }
    }

    var tableSvc = azure.createTableService(process.env.SA_CONNECTION_STRING);
    var result = await new Promise((resolve) => tableSvc.insertOrReplaceEntity("DropdownOptions", entity, function (error, result, response) {
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
    return await new Promise((resolve) => tableSvc.createTableIfNotExists("DropdownOptions", function (error, result, response) {
        if (!error) {
            // Table exists or created
            let queryResults = new Array<any>();

            var nextContinuationToken = null;
            return tableSvc.queryEntities("DropdownOptions",
                query,
                nextContinuationToken,
                function (error, results) {
                    if (error) throw error;

                    results.entries.forEach(entity => {
                        if (entity.ActionName != undefined && entity.PropertyName != undefined && entity.Options != undefined && entity.Values != undefined) {
                            queryResults.push({ key: entity.RowKey._, botName: entity.PartitionKey._, actionName: entity.ActionName._, propertyName: entity.PropertyName._, options: JSON.parse(entity.Options._), default: entity.Default._, values: JSON.parse(entity.Values._), etag: entity.etag?._ })
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

export const dropdownRouter = router;



function GenerateETag(action: any) {
    var crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(action)).digest('hex');
}

