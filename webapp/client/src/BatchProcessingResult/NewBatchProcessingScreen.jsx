import React, { useState } from "react";
import UploadButtons from "../Common/UploadFile.jsx";
import { useHistory } from "react-router-dom";
import { BatchProcessingPath } from "../services/pathService.js";
import { PrimaryButton, TextField } from "@fluentui/react";
import { uploadFilesToBlob, uploadFileToBlob } from "../services/fileUploadService.js";
import { Stack, StackItem } from "office-ui-fabric-react";
import { classes } from "../styles.jsx";
import { useTranslation } from 'react-i18next';


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

  const handleFileUpload = async () => {
    setProgressing(true);

    let files = []

    if(batchFile != null) {
      files.push(batchFile)
    }
    if(transcriptFile != null) {
      files.push(transcriptFile)
    }
    if(licensePlateFile != null) {
      files.push(licensePlateFile)
    }
    await uploadFilesToBlob(files, "batchprocessing",jobName)
    setBatchFile(null);
    setTranscriptFile(null);
    setLicensePlateFile(null);
    setProgressing(false);
  };

  //TODO: implement run new test event
  const handleRun = () => {
    handleFileUpload();
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
