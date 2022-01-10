import express, { json, Router } from 'express';

const router: Router = express.Router({});

const azure = require('azure-storage');

router.get('/groups', async (req, res) => {
        res.status(200).json(req.user.permissions);
});

router.get('/groups/:group', async (req, res) => {
    //var hasPermission = req.user.permissions.includes(req.params.group);
    res.status(200).json({hasPermissions: true})
})

export const accessRouter = router;


