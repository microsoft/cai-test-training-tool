import React, { useEffect, useState } from "react";
import Resulttable from "./TestResultTable.jsx";
import { getTableStorage, getEntityPartition } from "../services/tableStorageService.js";
import { useParams } from "react-router-dom";
import { ActionButton, Stack, Text } from "office-ui-fabric-react";
import { classes, downloadIcon, refreshIcon } from "./../styles";
import { useTranslation } from 'react-i18next';

export default function Result() {
  const { partitionKey } = useParams();
  const [comment, setComment] = useState('');
  const [testsetLink, setTestsetLink] = useState('');
  const [testResults, setTestResults] = useState([]);

  const { t } = useTranslation();

  useEffect(() => {
    getEntityPartition("QnABatchTestJobs", partitionKey)
      .then((result) => {
        setTestsetLink(result.message[0].testset);
        setComment(result.message[0].comment)
      })
      .catch((error) => console.log(error));
    InitializeScreen();
  }, []);

  return (
    <>
      <div className={classes.root}>
        <Stack className={classes.stack} gap={20}>
          <h1>{t("KnowledgeBase_TestDetail_Title")}</h1>
          <h2 margin="50px">{t("KnowledgeBase_TestDetail_SubTitle")}</h2>
          <div hidden={comment == undefined || comment == ''} >
          <h4>{t("KnowledgeBase_TestDetail_CommentHeader")}</h4>
            <Text>{comment}</Text>
          </div>
          <div style={{ height: "450px" }}>
            <ActionButton
              iconProps={refreshIcon}
              text={t("General_Refresh")}
              onClick={() => InitializeScreen()}
            />
            <ActionButton
              iconProps={downloadIcon}
              text={t("KnowledgeBase_TestDetail_DownloadTestSet")}
              href={`/api/file?fileName=${testsetLink}&container=qnatestcasefiles`}
            />
            <Resulttable results={testResults} partitionKey={partitionKey} />
          </div>
        </Stack>
      </div>
    </>
  );

  function InitializeScreen() {
    getEntityPartition("QnABatchTestDetailResults",partitionKey)
      .then((result) => {
        setTestResults(result.message);
      })
      .catch((error) => {
        console.log(error);
        setTestResults([]);
      });
  }
}
