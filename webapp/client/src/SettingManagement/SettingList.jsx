import React, { useEffect, useState } from "react";
import {
  DetailsList,
  SelectionMode,
  PrimaryButton,
  DefaultButton,
  ActionButton,
  DetailsRow,
  Stack,
  Modal,
  IconButton,
} from "@fluentui/react";
import { useBoolean } from '@uifabric/react-hooks';
import { modalStyles, modelIconButtonStyles, cancelIcon, editIcon, deleteIcon, stackTokens } from "../styles"

import { SettingManagementPath } from "../services/pathService";
import { Link } from "react-router-dom";
import * as SettingService from "../services/settingService";
import { hasAccessRight } from "../services/accessService.js";


function getKey(item, index) {
  return item.key;
}

export default function SettingList(props) {


  const [filteredActions, setFilteredActions] = useState([]);
  const [actionList, setList] = useState([])
  const [hasAccess, setHasAccess] = useState(false)


  useEffect(() => {
    setList(props.actionList);
  }, [props.actionList])

  useEffect(() => {
    setUserAccess()
  }, []);

function setUserAccess() {
    hasAccessRight("BMT_BOT_CAM")
      .then((result) => {
        console.log(result.hasPermissions);
        setHasAccess(result.hasPermissions);
      })
      .catch((error) => console.log(error));
    console.log(hasAccess);
  };

  //Modal related
  let [modalTitle, setModalTitle] = useState('Löschen');
  let [modalText, setModalText] = useState('');
  const [modalItem, setModalItem] = useState(); 
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);

  const handleModalYesButton = async () => {
    var item = modalItem;
    await SettingService.deleteAction(item.setting, item.key);
    var changedList = actionList;
    var index = changedList.findIndex(x => x.setting == item.setting && x.key == item.key);
    changedList.splice(index, 1);
    setList(changedList);
    SetActionList();
    hideModal();
  };


  useEffect(() => {
    SetActionList();
  }, [actionList])

  useEffect(() => {
    SetActionList();
  }, [props.nameFilter])

  const handleDeleteAction = async (item) => {
    setModalText(`${item.setting} wirklich löschen?`);
    setModalItem(item);
    showModal();
  }

  const columns = [
    { fieldName: "setting", name: "Einstellung", minWidth: 50 },
    { fieldName: "actionName", name: "Aktion", minWidth: 150 },
    { fieldName: "propertyName", name: "Elemente", minWidth: 150 },
    {
      fieldName: "edit", minWidth: 20, maxWidth: 20, onRender: (item) => {
        return (<Link to={`${SettingManagementPath.EditSetting}/${item.setting}/${item.key}`}><ActionButton iconProps={editIcon}></ActionButton></Link>)
      }
    },
    {
      fieldName: "delete", minWidth: 20, maxWidth: 20, onRender: (item) => {
        return (<ActionButton iconProps={deleteIcon} disabled={!hasAccess} onClick={() => handleDeleteAction(item)}></ActionButton>)
      }
    },
  ];

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
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flexGrow: 1 }}>
          {props.actionList !== undefined && props.actionList.length > 0 && (
            <DetailsList
              columns={columns}
              items={filteredActions}
              selectionMode={SelectionMode.none}
              getKey={getKey}
              onRenderRow={onRenderRow}
            ></DetailsList>
          )}
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onDismiss={hideModal}
        containerClassName={modalStyles.container}
        isBlocking={true}
      >
        <div className={modalStyles.header}>
          <span>{modalTitle}</span>
          <IconButton
            styles={modelIconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={hideModal}
          />
        </div>
        <div>
          <p className={modalStyles.body} dangerouslySetInnerHTML={{ __html: modalText }}>
          </p>
          <div>
            <Stack horizontal tokens={stackTokens} className={modalStyles.buttons}>
              <DefaultButton text="Nein" onClick={hideModal}></DefaultButton>
              <PrimaryButton text="Ja" onClick={handleModalYesButton}></PrimaryButton>
            </Stack>
          </div>
        </div>
      </Modal>
    </>
  );

  function SetActionList() {
    setFilteredActions(actionList.filter((value, index, self) => {
      if (props.nameFilter === "*") {
        return true;

      }
      return value.setting === props.nameFilter;
    }));
  }



}

