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
import { BatchProcessingPath, getPath } from "../services/pathService.js";
import { deleteIcon, handleColumnClick, onRenderRow, progressClass, refreshIcon, TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";

const moment = require("moment");
const DATE_FORMAT = "DD.MM.YYYY HH:mm:ss";

export default function BatchProcessingTable() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [batchJobs, setBatchJobs] = useState([]);

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
                deleteEntity("BatchJobs",item.PartitionKey,item.RowKey)
                //TODO remove files
                initializeScreen()
              }}
             >
            </ActionButton>
        )
      },
    },
    {
      key: "Refresh",
      name: "",
      minWidth: TableFieldSizes.DeleteFieldSize,
      minWidth: TableFieldSizes.DeleteFieldSize,
      isResizable: false,
      onRender: (item) => {
        if(item.Status.includes("Error")) {
          return (
            <ActionButton iconProps={refreshIconProps}
             allowDisabledFocus>
            </ActionButton>
          )
    }
      }
    },   
    { name: "Job Name", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable : true,
      onRender: (item) => {
      return <Link href={getPath(BatchProcessingPath.Results,{rowKey: item.RowKey})}>{item.JobName}</Link>
    }},
    {
      fieldName: "Timestamp",
      name: t("BatchProcessing_LastUpdateFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      isResizable : true,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
    },
    { fieldName: "WER", name: "WER", minWidth: 100, maxWidth: 100, isResizable : true },
    { fieldName: "WRR", name: "WRR", minWidth: 100, maxWidth: 100, isResizable : true },
    { fieldName: "SER", name: "SER", minWidth: 100, maxWidth: 100, isResizable : true },
    { fieldName: "LPR", name: t("BatchProcessing_LPRAccuracyFieldName"), minWidth: 100, maxWidth: 100, isResizable : true },
    { fieldName: "Status", name: t("BatchProcessing_StatusFieldName"),minWidth: 90, maxWidth: 300, isResizable : true, isMultiline:false },
    {
      name: t("BatchProcessing_PercentageFieldName"),
      minWidth: 100,
      maxWidth: 130,
      isMultiline: false,
      onRender: (item) => {
        return (
          <ProgressIndicator className={progressClass} barHeight={4} label={item.CompletionPercentage} percentComplete={parseInt(item.CompletionPercentage.replace("%",""))/100} />
        );
      },
      isResizable : true
    }   
  ]);

  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    created: [{ color: "yellow" }],
    failure: [{ color: "red" }],
  });

  useEffect(() => {
    if (
      batchJobs &&
      batchJobs.length > 0
    ) {
      const rawRows = batchJobs.map((obj, index) => ({
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
  }, [batchJobs, setRows]);


  useEffect(() => {
    initializeScreen()
  }, []);

  useEffect(() => {
    initializeScreen()
  }, []);

  function initializeScreen() {
    getTableStorage("BatchJobs")
      .then((result) => {
        setBatchJobs(result.message);
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
          onRenderRow={onRenderRowderRow}
        ></DetailsList>
      )}
    </>
  );
}
