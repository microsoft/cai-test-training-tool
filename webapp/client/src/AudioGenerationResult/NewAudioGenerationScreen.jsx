import React, { useState } from "react";
import UploadButtons from "../Common/UploadFile.jsx";
import { useHistory } from "react-router-dom";
import { AudioGenerationPath } from "../services/pathService.js";
import { generateRunId } from "../services/utils";
import { Dropdown, PrimaryButton, TextField } from "@fluentui/react";
import { mergeStyles, Stack } from "office-ui-fabric-react";
import { classes } from "../styles.jsx";
import { uploadFilesToBlob } from "../services/fileUploadService.js";

const dropdownStyles = mergeStyles({ width: "300px" });

export default function NewAudioGenerationScreen() {
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

  const handleFileUpload = async () => {
    setProgressing(true);

    let files = []
    files.push(file)

    const uploadedBlobs = await uploadFilesToBlob(files).then(() => {
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
    history.push(AudioGenerationPath.InitialScreen);
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
