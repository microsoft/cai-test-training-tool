import React, { useEffect, useState } from "react";
import { DeployPath, getPath } from "../services/pathService";
import { useHistory } from "react-router-dom";
import {
  DetailsList,
  Icon,
  PrimaryButton,
  SelectionMode,
  DetailsRow,
  ActionButton
} from "@fluentui/react";
import { mergeStyleSets } from "office-ui-fabric-react/lib/Styling";
import { getTableStorage, deleteEntity } from "../services/tableStorageService.js";
import { hasAccessRight } from "../services/accessService.js";

const moment = require("moment");
const DATE_FORMAT = "DD.MM.YYYY HH:mm:ss";

export default function DeployJobsTable({ knowledgebases }) {
  const history = useHistory();

  const [rows, setRows] = useState([]);
  const [deploymentJobs, setDeploymentJobs] = useState([]);
  const [hasAccess, setHasAccess] = useState(false)

  const [columns, setColumns] = useState([
    { fieldName: "PartitionKey", name: "Job Id", minWidth: 50, maxWidth: 70, isResizable : true },
    {
      fieldName: "Timestamp",
      name: "Datum",
      minWidth: 120,
      maxWidth: 120,
      isResizable : true,
      onRender: (item) => {
        return moment(item.Timestamp).format(DATE_FORMAT);
      },
    },
    { fieldName: "kbId", name: "Knowledgebase", minWidth: 160, maxWidth: 170, isResizable : true },
    {
      fieldName: "status",
      name: "Status",
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      isResizable : true,
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
    { fieldName: "testset", name: "Testset", minWidth: 150, maxWidth: 300, isResizable : true },
    { fieldName: "result", name: "Ergebnis", minWidth: 70, maxWidth: 70, isResizable : true },
    { fieldName: "comment", name: "Kommentar", minWidth: 90, maxWidth: 200, isMultiline: true, isResizable : true },
    { fieldName: "username", name: "Benutzer",minWidth: 90, maxWidth: 300, isResizable : true },
    {
      name: "",
      minWidth: 100,
      maxWidth: 130,
      isMultiline: false,
      onRender: (item) => {
        return (
          <PrimaryButton
            onClick={() => {
              history.push(
                getPath(DeployPath.Results, { partitionKey: item.PartitionKey })
              );
            }}
          >
            <span fontSize="small"> Detailansicht</span>
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
              deleteEntity("QnADeploymentJobs",item.PartitionKey,item.RowKey);
              initializeScreen();
            }}
          >
            <span fontSize="small">Löschen</span>
          </PrimaryButton>
        );
      },
      isResizable : true
    },
  ]);

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

  const onRenderRow = props => {
    const customStyles = {};
    if (props) {
      customStyles.cell = { display: 'flex', alignItems: 'center' };


      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };

  function initializeScreen() {
    getTableStorage("QnADeploymentJobs")
      .then((result) => {
        setDeploymentJobs(result.message);
      })
      .catch((error) => console.log(error));
  }

  const refreshIconProps = { iconName: 'Refresh' };


  return (
    <>
     <ActionButton
            iconProps={refreshIconProps}
            text="Aktualisieren"
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
