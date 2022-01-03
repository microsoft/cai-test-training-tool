import React, { useEffect, useState } from "react";
import { DeployPath, getPath } from "../services/pathService";
import {
  DetailsList,
  Icon,
  Link,
  SelectionMode,
  DetailsRow,
  ActionButton
} from "@fluentui/react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";
import { hasAccessRight } from "../services/accessService.js";

import { useTranslation } from 'react-i18next';
import { deleteIcon, handleColumnClick, onRenderRow, refreshIcon, TableDateFormat, TableFieldSizes } from "../Common/TableCommon";

const moment = require("moment");


export default function DeployJobsTable({ knowledgebases }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [deploymentJobs, setDeploymentJobs] = useState([]);
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
              deleteEntity("QnADeploymentJobs", item.PartitionKey, item.RowKey);
              initializeScreen();
            }}>
          </ActionButton >
        )
      }
    },
    {
      fieldName: "PartitionKey", name: "Job Id", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: true,
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
    { fieldName: "kbId", name: "Knowledgebase", minWidth: 160, maxWidth: 170, isResizable: true },
    {
      fieldName: "status",
      name: "Status",
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      isResizable: true,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        if (item.status != undefined) {
          if (item.status.toString().toLowerCase().includes("warten auf genehmigung")) {
            iconName = "WarningSolid";
            className = iconClassNames.created;
          } else if (
            item.status.toString().toLowerCase().includes("erfolgreich")
          ) {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {item.status}
            </span>
          );
        }
      },
    },
    { fieldName: "testset", name: "Testset", minWidth: 150, maxWidth: 300, isResizable: true },
    { fieldName: "result", name: t("KnowledgeBase_DeploymentList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable: true },
    { fieldName: "comment", name: t("KnowledgeBase_DeploymentList_CommentFieldName"), minWidth: 90, maxWidth: 200, isMultiline: true, isResizable: true },
    { fieldName: "username", name: t("KnowledgeBase_DeploymentList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable: true },
  ]);

  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    created: [{ color: "yellow" }],
    failure: [{ color: "red" }],
  });

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
            comment: row.comment,
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
  }, [deploymentJobs, hasAccess, knowledgebases, setRows]);

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
    hasAccessRight("BMT_QNA_Deploy")
      .then((result) => {
        console.log(result.hasPermissions);
        setHasAccess(result.hasPermissions);
      })
      .catch((error) => console.log(error));
    console.log(hasAccess);
  };

  

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
