import React, { useEffect, useState } from "react";
import {
  DetailsList,
  mergeStyleSets,
  SelectionMode,
  Icon,
} from "@fluentui/react";

const moment = require("moment");
const DATE_FORMAT = "DD.MM.YYYY HH:mm:ss";

export default function ResultTable(props) {
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();

  const iconClassNames = mergeStyleSets({
    success: [{ color: "green" }],
    failure: [{ color: "red" }],
  });

  const [columns, setColumns] = useState([
    { fieldName: "PartitionKey", name: "Job Id", minWidth: 70, maxWidth: 90 },
    {
      fieldName: "Timestamp",
      name: "Datum",
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return moment(item.Timestamp).format(DATE_FORMAT);
      },
    },
    {
      fieldName: "question",
      name: "Frage",
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.question}</div>;
      },
    },
    {
      fieldName: "expectation",
      name: "Erwartete Antwort",
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.expectation}</div>;
      },
    },
    {
      fieldName: "resultPRD",
      name: "Ergebnis PRD",
      minWidth: 100,
      maxWidth: 100,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var message = "Inkorrekt";
        if (item.resultPRD != undefined) {
          if (item.resultPRD === "correct") {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
            message = "Korrekt";
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {message}
            </span>
          );
        }
      },
    },
    {
      fieldName: "resultUAT",
      name: "Ergebnis UAT",
      minWidth: 100,
      maxWidth: 100,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var message = "Inkorrekt";
        if (item.resultUAT != undefined) {
          if (item.resultUAT === "correct") {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
            message = "Korrekt";
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {message}
            </span>
          );
        }
      },
    },
    {
      fieldName: "answerPRD",
      name: "Antwort PRD",
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return (
          <div
            className={
              item.answerPRD === item.expectation
                ? "Table-cellSuccess"
                : "Table-cellWarning"
            }
          >
            {item.answerPRD}
          </div>
        );
      },
    },
    {
      fieldName: "answerUAT",
      name: "Antwort UAT",
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return (
          <div
            className={
              item.answerUAT === item.expectation
                ? "Table-cellSuccess"
                : "Table-cellWarning"
            }
          >
            {item.answerUAT}
          </div>
        );
      },
    },
    {
      fieldName: "expectedId",
      name: "Erw. Id",
      minWidth: 40,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.idUAT == item.expectedId
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.expectedId}
          </div>
        );
      },
    },
    {
      fieldName: "idUAT",
      name: "Id UAT",
      minWidth: 40,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.idUAT == item.expectedId
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.idUAT}
          </div>
        );
      },
    },
    {
      fieldName: "idPRD",
      name: "idPRD",
      minWidth: 40,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.idPRD == item.expectedId
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.idPRD}
          </div>
        );
      },
    },
    {
      fieldName: "expectedMetadata",
      name: "Erw. Metadaten",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedMetadata == item.metadataUAT
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.expectedMetadata}
          </div>
        );
      },
    },
    {
      fieldName: "metadataUAT",
      name: "Metadaten UAT",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedMetadata == item.metadataUAT
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.metadataUAT}
          </div>
        );
      },
    },
    {
      fieldName: "metadataPRD",
      name: "metadataPRD",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedMetadata == item.metadataPRD
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.metadataPRD}
          </div>
        );
      },
    },
    {
      fieldName: "expectedContext",
      name: "Erw. Kontext",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedContext.toString().trim().toLowerCase() == item.contextUAT.toString().trim().toLowerCase()
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.expectedContext}
          </div>
        );
      },
    },
    {
      fieldName: "contextUAT",
      name: "Kontext UAT",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedContext.toString().trim().toLowerCase() == item.contextUAT.toString().trim().toLowerCase()
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.contextUAT.toString()}
          </div>
        );
      },
    },
    {
      fieldName: "contextPRD",
      name: "Kontext PRD",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedContext.toString().trim().toLowerCase() == item.contextPRD.toString().trim().toLowerCase()
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.contextPRD.toString()}
          </div>
        );
      },
    },
    {
      fieldName: "expectedPrompts",
      name: "Erw. Prompts",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedPrompts?.toLowerCase() == item.promptsUAT?.toLowerCase()
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.expectedPrompts}
          </div>
        );
      },
    },
    {
      fieldName: "promptsUAT",
      name: "Prompts UAT",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedPrompts?.toLowerCase() == item.promptsUAT?.toLowerCase()
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.promptsUAT}
          </div>
        );
      },
    },
    {
      fieldName: "promptsPRD",
      name: "Prompts PRD",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedPrompts == item.promptsPRD
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.promptsPRD}
          </div>
        );
      },
    },
    {
      fieldName: "scorePRD",
      name: "Score PRD",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedScore <= item.scorePRD
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.scorePRD}
          </div>
        );
      },
    },
    {
      fieldName: "scoreUAT",
      name: "Score UAT",
      minWidth: 80,
      maxWidth: 90,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedScore <= item.scoreUAT
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.promptsPRD}
          </div>
        );
      },
    },
    { fieldName: "expectedScore", name: "Min Score", minWidth: 120, maxWidth: 120 },
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
  useEffect(() => {
    setFilteredResults(props.results);
  }, [props.results]);

  useEffect(() => {
    if (filteredResults.length > 0) {
      const rawRows = filteredResults.map((obj, index) => ({
        ...obj,
        id: index,
      }));
      const processedRows = rawRows
        .map((row) => {
          return {
            id: row.id,
            PartitionKey: row.PartitionKey,
            Timestamp: row.Timestamp,
            question: row.question,
            expectation: row.expectation,
            answerPRD: row.answerPRD,
            answerUAT: row.answerUAT,
            scorePRD: row.scorePRD,
            scoreUAT: row.scoreUAT,
            expectedScore: row.expectedScore,
            resultPRD:
              (String(row.expectedContext).trim().toLowerCase() == String(row.contextPRD).trim().toLowerCase()) && (row.expectedMetadata == row.metadataPRD) && (row.expectedId == row.idPRD)
               && (row.expectedPrompts.toLowerCase() == row.promptsPRD.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scorePRD)) ? "correct" : "incorrect",
            resultUAT:
              (String(row.expectedContext).trim().toLowerCase() == String(row.contextUAT).trim().toLowerCase()) && (row.expectedMetadata == row.metadataUAT) && (row.expectedId == row.idUAT)
               && (row.expectedPrompts.toLowerCase() == row.promptsUAT.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scoreUAT)) ? "correct" : "incorrect",
            expectedContext: row.expectedContext,
            contextUAT: row.contextUAT,
            contextPRD: row.contextPRD,
            expectedId: row.expectedId,
            idUAT: row.idUAT,
            idPRD: row.idPRD,
            expectedMetadata: row.expectedMetadata,
            metadataUAT: row.metadataUAT,
            metadataPRD: row.metadataPRD,
            expectedPrompts: row.expectedPrompts,
            promptsUAT: row.promptsUAT,
            promptsPRD: row.promptsPRD,
          };
        })
        .sort(function (a, b) {
          return (
            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
          );
        });
      setRows(processedRows);
    }
  }, [filteredResults]);

  return (
    <>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flexGrow: 1 }}>
          {rows !== undefined && rows.length > 0 && (
            <DetailsList
              columns={columns}
              items={rows}
              selectionMode={SelectionMode.none}
              onColumnHeaderClick={handleColumnClick}
            ></DetailsList>
          )}
        </div>
      </div>
    </>
  );
}
