import React, { useState } from "react";
import UploadButtons from "../Common/UploadFile.jsx";
import { useHistory } from "react-router-dom";
import { AudioGenerationPath } from "../services/pathService.js";
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
      AudioFont: selectedVoice !== null ? selectedVoice.ShortName : null,
      AudioLanguage: selectedVoicesLanguages !== null ? selectedVoicesLanguages : null,
      SpeechServiceType: selectedServiceType !== null ? selectedServiceType : null,
      TranscriptFileName: transcriptFile.name,
      Status: "New"
    };

    await createJob("AudioGenerationJobs", jobToBeProcessed);

    const messageToBeSent = {
      Jobname: jobName,
      TranscriptFile: transcriptFile.name,
      AudioFont: selectedVoice !== null ? selectedVoice.ShortName : null,
      TTSProvider: selectedServiceType !== null ? selectedServiceType : null,
      GenerateTranscript: false,
      Level : 2,
      Language : selectedVoicesLanguages !== null ? selectedVoicesLanguages : null,
      JobId: rowKey
    }
    await sendMessage(messageToBeSent)

    setTranscriptFile(null);
    setSelectedServiceType("None");
    setSelectedVoicesLanguages(null);
    setShowSpinner(false);
  };


  useEffect(async () => {
    setSpinnerMessage(t('General_SpinnerLabel_LoadingVoices'));
    setShowSpinner(true);
    var allVoices = await getVoices();
    setVoices(allVoices);
    setspeachServiceTypes(Object.keys(allVoices).map(x => new Object({ key: x, text: x })));
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
    if (selectedServiceType === "Microsoft") {

      setAvailableVoicesLanguages(Voices[selectedServiceType].map(x => x.Locale).filter((value, index, self) => self.indexOf(value) === index).map(x => new Object({ key: x, text: x })));
      setSelectedVoicesLanguages(Voices[selectedServiceType][0].Locale)
    } else {
      setAvailableVoicesLanguages([])
      setAvailableVoices([])
      setSelectedVoicesLanguages(null)
      setSelectedVoice(null)
    }
  }, [selectedServiceType])


  useEffect(() => {
    if (selectedServiceType === "Microsoft") {
      setAvailableVoices(Voices[selectedServiceType].filter(x => x.Locale == selectedVoicesLanguages).map(x => new Object({ key: x.Name, text: x.DisplayName })));
      setSelectedVoice(Voices[selectedServiceType].filter(x => x.Locale == selectedVoicesLanguages)[0])
    }
  }, [selectedVoicesLanguages])



  const handleVoicesChange = (env, value) => {
    setSelectedVoice(Voices[selectedServiceType].filter(x => x.Locale == selectedVoicesLanguages).filter(x => x.Name == value.key)[0]);

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
            <h1>{t("NewAudioGeneration_Title")}</h1>
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
                      label={t("NewAudioGeneration_SpeechService_Label")}
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
                          label= {t("NewAudioGeneration_Languages_Label")}
                          onChange={handleLanguagesOptionChange}
                          options={voicesLanguages}
                          defaultSelectedKey={voicesLanguages && voicesLanguages.length > 0 ? voicesLanguages[0].key : undefined}
                          className={dropdownStyles}
                          disabled={selectedServiceType === "None"}
                        />
                      </StackItem>
                      <StackItem>
                        <Dropdown
                          label={t("NewAudioGeneration_Voices_Label")}
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
                transcriptFile === null || !isTranscriptFileValid
                || jobName === "" || selectedVoice === null
              }
            />
          </Stack>
        </div>
      )
      }
    </div >
  );
}
