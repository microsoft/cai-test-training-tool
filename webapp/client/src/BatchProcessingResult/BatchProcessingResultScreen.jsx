import React, { useEffect, useState } from "react";
import ResultsTable from "./ResultsTable.jsx";
import { useParams } from "react-router-dom";
import { getEntity,getEntityPartition } from "../services/tableStorageService.js";
import { classes } from "../styles"
import { Pivot, PivotItem, Stack, Text } from "office-ui-fabric-react";
import { useTranslation } from 'react-i18next';

export default function BatchProcessingResult() {
  const { rowKey } = useParams();
  const [results, setBatchResults] = useState([]);
  const [metadata, setMetadata] = useState(undefined);
  const { t } = useTranslation();

  const recognitionColumns = [
    { fieldName: "RowKey", name: "File Name", minWidth: 150, maxWidth: 300 },
    { fieldName: "Transcript", name: "Reference", minWidth: 150, maxWidth: 300 },
    { fieldName: "Recognized", name: "Recognized", minWidth: 150 },
    { fieldName: "Processed", name: "Processed", minWidth: 150, maxWidth: 300 },
    { fieldName: "Score", name: "Score", minWidth: 150, maxWidth: 150 },
    { fieldName: "Status", name: "Status", minWidth: 150, maxWidth: 150 },
  ];

  const licensePlaceColumns = [
    { fieldName: "RowKey", name: "File Name", minWidth: 150, maxWidth: 300 },
    { fieldName: "LPTranscript", name: "Reference", minWidth: 150, maxWidth: 200 },
    { fieldName: "Recognized", name: "Recognized", minWidth: 150},
    { fieldName: "ValidationLPRRecognized", name: "Processed", minWidth: 150, maxWidth: 300 },
    { fieldName: "LUISEntities", name: "LUIS Entities", minWidth: 150, maxWidth: 300 },
    { fieldName: "LPRScore", name: "Score", minWidth: 150, maxWidth: 150 },
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
    getEntityPartition("BatchJobDetails",rowKey)
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
            <h1>Batch Processing Results</h1>
            <h2>{metadata.JobName}</h2>
            <Stack className={classes.stack}>
              <Text><b>Word Error Rate:</b> {metadata.LPR}</Text>
              <Text><b>Word Recognition Rate:</b> {metadata.WRR}</Text>
              <Text><b>Sentence Error Rate:</b> {metadata.SER}</Text>
              <Text><b>Lpr Accuracy:</b> {metadata.LPR}</Text>
            </Stack>
            <div style={{ height: "600px" }}>
              <Pivot>
                <PivotItem headerText="Recognition Results">
                  <ResultsTable results={results} columns={recognitionColumns}></ResultsTable>
                </PivotItem>
                <PivotItem headerText="License Plate Results">
                <ResultsTable results={results} columns={licensePlaceColumns}></ResultsTable>
                </PivotItem>
              </Pivot>
            </div>
          </Stack>
        </div>}
    </>
  );
}


