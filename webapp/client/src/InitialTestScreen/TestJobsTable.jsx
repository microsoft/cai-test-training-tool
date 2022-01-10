import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";
import { getPath, TestPath } from "../services/pathService";
import {
  DetailsList,
  PrimaryButton,
  Icon,
  SelectionMode,
  DetailsRow,
  ActionButton
} from "@fluentui/react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { hasAccessRight } from "../services/accessService.js";
import { useTranslation } from 'react-i18next';

const moment = require("moment");

export default function TestTable({ knowledgeBases }) {
  const { t } = useTranslation();
  const history = useHistory();
  const [rows, setRows] = useState();
  const [jobs, setJobs] = useState([])
  const dateFormat = "DD.MM.YYYY HH:mm:ss";
  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    created: [{ color: "yellow" }],
    failure: [{ color: "red" }],
  });
  const [hasAccess, setHasAccess] = useState(false)

  const [columns, setColumns] = useState([
    { fieldName: "PartitionKey", name: "Job Id", minWidth: 50, maxWidth: 70, isResizable : true  },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_TestList_TimestampFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return moment(item.Timestamp).format(dateFormat);
      },
      isResizable : true
    },
    { fieldName: "kbId", name: "Knowledgebase", minWidth: 160, maxWidth: 170, isResizable : true },
    { fieldName: "environment", name: t("KnowledgeBase_TestList_EnvironmentFieldName"), minWidth: 70, maxWidth: 90, isResizable : true },
    {
      name: "Status",
      fieldName: "status",
      minWidth: 90,
      maxWidth: 120,
      isMultiline: true,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var text = t("KnowledgeBase_TestList_StatusFailed");
        if (item.status != undefined) {
          if (item.status.toString().includes("INPROGRESS")) {
            iconName = "WarningSolid";
            className = iconClassNames.created;
            text = t("KnowledgeBase_TestList_StatusInprogress");
          } else if (
            item.status.toString().includes("SUCCESSFUL") ||
            item.status.toString().includes("OK")
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
      isResizable : true
    },
    { fieldName: "testset", name: "Testset", minWidth: 150, maxWidth: 300, isResizable : true },
    { fieldName: "result", name: t("KnowledgeBase_TestList_ResultFieldName"), minWidth: 70, maxWidth: 70, isResizable : true },
    { fieldName: "username", name: t("KnowledgeBase_TestList_UsernameFieldName"), minWidth: 90, maxWidth: 300, isResizable : true },
    {
      minWidth: 180,
      maxWidth: 180,
      disableClickEventBubbling: false,
      isMultiline: false,
      onRender: (item) => {
        return (
          <PrimaryButton
            onClick={() => {
              history.push(
                getPath(TestPath.Results, { partitionKey: item.PartitionKey })
              );
            }}
          >
            <span fontSize="small">{t("KnowledgeBase_TestList_DetailsButtonLabel")}</span>
          </PrimaryButton>
        );
      },
      isResizable : true
    },
    {
      minWidth: 180,
      maxWidth: 180,
      disableClickEventBubbling: false,
      isMultiline: false,
      onRender: (item) => {
        return (
          <PrimaryButton
            disabled = {!item.hasRights}
            onClick={() => {
              deleteEntity("QnABatchTestJobs",item.PartitionKey,item.RowKey);
              initializeScreen();
            }}
          >
            <span fontSize="small">{t("KnowledgeBase_TestList_DeleteButtonLabel")}</span>
          </PrimaryButton>
        );
      },
      isResizable : true
    },
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

  const handleColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
    const newColumns: IColumn[] = columns.slice();
    const currColumn: IColumn = newColumns.filter(currCol => column.fieldName == currCol.fieldName)[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
        console.log(currColumn.fieldName);
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });
    const newRows = _copyAndSort(rows, currColumn.fieldName, currColumn.isSortedDescending);
    setColumns(newColumns);
    setRows(newRows)
  };
  const _copyAndSort = (rs: Array, key, isSortedDescending) => {
    return rs.slice(0).sort((a, b) => ((isSortedDescending ? a[key].toString().toLowerCase() < b[key].toString().toLowerCase() : a[key].toString().toLowerCase() > b[key].toString().toLowerCase()) ? 1 : -1));
  };
  
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

  const onRenderRow = props => {
    const customStyles = {};
    if (props) {
      customStyles.cell = { display: 'flex', alignItems: 'center' };


      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };

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
          onRenderRow={onRenderRow}
        ></DetailsList>
      )}
    </>
  );
}
