import React, { useEffect, useState } from "react";
import UploadButtons from "../Common/UploadFile.jsx";
import getKnowledgeBases from "../services/knowledgeBaseService.js";
import { useHistory } from "react-router-dom";
import { DeployPath } from "../services/pathService.js";
import { generateRunId } from "../services/utils";
import { createJob } from "../services/tableStorageService.js";
import { startReleasePipeline } from "../services/startReleasePipelineService";
import { hasAccessRight } from "../services/accessService";
import { Dropdown, PrimaryButton, TextField } from "@fluentui/react";
import { mergeStyles, mergeStyleSets, Stack } from "office-ui-fabric-react";
import { classes } from "../styles.jsx";

const dropdownStyles = mergeStyles({ width: "300px" });

export default function NewDeploy() {
  const history = useHistory();
  const [knowledgeBase, setKnowledgeBase] = useState(0);
  const [knowdledgeBases, setKnowledgeBases] = useState([]);
  const [testsetName, setTestsetName] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [isFileValid, setIsFileValid] = useState(true);
  const [, setUploadedBlobs] = useState([]);
  const [, setProgressing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    getKnowledgeBases("UAT")
      .then((result) => {
        setKnowledgeBases(
          result.message.knowledgebases.map(
            (kb) => new Object({ key: kb.id, text: kb.name })
          )
        );
      })
      .catch((error) => console.log(error));

    hasAccessRight("BMT_QNA_Deploy")
      .then((result) => {
        if (result == true) {
          setHasAccess(true);
        }
      })
      .catch((error) => console.log(error));
  }, []);

  const handleKnowledgeBaseChange = (env, value) => {
    setKnowledgeBase(value.key);
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

  //TODO: implement run new test event
  const handleRun = () => {
    handleFileUpload();
    const runId = generateRunId();
    const jobToBeProcessed = {
      PartitionKey: runId + "",
      RowKey: "deploy",
      testset: testsetName,
      username: "username",
      //initial status when written to db
      status: "Warten auf Genehmigung",
      kbId: knowledgeBase + "",
      comment: comment,
      result: "-",
    };

    var releaseComment = `${runId}\n${comment}`;

    createJob("QnADeploymentJobs", jobToBeProcessed);
    startReleasePipeline(runId, knowledgeBase, testsetName, releaseComment);
    history.push(DeployPath.InitialScreen);
  };

  return (
    <div>
      <div className={classes.root}>
        <Stack className={classes.stack} gap={20}>
          <h1>Neues Deployment</h1>
          <Stack horizontal className={classes.stack} gap={20}>
            <Stack gap={20}>
              <h4>Knowledge Base*</h4>
              <Dropdown
                placeholder="Bitte auswählen..."
                onChange={handleKnowledgeBaseChange}
                options={knowdledgeBases}
                className={dropdownStyles}
              />
            </Stack>
            <Stack gap={20}>
              <h4>Testfälle*</h4>
              <UploadButtons
                onChangeValid={handleChangeValid}
                file={file}
                onChangeFile={handleChangeFile}
                isFileValid={isFileValid}
                accept=".csv .txt"
              />
            </Stack>
          </Stack>
          <TextField
            multiline
            rows={5}
            id="1"
            label="Bemerkung"
            value={comment}
            variant="filled"
            onChange={(event) => setComment(event.target.value)}
          />
          <PrimaryButton
            className={classes.button}
            text="Deployment starten"
            margin="50px"
            onClick={handleRun}
            disabled={
              file === null || !isFileValid || testsetName === "" || !hasAccess
            }
          />
        </Stack>
      </div>
      <span style={{color: 'red'}}>
        {hasAccess ? "" : "Fehlende Rechte, um Deployment zu starten."}
      </span>
    </div>
  );
}
