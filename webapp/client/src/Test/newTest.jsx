import React, { useEffect, useState } from "react";
import UploadButtons from "./upload.jsx";
import getKnowledgeBases from "../services/knowledgeBaseService.js";
import { useHistory } from "react-router-dom";
import { TestPath } from "../services/pathService.js";
import { generateRunId } from "../services/utils";
import { createJob } from "../services/tableStorageService.js";
import { PrimaryButton, TextField } from "@fluentui/react";
import { Dropdown } from "office-ui-fabric-react/lib/Dropdown";
import triggerTestExecution from "../services/testFunctionService.js";
import { getTestEnvironments} from "../services/settingService";
import { hasAccessRight } from "../services/accessService";
import { mergeStyles, Stack } from 'office-ui-fabric-react';
import { classes } from "../styles"
import { uploadFilesToBlob } from "../services/fileUploadService.js";
import { useTranslation } from 'react-i18next';

export default function NewTest() {
  const history = useHistory();
  const { t } = useTranslation();

  const [environment, setEnvironment] = useState(0);
  const [environmentName, setEnvironmentName] = useState("");
  const [knowledgebase, setKnowledgebase] = useState("");
  const [knowdledgeBases, setKnowledgeBases] = useState([]);
  const [testsetName, setTestsetName] = useState("");
  const [file, setFile] = useState(null);
  const [environmentOptions, setEnvironmentOptions] = useState();
  const [isFileValid, setIsFileValid] = useState(true);
  const [, setUploadedBlobs] = useState([]);
  const [, setProgressing] = useState(false);
  const [comment, setComment] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    getTestEnvironments()
      .then((result) => {
        console.log(result)
        console.log(result[0])
        var environmentOptions = Object.keys(result).map(function (key) {
          return { key: key, text: result[key] }
        });
        setEnvironmentOptions(environmentOptions);
      })
      .catch((error) => console.log(error));

  }, []);

  const handleEnvironmentChange = (env, data) => {
    setKnowledgeBases([]);
    setEnvironment(data.key);
    setEnvironmentName(data.text);
    getKnowledgeBases(data.key)
      .then((result) => {
        console.log(result);
        setKnowledgeBases(
          result.message.map(
            (kb) => new Object({ key: kb.id, text: kb.name })
          )
        );
      })
      .catch((error) => console.log(error));
  };

  const handleChangeValid = (value) => {
    setIsFileValid(value);
  };

  const handleChangeFile = (value) => {
    setFile(value);
    setTestsetName(value.name);
  };

  const handleFileUpload = async () => {
    setProgressing(true);
    let files = []
    files.push(file)
    const uploadedBlobs = await uploadFilesToBlob(files,"qnatestcasefiles").then(() => {
      setTestsetName(file.name);
    });
    setUploadedBlobs(uploadedBlobs);
    setFile(null);
    setProgressing(false);
  };

  const handleKnowledegBaseChange = (event, data) => {
    setKnowledgebase(data.key);
  };


  const dropdownStyles = mergeStyles({ width: '300px' })

  const handleRun = () => {
    const runId = generateRunId();

    handleFileUpload();

    const jobToBeProcessed = {
      PartitionKey: runId + "",
      RowKey: "test" + "",
      testset: testsetName,
      username: "username",
      environment: environmentName + "",
      status: "INPROGRESS",
      kbId: knowledgebase + "",
      comment: comment,
    };

    createJob("QnABatchTestJobs", jobToBeProcessed);
    triggerTestExecution(
      environment,
      testsetName,
      knowledgebase,
      generateRunId()
    );
    history.push(TestPath.InitialScreen);
  };

  return (
    <div>
      <div className={classes.root}>
        <Stack className={classes.stack} gap={20}>
          <h1>{t("KnowledgeBase_NewTest_NewTest")}</h1>
          <h4>{t("KnowledgeBase_NewTest_Environment")}*</h4>
          <Dropdown
            placeholder = {t("KnowledgeBase_NewTest_SelectFile")}
            onChange={handleEnvironmentChange}
            options={environmentOptions}
            className={dropdownStyles}
          />
          <Stack className={classes.stack} horizontal gap={20}>
            <Stack gap={20}>
              <h4>Knowledge Base*</h4>
              <Dropdown
                placeholder={t("KnowledgeBase_NewTest_SelectFile")}
                onChange={handleKnowledegBaseChange}
                options={knowdledgeBases}
                className={dropdownStyles}
              />
            </Stack>
            <Stack gap={20}>
              <h4>{t("KnowledgeBase_NewTest_Testcases")}*</h4>
              <UploadButtons
                onChangeValid={handleChangeValid}
                file={file}
                onChangeFile={handleChangeFile}
                isFileValid={isFileValid}
              />
            </Stack>
          </Stack>
          <TextField
            multiline
            rows={5}
            id="1"
            label={t("KnowledgeBase_NewTest_Comment")}
            value={comment}
            variant="filled"
            onChange={(event) => setComment(event.target.value)}
          />
          <PrimaryButton
            className={classes.button}
            text={t("KnowledgeBase_NewTest_StartTest")}
            variant="contained"
            color="primary"
            margin="50px"
            onClick={handleRun}
            disabled={file === null || !isFileValid || testsetName === "" }
          />
        </Stack>
      </div >
    </div>
  );
}
