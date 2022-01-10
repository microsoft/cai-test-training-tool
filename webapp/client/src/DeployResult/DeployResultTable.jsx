import React, { useEffect, useState } from "react";
import {
  DetailsList,
  SelectionMode,
  Icon,
} from "@fluentui/react";
import { t } from "i18next";
import { handleColumnClick } from "../Common/TableCommon";
import { iconClassNames } from "../styles";

const moment = require("moment");

export default function ResultTable(props) {
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();

  const [columns] = useState([
    { fieldName: "PartitionKey", name: t("KnowledgeBase_DeploymentResult_JobIdFieldName"), minWidth: 70, maxWidth: 90 },
    {
      fieldName: "Timestamp",
      name: t("KnowledgeBase_DeploymentResult_TimestampFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return moment(item.Timestamp).format(DATE_FORMAT);
      },
    },
    {
      fieldName: "question",
      name: t("KnowledgeBase_DeploymentResult_QuestionFieldName"),
      minWidth: 150,
      maxWidth: 150,
      isMultiline: true,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.question}</div>;
      },
    },
    {
      fieldName: "expectation",
      name: t("KnowledgeBase_DeploymentResult_ExpectedAnswerFieldName"),
      minWidth: 120,
      maxWidth: 120,
      onRender: (item) => {
        return <div className={"Table-cell"}>{item.expectation}</div>;
      },
    },
    {
      fieldName: "resultPRD",
      name: t("KnowledgeBase_DeploymentResult_ResultPRDFieldName"),
      minWidth: 100,
      maxWidth: 100,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        if (item.resultUAT != undefined) {
          if (item.resultUAT === "OK") {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
          }
          else if(item.resultUAT === "INPROGRESS")
          {
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {t(`KnowledgeBase_DeploymentResult_ResultFieldName_${item.resultUAT}`)}
            </span>
          );
        }
      },
    },
    {
      fieldName: "resultUAT",
      name: t("KnowledgeBase_DeploymentResult_ResultUATFieldName"),
      minWidth: 100,
      maxWidth: 100,
      onRender: (item) => {
        var iconName = "WarningSolid";
        var className = iconClassNames.failure;
        if (item.resultUAT != undefined) {
          if (item.resultUAT === "OK") {
            iconName = "SkypeCircleCheck";
            className = iconClassNames.success;
          }
          else if(item.resultUAT === "INPROGRESS")
          {
            className = iconClassNames.success;
          }
          return (
            <span>
              <Icon iconName={iconName} className={className} /> {t(`KnowledgeBase_DeploymentResult_ResultFieldName_${item.resultUAT}`)}
            </span>
          );
        }
      },
    },
    {
      fieldName: "answerUAT",
      name: t("KnowledgeBase_DeploymentResult_ActualAnswerUATFieldName"),
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
      fieldName: "answerPRD",
      name: t("KnowledgeBase_DeploymentResult_ActualAnswerPRDFieldName"),
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
      fieldName: "expectedId",
      name: t("KnowledgeBase_DeploymentResult_ExpectedIdFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualIdUATFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualIdPRDFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ExpectedMetadataFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualMetadataUATFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualMetadataPRDFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ExpectedContextFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualContextUATFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualContextPRDFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ExpectedPromptsFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualPromptsUATFieldName"),
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
      name: t("KnowledgeBase_DeploymentResult_ActualPromptsPRDFieldName"),
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
    { fieldName: "expectedScore", name: t("KnowledgeBase_DeploymentResult_ExpectedScoreFieldName"), minWidth: 120, maxWidth: 120 },
    {
      fieldName: "scoreUAT",
      name:  t("KnowledgeBase_DeploymentResult_ActualScoreUATFieldName"),
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
    {
      fieldName: "scorePRD",
      name: t("KnowledgeBase_DeploymentResult_ActualScorePRDFieldName"),
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
               && (row.expectedPrompts.toLowerCase() == row.promptsPRD.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scorePRD)) ? "OK" : "FAILED",
            resultUAT:
              (String(row.expectedContext).trim().toLowerCase() == String(row.contextUAT).trim().toLowerCase()) && (row.expectedMetadata == row.metadataUAT) && (row.expectedId == row.idUAT)
               && (row.expectedPrompts.toLowerCase() == row.promptsUAT.toLowerCase()) && (parseInt(row.expectedScore) <= parseInt(row.scoreUAT)) ? "OK" : "FAILED",
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
