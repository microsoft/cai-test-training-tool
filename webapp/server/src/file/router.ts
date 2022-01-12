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

  await containerClient.createIfNotExists();

  // upload file
  await createBlobInContainer(containerClient, files, path == undefined ? '' : path);

  return getBlobsInContainer(containerClient, containerName);
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

var getBlobsInContainer = async (containerClient, blobPrefix = "") => {
  var returnedBlob = [];

  // get list of blobs in container
  for await (var blob of containerClient.listBlobsFlat({prefix: blobPrefix})) {
    returnedBlob.push(
      blob.name
    );
  }
  return returnedBlob;
};


// routes
const fileUpload = require('express-fileupload');

router.use(fileUpload());
router.use(function (req, res, next) {
  console.log("accessing file upload route");
  next();
});

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

router.delete("/:container/:blobName", async function (req, res) {
  var result = await deleteBlobsInPath(req.params.container, req.params.blobName);
  res.status(result ? 200 : 400).send();
});


async function deleteBlobsInPath(container, folderName) {
  var blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.SA_CONNECTION_STRING
  );

  // get Container - full public read access
  var containerClient = blobServiceClient.getContainerClient(
    container
  );

  var blobsToDelete = await getBlobsInContainer(containerClient,folderName)


  var blobSvc = azure.createBlobService(process.env.SA_CONNECTION_STRING);

  var result = true;

  for (let index = 0; index < blobsToDelete.length; index++) {
    const element = blobsToDelete[index];
    var deletionResult = await new Promise((resolve) => blobSvc.deleteBlobIfExists(container, element, function (error, response) {
      if (!error) {
        return resolve(true)
      }
      return resolve(response)
    }))
    
    if(!deletionResult) {
      result = false;
      break;
    }
  }

  return result;
}


router.get("/", async function (req, res) {
  var container = req.query.container;
  var fileName = req.query.fileName;
  var url = await getFileFromBlob(fileName, container)
  res.redirect(url);
});

export const fileRouter = router;