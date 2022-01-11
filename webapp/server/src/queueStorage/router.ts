import express, { Router } from 'express';


const router: Router = express.Router({});
const { QueueServiceClient } = require("@azure/storage-queue");

// services
async function createJob(queueName, body) {
  const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.SA_CONNECTION_STRING);

  const base64Encode = (str) => Buffer.from(str).toString('base64')


  const queueClient = queueServiceClient.getQueueClient(queueName);
  await queueClient.sendMessage(base64Encode(JSON.stringify(body)));
}

router.post("/job", async function (req, res) {
  await createJob(req.query.queueName, req.body, )
  res.status(200).json({ message: "job created successfully" });
});


export const queueStorageRouter = router;
