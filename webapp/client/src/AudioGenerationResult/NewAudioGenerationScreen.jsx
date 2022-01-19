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
import { sendMessage } from "../services/audioGenerationService.js";
import { getVoices } from "../services/speechServiceService.js";
import { useEffect } from "react";
import { LoadingSpinner } from "../Common/LoadingSpinner.jsx";



export default function NewBatchProcessingScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const [jobName, setJobName] = useState("");
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [isTranscriptFileValid, setIsTranscriptFileValid] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerMessage, setSpinnerMessage] = useState('');


  const [Voices, setVoices] = useState([])


  const [speachServiceTypes, setspeachServiceTypes] = useState()
  const [selectedServiceType, setSelectedServiceType] = useState("None")

  const [voicesLanguages, setAvailableVoicesLanguages] = useState([])
  const [selectedVoicesLanguages, setSelectedVoicesLanguages] = useState(null)

  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  const dropdownStyles = mergeStyles({ width: "300px" });
  const spinnerStyle = mergeStyles({ height: '100vh', position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, background: 'rgba(255, 255, 255, 0.6)' });

  const handleFileUpload = async () => {
    setSpinnerMessage(t('General_SpinnerLabel_ProcessingRequest'));
    setShowSpinner(true);

    let files = []
    let jobId = uuidv4()

    if (transcriptFile != null) {
      files.push(transcriptFile)
    }

    let rowKey = `${jobName}-${jobId}`

    await uploadFilesToBlob(files, "audiogeneration", rowKey)

    const jobToBeProcessed = {
      PartitionKey: "AudioGenerationJob",
      RowKey: rowKey,
      CompletionPercentage: "0%",
      JobName: jobName,
      AudioFont: selectedVoice !== null ? selectedVoice.displayName : null,
      AudioLanguage: selectedVoicesLanguages !== null ? selectedVoicesLanguages.displayName : null,
      SpeechServiceType: selectedServiceType !== null ? selectedServiceType.displayName : null,
      TranscriptFileName: transcriptFile.name,
      Status: "New"
    };

    await createJob("AudioGenerationJobs", jobToBeProcessed);

    const messageToBeSent = {
      Jobname: jobName,
      TranscriptFile: transcriptFile.name,
      AudioFont: selectedVoice !== null ? selectedVoice.displayName : null,
      TTSProvider: selectedServiceType !== null ? selectedServiceType.displayName : null,
      GenerateTranscript: false,
      Level : 2,
      Language : selectedVoicesLanguages !== null ? selectedVoicesLanguages.displayName : null,
      JobId: rowKey
    }
    await sendMessage(messageToBeSent)

    setTranscriptFile(null);
    setSelectedServiceType("Microsoft");
    setSelectedVoicesLanguages(null);
    setShowSpinner(false);
  };


  useEffect(async () => {
    setSpinnerMessage(t('General_SpinnerLabel_LoadingModels'));
    setShowSpinner(true);
    var allVoices = await getVoices();

    setVoices(allVoices);
    setspeachServiceTypes(Object.keys(allModels).map(x => new Object({ key: x, text: x })));
    setShowSpinner(false);
  }, []);

  const handleRun = async () => {
    await handleFileUpload();
    history.push(AudioGenerationPath.InitialScreen);
  };


  const handleTranscriptChangeValid = (value) => {
    setIsTranscriptFileValid(value);
  };


  const handleChangeTranscriptFile = (value) => {
    setTranscriptFile(value);
  };

  const handleLanguagesOptionChange = (env, value) => {
    setSelectedVoicesLanguages(value.key)
  };

  const handleServiesTypeChange = (env, value) => {
    setSelectedServiceType(value.key);
  };

  useEffect(() => {
    if (selectedServiceType !== "None") {
      setAvailableVoicesLanguages(models[selectedServiceType].map(x => new Object({ key: x.displayName, text: x.displayName })))
      // setSelectedModelOption(models[selectedModelType][0].displayName)
    } else {
      setAvailableVoicesLanguages([])
      setAvailableVoices([])
      setSelectedVoice(null)
    }
  }, [selectedServiceType])



  const handleVoicesChange = (env, value) => {
    // setSelectedVoice(Voices[selectedModelType].filter(x => x.displayName == selectedModelOption)[0].options.filter(x => x.displayName == value.key)[0]);
  };

  return (
    <div>
      {showSpinner && (
        <div
          className={spinnerStyle}
        >
          <LoadingSpinner message={spinnerMessage} />
        </div>
      )}
      {!showSpinner && (
        <div className={classes.root}>
          <Stack className={classes.stack} gap={20}>
            <h1>{t("NewBatchProcessing_Title")}</h1>
            <Stack gap={20}>
  
              <StackItem>
                <h4>{t("NewBatchProcessing_TranscriptFiles_Label")}*</h4>
                <UploadButtons
                  onChangeValid={handleTranscriptChangeValid}
                  onChangeFile={handleChangeTranscriptFile}
                  file={transcriptFile}
                  isFileValid={isTranscriptFileValid}
                  accept=".txt"
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
                <Stack className={classes.stack} gap={20} horizontal>
                  <StackItem>
                    <Dropdown
                      label="Speech Service:"
                      onChange={handleServiesTypeChange}
                      defaultSelectedKey="None"
                      options={speachServiceTypes}
                      className={dropdownStyles}
                    />
                  </StackItem>
                  {selectedServiceType !== "None" && (
                    <>
                      <StackItem>
                        <Dropdown
                          label= "Languages:"
                          onChange={handleLanguagesOptionChange}
                          options={voicesLanguages}
                          defaultSelectedKey={voicesLanguages && voicesLanguages.length > 0 ? voicesLanguages[0].key : undefined}
                          className={dropdownStyles}
                          disabled={selectedServiceType === "None"}
                        />
                      </StackItem>
                      <StackItem>
                        <Dropdown
                          label="Voices:"
                          onChange={handleVoicesChange}
                          options={availableVoices}
                          defaultSelectedKey={availableVoices && availableVoices.length > 0 ? availableVoices[0].key : undefined}
                          className={dropdownStyles}
                          disabled={selectedServiceType === "None"}
                        />
                      </StackItem>
                    </>
                  )}
                </Stack>
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
      )
      }
    </div >
  );
}
