import React, { useEffect, useState } from "react";
import {
  DetailsList,
  mergeStyleSets,
  SelectionMode,
  Icon,
} from "@fluentui/react";
import { useTranslation } from 'react-i18next';

const moment = require("moment");

export default function ResultTable(props) {
  const { t } = useTranslation();
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();
  const dateFormat = "DD.MM.YYYY HH:mm:ss";
  const iconClassNames = mergeStyleSets({
    processing : [{color: "yellow"}],
    success: [{ color: "green" }],
    failure: [{ color: "red" }],
  });

  const [columns, setColumns] = useState([
    { fieldName: "PartitionKey", name: "Job Id", minWidth: 50, maxWidth: 90 },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_TestResult_TimestampFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return moment(item.Timestamp).format(dateFormat);
      },
    },
    {
      fieldName: "question",
      name: t("KnowledgeBase_TestResult_QuestionFieldName"),
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.question}</div>;
      },
    },
    {
      fieldName: "expectation",
      name: t("KnowledgeBase_TestResult_ExpectedAnswerFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.expectation}</div>;
      },
    },
    {
      fieldName: "resultUAT",
      name: t("KnowledgeBase_TestResult_ResultFieldName"),
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
          else if(item.resultUAT === "processing")
          {
            className = iconClassNames.success;
            message = "";
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
      fieldName: "answerUAT",
      name: t("KnowledgeBase_TestResult_AnswerFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return (
          <div
            className={
              item.answer === item.expectation
                ? "Table-cellSuccess"
                : "Table-cellWarning"
            }
          >
            {item.answer}
          </div>
        );
      },
    },
    {
      fieldName: "expectedId",
      name: "Erw. Id",
      minWidth: 80,
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
      name: "Erh. Id",
      minWidth: 80,
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
      fieldName: "expectedMetadata",
      name: "Erw. Metadaten",
      minWidth: 100,
      maxWidth: 120,
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
      name: "Erh. Metadaten",
      minWidth: 100,
      maxWidth: 120,
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
      fieldName: "expectedContext",
      name: "Erw. Kontext",
      minWidth: 100,
      maxWidth: 120,
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
      name: "Erh. Kontext",
      minWidth: 100,
      maxWidth: 120,
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
      fieldName: "expectedPrompts",
      name: "Erw. Prompts",
      minWidth: 100,
      maxWidth: 120,
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
      name: "Erh. Prompts",
      minWidth: 100,
      maxWidth: 120,
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
      fieldName: "scoreUAT",
      name: "Score",
      minWidth: 100,
      maxWidth: 120,
      onRender: (item) => {
        return (
          <div
            className={
              item.expectedScore <= item.scoreUAT
                ? "Table-cellSuccess"
                : "Table-cellError"
            }
          >
            {item.scoreUAT}
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
            Timestamp: row.Timestamp.split(".")[0].replace("T", " "),
            question: row.question,
            expectation: row.expectation,
            environment: row.env,
            answer: row.answerUAT,
            expectedScore: row.expectedScore,
            scoreUAT: row.scoreUAT,
            resultUAT:
              (String(row.expectedContext).trim().toLowerCase() == String(row.contextUAT).toLowerCase()) && (row.expectedMetadata == row.metadataUAT) && (row.expectedId == row.idUAT)
              && (row.expectedPrompts.toLowerCase() == row.promptsUAT.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scoreUAT)) ? "correct" : "incorrect",
            expectedContext: row.expectedContext,
            contextUAT: row.contextUAT,
            expectedId: row.expectedId,
            idUAT: row.idUAT,
            expectedMetadata: row.expectedMetadata,
            metadataUAT: row.metadataUAT,
            expectedPrompts: row.expectedPrompts,
            promptsUAT: row.promptsUAT,
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
      {rows !== undefined && rows.length > 0 && (
        <DetailsList
          columns={columns}
          items={rows}
          selectionMode={SelectionMode.none}
          onColumnHeaderClick={handleColumnClick}
        ></DetailsList>
      )}
    </>
  );
}
