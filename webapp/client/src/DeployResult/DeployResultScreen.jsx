import React, { useEffect, useState } from "react";
import Resulttable from "./DeployResultTable.jsx";
import { useParams } from "react-router-dom";
import { getEntityPartition } from "../services/tableStorageService.js";
import { classes } from "../styles"
import { ActionButton, Stack, Text } from "office-ui-fabric-react";
import { useTranslation } from 'react-i18next';

export default function DeployResult() {
  const { partitionKey } = useParams();
  const [testResults, setTestResults] = useState([]);
  const [testMetadata, setTestMetadata] = useState(undefined);
  const [comment, setComment] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    getEntityPartition("QnADeploymentJobs", partitionKey)
      .then((result) => {
        setTestMetadata(result[0]);
        setComment(result[0].comment)
      })
      .catch((error) => console.log(error));
    InitializeScreen();
  }, []);

  function InitializeScreen() {
    getEntityPartition("QnADeploymentTestDetailResults",partitionKey)
      .then((result) => {
        setTestResults(result.message);
      })
      .catch((error) => {
        console.log(error);
        setTestResults([]);
      });
  }

  const refreshIconProps = { iconName: 'Refresh' };

  return (
    <>
      <div className={classes.root}>
        <Stack className={classes.stack} gap={20}>
          <h1>{t("KnowledgeBase_DeploymentResult_Title")}</h1>
          <h2 margin="50px">Details</h2>
          <div hidden={comment == undefined || comment == ''} >
            <h4>{t("KnowledgeBase_DeploymentResult_CommentHeader")}</h4>
            <Text>{comment}</Text>
          </div>
          <div style={{ height: "600px" }}>
          <ActionButton
              iconProps={refreshIconProps}
              text={t("General_Refresh")}
              onClick={() => InitializeScreen()}
            />
            <Resulttable results={testResults} partitionKey={partitionKey} />
          </div>
        </Stack>
      </div>
    </>
  );
}


