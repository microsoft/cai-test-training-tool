import React, { useEffect, useState } from "react";
import { DeployPath, getPath } from "../services/pathService";
import {
  DetailsList,
  Icon,
  Link,
  SelectionMode,
  ActionButton
} from "@fluentui/react";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";

import { useTranslation } from 'react-i18next';
import { handleColumnClick, onRenderRow, TableDateFormat, TableFieldSizes } from "../Common/TableCommon";
import { DeploymentStatus } from "../Common/StatusEnum";
import { deleteIcon, iconClassNames, refreshIcon } from "../styles";

const moment = require("moment");


export default function DeployJobsTable({ knowledgebases }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [deploymentJobs, setDeploymentJobs] = useState([]);


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
              deleteEntity("QnADeploymentJobs", item.PartitionKey, item.RowKey);
              initializeScreen();
            }}>
          </ActionButton >
        )
      }
    },
    {
      fieldName: "PartitionKey", name: t("KnowledgeBase_DeploymentList_JobIdFieldName"), minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: true,
      onRender: (item) => {
        return <Link href={getPath(DeployPath.Results, { partitionKey: item.PartitionKey })}>{item.PartitionKey}</Link>
      }
    },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_DeploymentList_TimestampFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      isResizable: true,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
    },
    { fieldName: "kbId", name: t("KnowledgeBase_DeploymentList_KnowledgeBaseFieldName"), minWidth: 160, maxWidth: 170, isResizable: true },
    {
      fieldName: "status",
      name: t("KnowledgeBase_DeploymentList_StatusFieldName"),
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      isResizable: true,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        if (item.status != undefined) {
          if (item.status.toString() === DeploymentStatus.PENDING_APPROVAL) {
            iconName = "WarningSolid";
            className = iconClassNames.created;
          } else if (item.status.toString() === DeploymentStatus.OK) {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {t(`KnowledgeBase_DeploymentList_StatusFieldName_${item.status}`)}
            </span>
          );
        }
      },
    },
    { fieldName: "testset", name: t("KnowledgeBase_DeploymentList_TestsetFieldName"), minWidth: 150, maxWidth: 300, isResizable: true },
    { fieldName: "result", name: t("KnowledgeBase_DeploymentList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable: true },
    { fieldName: "comment", name: t("KnowledgeBase_DeploymentList_CommentFieldName"), minWidth: 90, maxWidth: 200, isMultiline: true, isResizable: true },
    { fieldName: "username", name: t("KnowledgeBase_DeploymentList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable: true },
  ]);



  useEffect(() => {
    if (
      deploymentJobs &&
      knowledgebases &&
      deploymentJobs.length > 0 &&
      knowledgebases.length > 0
    ) {
      const rawRows = deploymentJobs.map((obj, index) => ({
        ...obj,
        id: index,
      }));
      const processedRows = rawRows
        .map((row) => {
          return {
            id: row.id,
            PartitionKey: row.PartitionKey,
            RowKey: row.RowKey,
            Timestamp: row.Timestamp,
            kbId: knowledgebases.find((kb) => kb.id === row.kbId)
              ? knowledgebases.find((kb) => kb.id === row.kbId).name
              : "",
            testset: row.testset,
            status: row.status,
            result: row.result,
            username: row.username,
            comment: row.comment
          };
        })
        .sort(function (a, b) {
          return (
            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
          );
        });
      setRows(processedRows);
    }
  }, [deploymentJobs, knowledgebases, setRows]);


  useEffect(() => {
    initializeScreen()
  }, []);


  function initializeScreen() {
    getTableStorage("QnADeploymentJobs")
      .then((result) => {
        setDeploymentJobs(result.message);
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
