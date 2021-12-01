import React, { useEffect, useState } from "react";
import {
  DetailsList,
  SelectionMode,
} from "@fluentui/react";

export default function AudioGenerationResultsTable(props) {
  const [filteredResults, setFilteredResults] = useState([]);
  const [rows, setRows] = useState();
  const [columns, setColumns] = useState(props.columns);

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
