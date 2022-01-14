import React, { useEffect, useState } from "react";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";
import { getPath, TestPath } from "../services/pathService";
import {
  DetailsList,
  Link,
  Icon,
  SelectionMode,
  ActionButton
} from "@fluentui/react";
import { useTranslation } from 'react-i18next';
import { handleColumnClick, onRenderRow,  TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";
import { deleteIcon, iconClassNames, refreshIcon } from "../styles.jsx";
import { TestStatus } from "../Common/StatusEnum.jsx";

const moment = require("moment");

export default function TestTable({ knowledgeBases }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState();
  const [jobs, setJobs] = useState([])

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
            onClick={() => {
              deleteEntity("QnABatchTestJobs", item.PartitionKey, item.RowKey);
              initializeScreen();
            }}>
          </ActionButton >
        )
      }
    },
    {
      fieldName: "PartitionKey", name: t("KnowledgeBase_TestList_JobIdFieldName"), minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: false,
      onRender: (item) => {
        return <Link href={getPath(TestPath.Results, { partitionKey: item.PartitionKey })}>{item.PartitionKey}</Link>
      }
    },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_TestList_TimestampFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
      isResizable: false
    },
    { fieldName: "kbId", name: t("KnowledgeBase_TestList_KnowledgeBaseFieldName"), minWidth: 160, maxWidth: 170, isResizable: false },
    { fieldName: "environment", name: t("KnowledgeBase_TestList_EnvironmentFieldName"), minWidth: 70, maxWidth: 90, isResizable: false },
    {
      name: t("KnowledgeBase_TestList_StatusFieldName"),
      fieldName: "status",
      minWidth: 90,
      maxWidth: 150,
      isMultiline: false,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var text = t("KnowledgeBase_TestList_StatusFailed");
        if (item.status != undefined) {
          if (item.status.toString() === TestStatus.IN_PROGRESS) {
            iconName = "WarningSolid";
            className = iconClassNames.created;
            text = t("KnowledgeBase_TestList_StatusInprogress");
          } else if (
            item.status.toString() === TestStatus.SUCCESSFUL ||
            item.status.toString() === TestStatus.OK
          ) {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
            text = t("KnowledgeBase_TestList_StatusSuccessful");
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {text}
            </span>
          );
        }
      },
      isResizable: false
    },
    { fieldName: "testset", name: t("KnowledgeBase_TestList_TestsetFieldName"), minWidth: 150, maxWidth: 300, isResizable: false },
    { fieldName: "result", name: t("KnowledgeBase_TestList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable: false },
    { fieldName: "username", name: t("KnowledgeBase_TestList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable: false },
  ]);

  useEffect(() => {
    initializeScreen()
  }, []);


  function initializeScreen() {
    getTableStorage("QnABatchTestJobs")
      .then((result) => {
        setJobs(result.message);
      })
      .catch((error) => console.log("error in table storage request", error));
  }

  useEffect(() => {
    console.log(jobs)
    console.log(knowledgeBases)
    if (
      jobs &&
      knowledgeBases &&
      jobs.length > 0 &&
      knowledgeBases.length > 0
    ) {
      const rawRows = jobs.map((obj, index) => ({ ...obj, id: index }));
      const processedRows = rawRows
        .map((row) => {
          return {
            id: row.id,
            PartitionKey: row.PartitionKey,
            RowKey: row.RowKey,
            Timestamp: row.Timestamp.split(".")[0].replace("T", " "),
            kbId: knowledgeBases.find((kb) => kb.id === row.kbId)
              ? knowledgeBases.find((kb) => kb.id === row.kbId).name
              : "",
            testset: row.testset,
            status: row.status,
            result: row.result,
            username: row.username,
            environment: row.environment
          };
        })
        .sort(function (a, b) {
          return (
            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
          );
        });
      setRows(processedRows);
    }
  }, [jobs, knowledgeBases]);

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
