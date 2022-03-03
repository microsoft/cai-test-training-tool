import React, { useEffect, useState } from "react";
import {
  DetailsList,
  ProgressIndicator,
  SelectionMode,
  ActionButton,
  Link
} from "@fluentui/react";
import { deleteEntity, deletePartition, getTableStorage } from "../services/tableStorageService.js";
import { deleteFilesInBlobFolder } from "../services/fileUploadService.js";

import { useTranslation } from 'react-i18next';
import { AudioGenerationPath, getPath } from "../services/pathService.js";
import { handleColumnClick, onRenderRow, progressClass, TableDateFormat, TableFieldSizes } from "../Common/TableCommon.jsx";
import { deleteIcon, refreshIcon } from "../styles.jsx";
import { ConfirmationModal } from "../Common/ConfirmationModal.jsx";
import { useBoolean } from '@uifabric/react-hooks';

const moment = require("moment");

export default function AudioGenerationTable() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [audioGenerationJobs, setAudioGenerationJobs] = useState([]);
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const [itemToDelete, setItemToDelete] = useState(undefined);



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
              setItemToDelete(item)
              showModal()
            }}
          >
          </ActionButton>
        )
      },
    },
    {
      name: "Job Name", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize, isResizable: false,
      onRender: (item) => {
        return <Link href={getPath(AudioGenerationPath.Results, { rowKey: item.RowKey })}>{item.JobName}</Link>
      }
    },
    {
      fieldName: "Timestamp",
      name: t("BatchProcessing_LastUpdateFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      isResizable: false,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
      },
    },
    {
      name: t("BatchProcessing_PercentageFieldName"),
      minWidth: 200,
      maxWidth: 130,
      isMultiline: false,
      onRender: (item) => {
        return (
          <ProgressIndicator className={progressClass} barHeight={4} label={item.CompletionPercentage} percentComplete={parseInt(item.CompletionPercentage.replace("%", "")) / 100} />
        );
      },
      isResizable: false
    },
    { fieldName: "Status", name: t("BatchProcessing_StatusFieldName"), minWidth: 70, maxWidth: 300, isResizable: false, isMultiline: false },
    {
      name: "Generated", minWidth: 70, maxWidth: 70, isResizable: false,
      onRender: (item) => {
        return <Link href={item.GeneratedFileURL}>{t("General_Download")}</Link>
      }
    },
    {
      name: "Converted", minWidth: 70, maxWidth: 70, isResizable: false,
      onRender: (item) => {
        return <Link href={item.ConvertedFileURL}>{t("General_Download")}</Link>
      }
    },
    {
      name: "Noise", minWidth: 70, maxWidth: 70, isResizable: false,
      onRender: (item) => {
        return <Link href={item.NoiseFileURL}>{t("General_Download")}</Link>
      }
    }
  ]);

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
        <>
          <ConfirmationModal
            isModalOpen={isModalOpen}
            modalTitle={t("AudioGeneration_ModalTitle")}
            modalText={`${t("AudioGeneration_ModalText")} \"${itemToDelete == undefined ? "" : itemToDelete.JobName ?? ""}\"?`}
            noHandle={() => hideModal()}
            yesHandle={(item) => {
              deleteEntity("AudioGenerationJobs", item.PartitionKey, item.RowKey)
              deletePartition("AudioGenerationJobDetails", item.RowKey)
              deleteFilesInBlobFolder("audiogeneration", item.RowKey)
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
