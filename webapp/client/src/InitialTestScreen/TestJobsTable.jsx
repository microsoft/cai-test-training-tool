import React, { useEffect, useState } from "react";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";
import { getPath, TestPath } from "../services/pathService";
import {
  DetailsList,
  Link,
  Icon,
  SelectionMode,
  DetailsRow,
  ActionButton
} from "@fluentui/react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { hasAccessRight } from "../services/accessService.js";
import { useTranslation } from 'react-i18next';
import { deleteIcon, handleColumnClick, onRenderRow, TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";

const moment = require("moment");

export default function TestTable({ knowledgeBases }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState();
  const [jobs, setJobs] = useState([])
  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    created: [{ color: "yellow" }],
    failure: [{ color: "red" }],
  });
  const [hasAccess, setHasAccess] = useState(false)

  const [columns, setColumns] = useState([
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
      fieldName: "PartitionKey", name: "Job Id", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: true,
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
      isResizable: true
    },
    { fieldName: "kbId", name: "Knowledgebase", minWidth: 160, maxWidth: 170, isResizable: true },
    { fieldName: "environment", name: t("KnowledgeBase_TestList_EnvironmentFieldName"), minWidth: 70, maxWidth: 90, isResizable: true },
    {
      name: "Status",
      fieldName: "status",
      minWidth: 90,
      maxWidth: 150,
      isMultiline: false,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        if (item.status != undefined) {
          if (item.status.toString() === "INPROGRESS") {
            iconName = "WarningSolid";
            className = iconClassNames.created;
          } else if (
            item.status.toString().toLowerCase().includes("OK")
          ) {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {t(`KnowledgeBase_TestList_StatusFieldName_${item.status}`)}
            </span>
          );
        }
      },
      isResizable: true
    },
    { fieldName: "testset", name: "Testset", minWidth: 150, maxWidth: 300, isResizable: true },
    { fieldName: "result", name: t("KnowledgeBase_TestList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable: true },
    { fieldName: "username", name: t("KnowledgeBase_TestList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable: true },
  ]);

  useEffect(() => {
    setUserAccess()
  }, []);

  useEffect(() => {
    initializeScreen()
  }, []);

  useEffect(() => {
    initializeScreen()
  }, [hasAccess]);

  function setUserAccess() {
    hasAccessRight("BMT_QNA_Tester")
      .then((result) => {
        console.log(result.hasPermissions);
        setHasAccess(result.hasPermissions);
      })
      .catch((error) => console.log(error));
    console.log(hasAccess);
  };

  function initializeScreen() {
    getTableStorage("QnABatchTestJobs")
      .then((result) => {
        setJobs(result.message);
      })
      .catch((error) => console.log("error in table storage request", error));
  }

  const refreshIconProps = { iconName: 'Refresh' };

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
            environment: row.environment,
            hasRights: hasAccess,
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
        iconProps={refreshIconProps}
        text={t("General_Refresh")}
        onClick={() => initializeScreen()}
      />
      {rows !== undefined && rows.length > 0 && (
        <DetailsList
          columns={columns}
          items={rows}
          selectionMode={SelectionMode.none}
          onColumnHeaderClick={handleColumnClick}
          onRenderRow={onRenderRowrRow}
        ></DetailsList>
      )}
    </>
  );
}
