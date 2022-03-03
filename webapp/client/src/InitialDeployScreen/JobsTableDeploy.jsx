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
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { useBoolean } from '@uifabric/react-hooks';

const moment = require("moment");


export default function DeployJobsTable({ knowledgebases }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [deploymentJobs, setDeploymentJobs] = useState([]);
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const [itemToDelete, setItemToDelete] = useState(undefined);


  const columns = [
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
              setItemToDelete(item)
              showModal()
            }}>
          </ActionButton >
        )
      }
    },
    {
      fieldName: "PartitionKey", name: t("KnowledgeBase_DeploymentList_JobIdFieldName"), minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: false,
      onRender: (item) => {
        return <Link href={getPath(DeployPath.Results, { partitionKey: item.PartitionKey })}>{item.PartitionKey}</Link>
      }
    },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_DeploymentList_TimestampFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      isResizable: false,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
    },
    { fieldName: "kbId", name: t("KnowledgeBase_DeploymentList_KnowledgeBaseFieldName"), minWidth: 160, maxWidth: 170, isResizable: false },
    {
      fieldName: "status",
      name: t("KnowledgeBase_DeploymentList_StatusFieldName"),
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      isResizable: false,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var text = t("KnowledgeBase_TestList_StatusFailed");
        if (item.status != undefined) {
          if (item.status.toString() === DeploymentStatus.IN_PROGRESS) {
            iconName = "WarningSolid";
            className = iconClassNames.created;
            text = t("KnowledgeBase_TestList_StatusInprogress");
          } else if (item.status.toString() === DeploymentStatus.SUCCESSFUL) {
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
    },
    { fieldName: "testset", name: t("KnowledgeBase_DeploymentList_TestsetFieldName"), minWidth: 150, maxWidth: 300, isResizable: false },
    { fieldName: "result", name: t("KnowledgeBase_DeploymentList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable: false },
    { fieldName: "comment", name: t("KnowledgeBase_DeploymentList_CommentFieldName"), minWidth: 90, maxWidth: 200, isMultiline: true, isResizable: false },
    { fieldName: "username", name: t("KnowledgeBase_DeploymentList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable: false },
  ];



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
        <>
          <ConfirmationModal
            isModalOpen={isModalOpen}
            modalTitle={t("KnowledgeBase_DeploymentList_ModalTitle")}
            modalText={`${t("KnowledgeBase_DeploymentList_ModalText")} \"${itemToDelete == undefined ? "" : itemToDelete.PartitionKey ?? ""}\"?`}
            noHandle={() => hideModal()}
            yesHandle={(item) => {
              deleteEntity("QnADeploymentJobs", item.PartitionKey, item.RowKey);
              hideModal()
              initializeScreen()
            }}
            selectedItem={itemToDelete}
          >
          </ConfirmationModal>
          <DetailsList
            columns={columns}
            items={rows}
            selectionMode={SelectionMode.none}
            onColumnHeaderClick={handleColumnClick}
            onRenderRow={onRenderRow}
          ></DetailsList>
        </>
      )}
    </>
  );
}
