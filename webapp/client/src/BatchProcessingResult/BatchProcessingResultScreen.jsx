import React, { useEffect, useState } from "react";
import ResultsTable from "./ResultsTable.jsx";
import { useParams } from "react-router-dom";
import { getEntity, getEntityPartition } from "../services/tableStorageService.js";
import { classes } from "../styles"
import { Pivot, PivotItem, Stack, Text } from "office-ui-fabric-react";
import { useTranslation } from 'react-i18next';

export default function BatchProcessingResult() {
  const { rowKey } = useParams();
  const [results, setBatchResults] = useState([]);
  const [metadata, setMetadata] = useState(undefined);
  const { t } = useTranslation();

  const recognitionColumns = [
    { fieldName: "RowKey", name: t("BatchProcessingResult_FileNameFieldName"), minWidth: 150, maxWidth: 300 },
    { fieldName: "Transcript", name: t("BatchProcessingResult_ReferenceFieldName"), minWidth: 150, maxWidth: 300 },
    { fieldName: "Recognized", name: t("BatchProcessingResult_RecognizedFieldName"), minWidth: 150 },
    { fieldName: "Processed", name: t("BatchProcessingResult_ProcessedFieldName"), minWidth: 150, maxWidth: 300 },
    { fieldName: "Score", name: t("BatchProcessingResult_ScoreFieldName"), minWidth: 150, maxWidth: 150 },
    { fieldName: "Status", name: t("BatchProcessingResult_StatusFieldName"), minWidth: 150, maxWidth: 150 },
  ];

  const licensePlaceColumns = [
    { fieldName: "RowKey", name: t("BatchProcessingResult_FileNameFieldName"), minWidth: 150, maxWidth: 300 },
    { fieldName: "LPTranscript", name: t("BatchProcessingResult_ReferenceFieldName"), minWidth: 150, maxWidth: 200 },
    { fieldName: "Recognized", name: t("BatchProcessingResult_RecognizedFieldName"), minWidth: 150 },
    { fieldName: "ValidationLPRRecognized", name: t("BatchProcessingResult_ProcessedFieldName"), minWidth: 150, maxWidth: 300 },
    {
      name: t("BatchProcessingResult_LUISEntitiesFieldName"), minWidth: 150, maxWidth: 300, isMultiline: true,
      onRender: (item) => {

        if (item.LUISEntitiesJson != null) {


          let parsedJson = JSON.parse(item.LUISEntitiesJson)

          if (parsedJson != undefined && parsedJson.length > 0) {
            return (
              <>
              <b>Text:</b> {parsedJson[0].text}<br />
              <b>StartIndex:</b> {parsedJson[0].startIndex}<br />
              <b>Length:</b> {parsedJson[0].length}<br />
              <b>Score:</b> {parsedJson[0].score}<br />
              </>
            );
          }
        }
        return ("")
      }
    },
    { fieldName: "LPRScore", name: t("BatchProcessingResult_ScoreFieldName"), minWidth: 150, maxWidth: 150 },
  ];


  useEffect(() => {
    getEntity("BatchJobs", "BatchJob", rowKey)
      .then((result) => {
        setMetadata(result);
      })
      .catch((error) => console.log(error));
    InitializeScreen();
  }, []);

  function InitializeScreen() {
    getEntityPartition("BatchJobDetails", rowKey)
      .then((result) => {
        setBatchResults(result.message);
      })
      .catch((error) => {
        console.log(error);
        setBatchResults([]);
      });
  }

  return (
    <>
      {metadata != undefined &&
        <div className={classes.root}>
          <Stack className={classes.stack} gap={20}>
            <h1>{t("BatchProcessingResult_Title")}</h1>
            <h2>{metadata.JobName}</h2>
            <Stack className={classes.stack}>
              <Text><b>{t("BatchProcessingResult_WerLabel")}:</b> {metadata.LPR}</Text>
              <Text><b>{t("BatchProcessingResult_WrrLabel")}:</b> {metadata.WRR}</Text>
              <Text><b>{t("BatchProcessingResult_SerLabel")}:</b> {metadata.SER}</Text>
              <Text><b>{t("BatchProcessingResult_LprLabel")}:</b> {metadata.LPR}</Text>
            </Stack>
            <div style={{ height: "600px" }}>
              <Pivot>
                <PivotItem headerText={t("BatchProcessingResult_RecognitionResultsTitle")}>
                  <ResultsTable results={results} columns={recognitionColumns}></ResultsTable>
                </PivotItem>
                <PivotItem headerText={t("BatchProcessingResult_LicensePlateResultsTitle")}>
                  <ResultsTable results={results} columns={licensePlaceColumns}></ResultsTable>
                </PivotItem>
              </Pivot>
            </div>
          </Stack>
        </div>}
    </>
  );
}


