import React, { useEffect, useState } from "react";
import {
  DetailsList,
  SelectionMode,
  PrimaryButton,
  DefaultButton,
  ActionButton,
  Stack,
  Modal,
  IconButton,
} from "@fluentui/react";
import { useBoolean } from '@uifabric/react-hooks';
import { modalStyles, modelIconButtonStyles, cancelIcon, editIcon, deleteIcon, stackTokens } from "../styles"

import { SettingManagementPath } from "../services/pathService";
import { Link } from "react-router-dom";
import * as SettingService from "../services/settingService";
import { onRenderRow } from "../Common/TableCommon";
import { t } from "i18next";


function getKey(item, index) {
  return item.key;
}

export default function SettingList(props) {


  const [filteredActions, setFilteredActions] = useState([]);
  const [actionList, setList] = useState([])

  useEffect(() => {
    setList(props.actionList);
  }, [props.actionList])

  //Modal related
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
    setModalText(`${item.setting} ${t("Settings_SettingsList_DeleteModalPrompt")}`);
    setModalItem(item);
    showModal();
  }

  const columns = [
    { fieldName: "setting", name: t("Settings_SettingsList_SettingFieldName"), minWidth: 50 },
    { fieldName: "actionName", name: t("Settings_SettingsList_ActionFieldName"), minWidth: 150 },
    { fieldName: "propertyName", name: t("Settings_SettingsList_PropertyFieldName"), minWidth: 150 },
    {
      fieldName: "edit", minWidth: 20, maxWidth: 20, onRender: (item) => {
        return (<Link to={`${SettingManagementPath.EditSetting}/${item.setting}/${item.key}`}><ActionButton iconProps={editIcon}></ActionButton></Link>)
      }
    },
    {
      fieldName: "delete", minWidth: 20, maxWidth: 20, onRender: (item) => {
        return (<ActionButton iconProps={deleteIcon} onClick={() => handleDeleteAction(item)}></ActionButton>)
      }
    },
  ];

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
          <span>{t("Settings_SettingsList_DeleteModalTitle")}</span>
          <IconButton
            styles={modelIconButtonStyles}
            iconProps={cancelIcon}
            onClick={hideModal}
          />
        </div>
        <div>
          <p className={modalStyles.body} dangerouslySetInnerHTML={{ __html: modalText }}>
          </p>
          <div>
            <Stack horizontal tokens={stackTokens} className={modalStyles.buttons}>
              <DefaultButton text={t("Settings_SettingsList_DeleteModalNo")} onClick={hideModal}></DefaultButton>
              <PrimaryButton text={t("Settings_SettingsList_DeleteModalYes")} onClick={handleModalYesButton}></PrimaryButton>
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

