import React, { useState } from "react";
import UploadButtons from "../Common/UploadFile.jsx";
import { useHistory } from "react-router-dom";
import { BatchProcessingPath } from "../services/pathService.js";
import { Dropdown, PrimaryButton, TextField } from "@fluentui/react";
import { uploadFilesToBlob, uploadFileToBlob } from "../services/fileUploadService.js";
import { mergeStyles, Stack, StackItem } from "office-ui-fabric-react";
import { classes } from "../styles.jsx";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { createJob } from "../services/tableStorageService.js";
import { sendMessage } from "../services/queueService.js";
import { getModels } from "../services/speechServiceService.js";
import { useEffect } from "react";



export default function NewBatchProcessingScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const [jobName, setJobName] = useState("");
  const [batchFile, setBatchFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [licensePlateFile, setLicensePlateFile] = useState(null);
  const [isBatchFileValid, setIsBatchFileValid] = useState(true);
  const [isTranscriptFileValid, setIsTranscriptFileValid] = useState(true);
  const [isLicensePlateFileValid, setIsLicensePlateFileValid] = useState(true);
  const [, setProgressing] = useState(false);


  const [models, setModels] = useState([])
  const [modelTypes, setModelTypes] = useState()
  const [selectedModelType, setSelectedModelType] = useState("None")
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)

  const dropdownStyles = mergeStyles({ width: "300px" });

  const handleFileUpload = async () => {
    setProgressing(true);

    let files = []
    let jobId = uuidv4()

    if (batchFile != null) {
      files.push(batchFile)
    }
    if (transcriptFile != null) {
      files.push(transcriptFile)
    }
    if (licensePlateFile != null) {
      files.push(licensePlateFile)
    }

    let rowKey = `${jobName}-${jobId}`

    await uploadFilesToBlob(files, "voices", rowKey)

    const jobToBeProcessed = {
      PartitionKey: "BatchJob",
      RowKey: rowKey,
      CompletionPercentage: "0%",
      JobName: jobName,
      LPReferenceFilename: licensePlateFile?.name,
      SpeechLanguageModelName: selectedModel.displayName,
      SpeechLanguageModelId: selectedModel !== "None" ? selectedModel.url : null,
      TranscriptFileName: transcriptFile.name,
      Status: "New"
    };

    await createJob("BatchJobs", jobToBeProcessed);

    const messageToBeSent = {
      JobName: jobName,
      FileName: batchFile.name,
      TranscriptFileName: transcriptFile.name,
      SpeechLanguageModelId: selectedModel !== "None" ? selectedModel.url : null,
      SpeechAcousticModelId: null,
      LPReferenceFilename: licensePlateFile?.name,
      BatchJobId: rowKey
     }
    await sendMessage("voicesfilestasks",messageToBeSent)

    setBatchFile(null);
    setTranscriptFile(null);
    setLicensePlateFile(null);
    setProgressing(false);
  };


  useEffect(async () => {
    var allModels = await getModels();

    setModels(allModels);
    setModelTypes(Object.keys(allModels).map(x=> new Object({key:x, text:x})));
    setAvailableModels(allModels[0]?.map(x=> new Object({key:x.displayName, text:x.displayName})))

  },[]);

  const handleRun = async () => {
    await handleFileUpload();
    history.push(BatchProcessingPath.InitialScreen);
  };

  const handleBatchChangeValid = (value) => {
    setIsBatchFileValid(value);
  };

  const handleTranscriptChangeValid = (value) => {
    setIsTranscriptFileValid(value);
  };

  const handleLicensePlateChangeValid = (value) => {
    setIsLicensePlateFileValid(value);
  };

  const handleChangeBatchFile = (value) => {
    setBatchFile(value);
  };

  const handleChangeTranscriptFile = (value) => {
    setTranscriptFile(value);
  };

  const handleChangeLicensePlateFile = (value) => {
    setLicensePlateFile(value);
  };

  const handleModelTypeChange = (env, value) => {
    setSelectedModelType(value.key);
    if (value.id === "None") {
      setSelectedModel(null);
    } else {
      setSelectedModel(models[value.key][0])
    }
  };

  useEffect(()=>{
    if(selectedModelType !== "None") {
      setAvailableModels(models[selectedModelType].map(x=>new Object({key:x.displayName,text:x.displayName})))
    }
  },[selectedModelType])

  const handleModelChange = (env, value) => {
    setSelectedModel(models[selectedModelType].filter(x=>x.displayName==value.key)[0]);
  };

  return (
    <div>
      <div className={classes.root}>
        <Stack className={classes.stack} gap={20}>
          <h1>{t("NewBatchProcessing_Title")}</h1>
          <Stack gap={20}>
            <StackItem>
              <h4>{t("NewBatchProcessing_AudioFiles_Label")}*</h4>
              <UploadButtons
                onChangeValid={handleBatchChangeValid}
                onChangeFile={handleChangeBatchFile}
                file={batchFile}
                isFileValid={isBatchFileValid}
                accept=".zip"
              />
            </StackItem>
            <StackItem>
              <h4>{t("NewBatchProcessing_TranscriptFiles_Label")}*</h4>
              <UploadButtons
                onChangeValid={handleTranscriptChangeValid}
                onChangeFile={handleChangeTranscriptFile}
                file={transcriptFile}
                isFileValid={isTranscriptFileValid}
                accept="*"
              />
            </StackItem>
            <StackItem>
              <h4>{t("NewBatchProcessing_LicensePlatesFiles_Label")}</h4>
              <UploadButtons
                onChangeValid={handleLicensePlateChangeValid}
                onChangeFile={handleChangeLicensePlateFile}
                file={licensePlateFile}
                isFileValid={isLicensePlateFileValid}
                accept="*"
              />
            </StackItem>
            <StackItem>
              <TextField
                id="1"
                label={t("NewBatchProcessing_JobName_Label")}
                onChange={(event) => setJobName(event.target.value)}
              />
            </StackItem>
            <StackItem>
              <Dropdown
                label={t("NewBatchProcessing_ModelType_Label")}
                onChange={handleModelTypeChange}
                defaultSelectedKey="None"
                options={modelTypes}
                className={dropdownStyles}
              />
            </StackItem>
            <StackItem>
              <Dropdown
                label={t("NewBatchProcessing_Model_Label")}
                onChange={handleModelChange}
                options={availableModels}
                defaultSelectedKey={availableModels &&  availableModels.length > 0 ? availableModels[0].key : undefined}
                className={dropdownStyles}
                disabled={selectedModelType === "None"}
              />
            </StackItem>
          </Stack>
          <PrimaryButton
            className={classes.button}
            text={t('NewBatchProcessing_StartJob_Label')}
            margin="50px"
            onClick={handleRun}
            disabled={
              batchFile === null || !isBatchFileValid
              || transcriptFile === null || !isTranscriptFileValid
              || (licensePlateFile !== null && !isLicensePlateFileValid)
              || jobName === ""
            }
          />
        </Stack>
      </div>
    </div>
  );
}
