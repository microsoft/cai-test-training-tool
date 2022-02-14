import React, { useEffect, useState } from "react";
import { mergeStyleSets, PrimaryButton, Stack } from "@fluentui/react";
import { useTranslation } from 'react-i18next';

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
  accept
}) {
  const [progressing, setProgressing] = useState(false);
  const [isValidSub, setIsValidSub] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");
  const { t } = useTranslation();

  let fileReader;

  const handleFileRead = (e) => {
    onChangeValid(true);
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

  return (
    <div>
      <Stack gap={10} horizontal>
        <div>

          <input
            className={inputStyle.input}
            id="contained-button-file"
            type="file"
            onChange={handleFileInputChange}
            accept={accept}
            style={{cursor:"pointer"}}
          ></input>
          <label htmlFor="contained-button-file">
            <PrimaryButton text={t('UploadFile_ButtonLabel')} />
          </label>
        </div>
        <span color={file ? "green" : "red"}>
          {file ? file.name : t('UploadFile_NoFileLabel')}
        </span>
        {!isFileValid && (
          <span color="error">{t('UploadFile_IncorrectFormatLabel')} {errorInfo}</span>
          )}
        {/* </>)} */}
      </Stack>
    </div>
  );
}
