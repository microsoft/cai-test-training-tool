import React, { useEffect, useState } from "react";
import {
  DetailsList,
  ProgressIndicator,
  SelectionMode,
  ActionButton,
  Link
} from "@fluentui/react";
import { deleteEntity, getTableStorage } from "../services/tableStorageService.js";

import { useTranslation } from 'react-i18next';
import { BatchProcessingPath, getPath } from "../services/pathService.js";
import { handleColumnClick, onRenderRow, progressClass, TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";
import { BatchProcessingStatus } from "../Common/StatusEnum.jsx";
import {deleteIcon, refreshIcon} from "../styles"

const moment = require("moment");

export default function BatchProcessingTable() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [batchJobs, setBatchJobs] = useState([]);

  const [columns] = useState([
    {
      key: "Delete",
      name: "",
      minWidth: TableFieldSizes.DeleteFieldSize,
      maxWidth: TableFieldSizes.DeleteFieldSize,
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
      maxWidth: TableFieldSizes.DeleteFieldSize,
      isResizable: false,
      onRender: (item) => {
        if(item.Status === BatchProcessingStatus.FAILED) {
          return (
            <ActionButton iconProps={refreshIcon}
             allowDisabledFocus>
            </ActionButton>
          )
    }
      }
    },   
    { name: t("BatchProcessing_JobNameFieldName"), minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable : true,
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
          onRenderRow={onRenderRow}
        ></DetailsList>
      )}
    </>
  );
}
