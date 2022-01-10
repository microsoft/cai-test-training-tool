import React, { useEffect, useState } from "react";
import AudioGenerationResultsTable from "./AudioGenerationResultsTable.jsx";
import { useParams } from "react-router-dom";
import { getEntity, getEntityPartition } from "../services/tableStorageService.js";
import { classes } from "../styles"
import { Stack, Text } from "office-ui-fabric-react";
import { useTranslation } from 'react-i18next';

export default function AudioGenerationResult() {
  const { rowKey } = useParams();
  const [results, setAudioGenerationDetailsResults] = useState([]);
  const [metadata, setMetadata] = useState(undefined);
  const { t } = useTranslation();

  const AudioGenerationColumns = [
    { fieldName: "Transcript", name: t("AudioGeneration_Text"), minWidth: 150, maxWidth: 300 },
    { fieldName: "FileName", name: t("BatchProcessingResult_FileNameFieldName"), minWidth: 150 },
    { fieldName: "Status", name: t("BatchProcessingResult_StatusFieldName"), minWidth: 150, maxWidth: 150 },
    { fieldName: "Error", name: t("AudioGeneration_Error"), minWidth: 150, maxWidth: 300 }
  ];


  useEffect(() => {
    getEntity("AudioGenerationJobs", "AudioGenerationJob", rowKey)
      .then((result) => {
        setMetadata(result);
      })
      .catch((error) => console.log(error));
    InitializeScreen();
  }, []);

  function InitializeScreen() {
    getEntityPartition("AudioGenerationJobDetails", rowKey)
      .then((result) => {
        setAudioGenerationDetailsResults(result.message);
      })
      .catch((error) => {
        console.log(error);
        setAudioGenerationDetailsResults([]);
      });
  }

  return (
    <>
      {metadata != undefined &&
        <div className={classes.root}>
          <Stack className={classes.stack} gap={20}>
            <h1>{t("AudioGenerationResult_Title")}</h1>
            <h2>{metadata.JobName}</h2>
            <Stack className={classes.stack}>
              <Text><b>{t("AudioGeneration_SpeechServiceType")}:</b> {metadata.SpeechServiceType}</Text>
              <Text><b>{t("AudioGeneration_Language")}:</b> {metadata.AudioLanguage}</Text>
            </Stack>
            <div style={{ height: "600px" }}>
              <AudioGenerationResultsTable results={results} columns={AudioGenerationColumns}></AudioGenerationResultsTable>
            </div>
          </Stack>
        </div>}
    </>
  );
}


