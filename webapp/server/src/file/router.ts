import express, { Router } from 'express';
var { BlobServiceClient, BlobSASPermissions } = require("@azure/storage-blob");
var azure = require("azure-storage");


const router: Router = express.Router({});
// services

var uploadFilesToBlob = async (files, containerName, path) => {
  if (!files) return [];

  // get blobServiceClient from connection string
  var blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.SA_CONNECTION_STRING
  );

  // get Container - full public read access
  var containerClient = blobServiceClient.getContainerClient(
    containerName
  );

  // upload file
  await createBlobInContainer(containerClient, files, path == undefined ? '': path);

  return getBlobsInContainer(containerClient);
};

const checkFileNames = (blobname, filename) => {
  var fn = filename.split('/');
  var bn = blobname.split('/');

  if (fn.length != bn.length) {
    return false;
  }

  for (let index = 0; index < fn.length; index++) {
    if (fn[index] != bn[index].substring(0, fn[index].length)) {
      return false;
    }
  }

  return true;
};

var getFileFromBlob = async (file: string, container) => {
  // get blobServiceClient from connection string
  var blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.SA_CONNECTION_STRING
  );

  // get Container - full public read access
  var containerClient = blobServiceClient.getContainerClient(
    container
  );

  var blobName = file;
  for await (var blob of containerClient.listBlobsFlat()) {
    if (checkFileNames(blob.name, file)) {
      blobName = blob.name;
    }
  }

  var blobClient = containerClient.getBlobClient(blobName);
  var startDate = new Date();
  var expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 15);
  startDate.setMinutes(startDate.getMinutes() - 1);

  var permisisons = new BlobSASPermissions();
  permisisons.read = true
  var sasUrl = await blobClient.generateSasUrl({ expiresOn: expiryDate, startsOn: startDate, permissions: permisisons })
  return sasUrl
};

var createBlobInContainer = async (containerClient, files, path = '') => {
  for (const key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const file = files[key];
      // create blobClient for container
      var blockBlobClient = containerClient.getBlockBlobClient(`${path == '' ? '' : `${path}/`}${file.name}`);
      await blockBlobClient.upload(file.data, file.size);
    }
  }
};

var getBlobsInContainer = async (containerClient) => {
  var returnedBlobUrls = [];

  // get list of blobs in container
  for await (var blob of containerClient.listBlobsFlat()) {
    returnedBlobUrls.push(
      `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.CONTAINER_NAME}/${blob.name}`
    );
  }
  return returnedBlobUrls;
};

const getFileName = (path) => {
  return path.split('\\').pop().split('/').pop();
};

// routes
const fileUpload = require('express-fileupload');

router.use(fileUpload());
router.use(function (req, res, next) {
  console.log("accessing file upload route");
  next();
});

var getBlobsInContainerHierarchy = async (containerClient, folderName) => {
  console.log(folderName);
  var returnedBlobUrls = [];
  // get list of blobs in container
  for await (var blob of containerClient.listBlobsByHierarchy(folderName)) {
    returnedBlobUrls.push(
      blob.name.trim().slice(0, -1)
    );
  }
  return returnedBlobUrls;
};

router.post("/", async function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No file was uploaded");
  } else if (!req.query.container) {
    return res.status(400).send("No container name was provided");
  } else {
    try {
      var result = await uploadFilesToBlob(req.files, req.query.container, req.query.path)
      res.status(200).json({ message: result });
    } catch (err) {
      console.log("error uploading file: ", err);
      res.status(400).json({ message: err });
    }
  }
});

router.delete("/transcript/:bot/:transcript", async function (req, res) {
  if (!req.user.permissions.includes("BMT_BOT_Tester")) {
    res.status(403).json({ message: "Not authorized!", status: 403 });
  } else {
    var result = await deleteTranscript(req.params.bot, req.params.transcript);
    console.log(result);
    res.status(result ? 200 : 400).send();
  }
});

router.get("/getphonenumber/:bot/:transcript", async function (req, res) {
  var result = await getPhoneNumber(req.params.bot, req.params.transcript);
  console.log(result);
  res.status(result ? 200 : 400).send(result);
});

async function getPhoneNumber(botname, transcriptname) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.SA_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient("bottesting");
  const blockBlobClient = containerClient.getBlockBlobClient(botname + '/current/' + transcriptname + '.transcript');
  const downloadBlockBlobResponse = await blockBlobClient.download(0);

  var transcript = await streamToString(downloadBlockBlobResponse.readableStreamBody);
  var tmpStr = String(transcript).match(/"callee":"(.*?)",/);
  var result = tmpStr[1];

  if (result.startsWith("&#x2B;")) {
    result = result.replace("&#x2B;", "");
  }

  return result;
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

async function deleteTranscript(botname, transcriptname) {
  console.log("deleting transcript...");
  var tableSvc = azure.createBlobService(process.env.SA_CONNECTION_STRING);
  var result = await new Promise((resolve) => tableSvc.deleteBlobIfExists(process.env.BOTTEST_CONTAINER_NAME, botname + "/current/" + transcriptname + ".transcript", function (error, response) {
    if (!error) {
      console.log("no error");
      return resolve(true)
    }
    console.log("testtesttest");
    return resolve(response)
  }))
  console.log("TEST");
  console.log(result);
  return result;
}

router.get("/getcontainerhierarchy", async function (req, res) {
  // get blobServiceClient from connection string
  var blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.SA_CONNECTION_STRING
  );

  // get Container - full public read access
  var containerClient = blobServiceClient.getContainerClient(
    process.env.BOTTEST_CONTAINER_NAME
  );

  var result = await getBlobsInContainerHierarchy(containerClient, "/");

  var allBlobs = new Array<string>();
  for await (var blob of containerClient.listBlobsFlat()) {
    var blobName = blob.name;
    if (blobName != "testruns") {
      allBlobs.push(blobName);
    }
  }

  var bots = new Array();
  result.forEach(
    bot => {
      var blobs = allBlobs.filter(b => b.startsWith(`${bot}/current`)).map(b => getFileName(b).replace(".transcript", "").trim());
      bots.push(new Object({ bot: bot, transcripts: blobs }));
    });

  res.status(200).json(bots);
})

router.get("/", async function (req, res) {
  var container = req.query.container;// process.env.CONTAINER_NAME;
  var fileName = req.query.fileName;//
  var url = await getFileFromBlob(fileName, container)
  console.log(`GetBlob: ${url}`);
  res.redirect(url);
});

export const fileRouter = router;