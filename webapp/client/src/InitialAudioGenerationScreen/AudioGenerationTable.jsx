import React, { useEffect, useState } from "react";
import {
  DetailsList,
  ProgressIndicator,
  SelectionMode,
  DetailsRow,
  ActionButton,
  Link
} from "@fluentui/react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { deleteEntity, getTableStorage } from "../services/tableStorageService.js";

import { useTranslation } from 'react-i18next';
import { AudioGenerationPath, getPath } from "../services/pathService.js";
import { deleteIcon, handleColumnClick, onRenderRow, progressClass, refreshIcon, TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";

const moment = require("moment");
const DATE_FORMAT = "DD.MM.YYYY HH:mm:ss";

export default function AudioGenerationTable() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [audioGenerationJobs, setAudioGenerationJobs] = useState([]);

  

  const [columns, setColumns] = useState([
    {
      key: "Delete",
      name: "",
      minWidth: TableFieldSizes.DeleteFieldSize,
      minWidth: TableFieldSizes.DeleteFieldSize,
      isResizable: false,
      onRender: (item) => {
        return (
          <ActionButton iconProps={deleteIcon}
             allowDisabledFocus
              onClick={()=>{
                deleteEntity("AudioGenerationJobs",item.PartitionKey,item.RowKey)
                initializeScreen()
              }}
             >
            </ActionButton>
        )
      },
    },
    {
      name: "Job Name", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: true,
      onRender: (item) => {
        return <Link href={getPath(AudioGenerationPath.Results, { rowKey: item.RowKey })}>{item.JobName}</Link>
      }
    },
    {
      fieldName: "Timestamp",
      name: t("BatchProcessing_LastUpdateFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      isResizable: true,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
    },
    {
      name: t("BatchProcessing_PercentageFieldName"),
      minWidth: 100,
      maxWidth: 130,
      isMultiline: false,
      onRender: (item) => {
        return (
          <ProgressIndicator className={progressClass} barHeight={4} label={item.CompletionPercentage} percentComplete={parseInt(item.CompletionPercentage.replace("%", "")) / 100} />
        );
      },
      isResizable: true
    },
    {
      name: "Generated", minWidth: 50, maxWidth: 70, isResizable: true,
      onRender: (item) => {
        return <Link href={item.GeneratedFileURL}>{t("General_Download")}</Link>
      }
    },
    {
      name: "Converted", minWidth: 50, maxWidth: 70, isResizable: true,
      onRender: (item) => {
        return <Link href={item.ConvertedFileURL}>{t("General_Download")}</Link>
      }
    },
    {
      name: "Noise", minWidth: 50, maxWidth: 70, isResizable: true,
      onRender: (item) => {
        return <Link href={item.NoiseFileURL}>{t("General_Download")}</Link>
      }
    }
  ]);

  

  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    created: [{ color: "yellow" }],
    failure: [{ color: "red" }],
  });

  useEffect(() => {
    if (
      audioGenerationJobs &&
      audioGenerationJobs.length > 0
    ) {
      const rawRows = audioGenerationJobs.map((obj, index) => ({
        ...obj,
        id: index,
      }));
      const processedRows = rawRows
        .sort(function (a, b) {
          return (
            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
          );
        });
      setRows(processedRows);
    }
  }, [audioGenerationJobs, setRows]);


  useEffect(() => {
    initializeScreen()
  }, []);

  useEffect(() => {
    initializeScreen()
  }, []);

  function initializeScreen() {
    getTableStorage("AudioGenerationJobs")
      .then((result) => {
        setAudioGenerationJobs(result.message);
      })
      .catch((error) => console.log(error));
  }

  return (
    <>
      <ActionButton
        iconProps={refreshIcon}
        text={t("General_Refresh")}
        onClick={() => initializeScreen()}
      />
      {rows !== undefined && rows.length > 0 && (
        <DetailsList
          columns={columns}
          items={rows}
          selectionMode={SelectionMode.none}
          onColumnHeaderClick={handleColumnClick}
          onRenderRow={onRenderRowRow}
        ></DetailsList>
      )}
    </>
  );
}
