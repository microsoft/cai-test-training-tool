import express, { json, Router } from 'express';

const router: Router = express.Router({});

router.get('/models',(req,res) => {
    res.json({
        "None" : [],
        "Base" : [{displayName : "Base1" , url: "Base1.com"}],
        "Custom" : [{displayName : "Custom1" , url: "Custom1.com"}, {displayName : "Custom2" , url: "Custom2.com"} ],
    }).send();
})

export const speechServiceRouter = router;

