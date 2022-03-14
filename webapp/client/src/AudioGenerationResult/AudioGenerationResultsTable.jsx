import React, { useEffect, useState } from "react";
import {
  DetailsList,
  SelectionMode,
} from "@fluentui/react";
import { handleColumnClick } from "../Common/TableCommon";

export default function AudioGenerationResultsTable(props) {
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();
  const columns = props.columns;

  
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
