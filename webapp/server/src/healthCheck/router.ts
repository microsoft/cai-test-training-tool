
import express, { Router } from 'express';

const router: Router = express.Router({});

router.get('*', (req,res) => {
    res.status(200).json("Healthy");
});

export const healthCheckRouter = router;