export const TableFieldSizes = {
    TimestampFieldSize : 120,
    JobIdFieldSize : 70,
    DeleteFieldSize : 70
}

export const TableDateFormat = "DD.MM.YYYY HH:mm:ss";


export function handleColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
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

  export const onRenderRow = props => {
    const customStyles = {};
    if (props) {
      customStyles.cell = { display: 'flex', alignItems: 'center' };


      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };


  export const refreshIcon = { iconName: 'Refresh' };
  export const deleteIcon = { iconName: 'Delete' };

  export const progressClass = { width: "100px" }