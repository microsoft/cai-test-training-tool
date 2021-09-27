import React, { useEffect, useState } from "react";
import { mergeStyleSets, PrimaryButton, Stack } from "@fluentui/react";
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
  const [isValidSub, setIsValidSub] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");

  let fileReader;

  const handleFileRead = (e) => {
    onChangeValid(true);
    var atLeastOneTestCase = false;
    const content = fileReader.result;
    const rows = content.split("\n");
    //ignore first row
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].replace(/\s/g, '').length) {
        console.log(atLeastOneTestCase);
        console.log("found empty line!");
        continue;
      }
      if (rows[i].split(";").length !== 7) {
        onChangeValid(false);
        console.log("incorrect line found")
        setErrorInfo("Fehler in Testcase " + String(i) + ". Anzahl der Spalten muss 7 ergeben (6 Semikolons)!");
        break;
      }
      else {
        atLeastOneTestCase = true;
      }
    }
    console.log(atLeastOneTestCase);
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

  useEffect(() => {
    setIsValidSub(isFileValid);
  }, [isFileValid]);
  // const handleFileUpload = async () => {
  //   setProgressing(true);
  //   const uploadedBlobs = await uploadFileToBlob(file).then(() => {onChange(file.name); console.log(file.name)});
  //   setUploadedBlobs(uploadedBlobs)
  //   setFile(null);
  //   setProgressing(false)
  // }

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
            style={{cursor:"pointer"}}
          ></input>
          <label htmlFor="contained-button-file">
            <PrimaryButton text="Datei hochladen" />
          </label>
        </div>
        <span color={file ? "green" : "red"}>
          {file ? file.name : "Keine Datei hochgeladen."}
        </span>
        {!isFileValid && (
          <span color="error">Format fehlerhaft. {errorInfo}</span>
          )}
        {/* </>)} */}
      </Stack>
    </div>
  );
}
