import React, { useEffect, useState } from "react";
import { PrimaryButton, mergeStyleSets, Stack } from "@fluentui/react";
import { classes } from "../styles"

const inputStyle = mergeStyleSets({
  input: {
    opacity: 0,
    zIndex: 1,
    position: "absolute",
  },
});

export default function UploadButtons({
  onChangeValid,
  file,
  onChangeFile,
  isFileValid,
}) {
  const [progressing, setProgressing] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  let fileReader;

  const handleFileRead = (e) => {
    onChangeValid(true);
    var atLeastOneTestCase = false;
    const content = fileReader.result;
    const rows = content.split("\n");
    //ignore first row
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].replace(/ /g,"").length == 0) {
        continue;
      }
      if (rows[i].split(";").length !== 7) {
        onChangeValid(false);
        setErrorInfo("Fehler in Testcase " + String(i) + ". Anzahl der Spalten muss 7 ergeben (6 Semikolons)!");
        break;
      } 
      else {
        atLeastOneTestCase = true;
      }
    }
    if(atLeastOneTestCase == false){
      setErrorInfo("Keinen validen Testcase gefunden! Anzahl der Spalten muss 7 ergeben (6 Semikolons)!");
      onChangeValid(false);
    }
  };

  const handleFileChosen = (file) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

  const handleFileInputChange = (event) => {
    onChangeFile(event.target.files[0]);
  };

  useEffect(() => {
    if (file) {
      handleFileChosen(file);
    }
  }, [file]);

  return (
    <div>
      <Stack gap={10} horizontal>
        <div>

          <input
            className={inputStyle.input}
            id="contained-button-file"
            type="file"
            onChange={handleFileInputChange}
            accept=".csv, .txt"
            disabled={progressing === true}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="contained-button-file">
            <PrimaryButton
              text="Datei hochladen"
              variant="contained"
              color="secondary.light"
              component="span"
            />
          </label>
        </div>
        <span color={file ? "green" : "red"}>
          {file ? file.name : "Keine Datei ausgewählt."}
        </span>
        {!isFileValid && (
          <span color="error">Format fehlerhaft. {errorInfo}</span>
        )}
      </Stack>
    </div>
  );
}
