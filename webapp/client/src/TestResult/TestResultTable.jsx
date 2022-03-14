import React, { useEffect, useState } from "react";
import {
  DetailsList,
  mergeStyleSets,
  SelectionMode,
  Icon,
} from "@fluentui/react";
import { useTranslation } from 'react-i18next';
import { handleColumnClick, TableDateFormat, TableFieldSizes } from "../Common/TableCommon";
import { iconClassNames } from "../styles";

const moment = require("moment");

export default function ResultTable(props) {
  const { t } = useTranslation();
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();

  const [columns, setColumns] = useState([
    { fieldName: "PartitionKey", name: "Job Id", minWidth: TableFieldSizes.JobIdFieldSize, maxWidth: TableFieldSizes.JobIdFieldSize },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_TestResult_TimestampFieldName"),
      minWidth: TableFieldSizes.TimestampFieldSize,
      maxWidth: TableFieldSizes.TimestampFieldSize,
      onRender: (item) => {
        return moment(item.Timestamp).format(TableDateFormat);
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
      fieldName: "answerUAT",
      name: t("KnowledgeBase_TestResult_ActualAnswerFieldName"),
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
      fieldName: "resultUAT",
      name: t("KnowledgeBase_TestList_ResultFieldName"),
      minWidth: 100,
      maxWidth: 100,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        var message = t("KnowledgeBase_TestResult_ResultFieldName_FAILED");
        if (item.resultUAT != undefined) {
          if (item.resultUAT === "CORRECT") {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
            message = t("KnowledgeBase_TestResult_ResultFieldName_CORRECT");
          }
          else if(item.resultUAT === "INPROGRESS")
          {
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {t(`KnowledgeBase_TestList_ResultFieldName_${item.resultUAT}`)}
            </span>
          );
        }
      },
    },
    {
      fieldName: "expectedId",
      name: t('KnowledgeBase_TestResult_ExpectedIdFieldName') ,
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
      name: t('KnowledgeBase_TestResult_ActualId'),
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
      name: t("KnowledgeBase_TestResult_ExpectedMetadataFieldName"),
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
      name: t("KnowledgeBase_TestResult_ActualMetadataFieldName"),
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
      name: t("KnowledgeBase_TestResult_ExpectedContextFieldName"),
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
      name: t("KnowledgeBase_TestResult_ActualContextFieldName"),
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
      name: t("KnowledgeBase_TestResult_ExpectedPromptsFieldName"),
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
      name: t("KnowledgeBase_TestResult_ActualPromptsFieldName"),
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
    { fieldName: "expectedScore", name: t("Min Score"), minWidth: 120, maxWidth: 120 },
    {
      fieldName: "scoreUAT",
      name: t("KnowledgeBase_TestResult_ActualScoreFieldName"),
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
  ]);

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
              && (row.expectedPrompts.toLowerCase() == row.promptsUAT.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scoreUAT)) ? "CORRECT" : "INCORRECT",
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
