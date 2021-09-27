import {
  ActionButton,
  DefaultButton,
  DetailsList,
  Icon,
  PrimaryButton,
  SelectionMode,
  Stack,
  TextField,
  Dropdown,
  DetailsListLayoutMode,
  mergeStyleSets,
  MessageBar,
  MessageBarType,
} from "office-ui-fabric-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { SettingManagementPath } from "../services/pathService";
import * as SettingService from "../services/settingService";
import { DetailsRow } from "@fluentui/react";
import { hasAccessRight } from "../services/accessService.js";

export default function SettingForm(props) {
  const isEdit = props.isEdit;
  const { partitionKey, rowKey } = useParams();

  const [settingOptions, setSettingOptions] = useState([" "]);
  const [action, setAction] = useState(
    !isEdit
      ? new Object({
          setting: "",
          key: "",
          actionName: "",
          propertyName: "",
          options: new Array(),
          default: undefined,
          values: new Object({
            dev: new Array(),
            uat: new Array(),
            prd: new Array(),
          }),
        })
      : undefined
  );

  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionDev, setNewOptionDev] = useState("");
  const [newOptionUat, setNewOptionUat] = useState("");
  const [newOptionProd, setNewOptionProd] = useState("");
  const [actionName, setActionName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [defaultValue, setDefaultValue] = useState(undefined);
  const [setting, setBotName] = useState(
    partitionKey != undefined ? partitionKey : ""
  );
  const [settingOptionsSetting, setBotNameOptionsSetting] = useState([]);
  const [actionNameOptionsSetting, setActionNameOptionsSetting] = useState([]);
  const [propertyNameOptionsSetting, setPropertyNameOptionsSetting] = useState(
    []
  );
  const [canAddAction, setCanAddAction] = useState(true);
  const [duplicateActionName, setDuplicateAdtionName] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedAction, setLoadedAction] = useState(undefined);
  const [hasAccess, setHasAccess] = useState(false);

  const handleNewOptionName = useCallback((ev) => {
    setNewOptionName(ev.target.value);
  }, []);

  const handleNewOptionDev = useCallback((ev) => {
    setNewOptionDev(ev.target.value);
  }, []);

  const handleNewOptionUat = useCallback((ev) => {
    setNewOptionUat(ev.target.value);
  }, []);

  const handleNewOptionProd = useCallback((ev) => {
    setNewOptionProd(ev.target.value);
  }, []);

  const handleNewBotName = useCallback((ev, value) => {
    if (value != undefined) {
      setBotName(value.key);
      var changedAction = action;
      changedAction.setting = value.key;
      setAction(changedAction);
    }
  }, []);

  const handleNewPropertyName = useCallback((ev, value) => {
    if (value != undefined) {
      setPropertyName(value.key);
      var changedAction = action;
      changedAction.propertyName = value.key;
      changedAction.key = `${changedAction.actionName}_${changedAction.propertyName}`;
      setAction(changedAction);
    }
  }, []);

  const handleNewActionName = useCallback((ev, value) => {
    if (value != undefined) {
      setActionName(value.key);
      var changedAction = action;
      changedAction.actionName = value.key;
      changedAction.key = `${changedAction.actionName}_${value.key}`;
      setAction(changedAction);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(action);
    var changedAction = action;
    changedAction.options.push(newOptionName);
    changedAction.values.dev.push(newOptionDev);
    changedAction.values.uat.push(newOptionUat);
    changedAction.values.prd.push(newOptionProd);
    if (action.default == undefined) {
      changedAction.default = newOptionName;
      setDefaultValue(newOptionName);
    }
    setAction(changedAction);
    setNewOptions();
    setNewOptionName("");
    setNewOptionDev("");
    setNewOptionUat("");
    setNewOptionProd("");
  };

  const handleDefaultChange = (env, value) => {
    var changedAction = action;
    changedAction.default = value.text;
    setAction(changedAction);
    setDefaultValue(value.text);
  };

  useEffect(async () => {
    if (isEdit) {
      setLoadedAction(await SettingService.getActionById(partitionKey, rowKey));
    }
  }, []);

  useEffect(() => {
    setUserAccess();
  }, []);

  function setUserAccess() {
    hasAccessRight("BMT_BOT_CAM")
      .then((result) => {
        console.log(result.hasPermissions);
        setHasAccess(result.hasPermissions);
      })
      .catch((error) => console.log(error));
    console.log(hasAccess);
  }

  useEffect(() => {
    if (!isEdit) {
      var changedAction = action;
      changedAction.options = new Array();
      setAction(changedAction);
      setNewOptions();
    }
  }, [setting, actionName, propertyName]);

  useEffect(() => {
    var actionProperties = props.actionProperties;
    console.log(`Action properties ${JSON.stringify(actionProperties)}`);
    if (actionProperties != undefined) {
      if (actionProperties.setting != undefined) {
        var settingOptionsArray = new Array();
        actionProperties.setting.forEach((element) => {
          settingOptionsArray.push(new Object({ key: element, text: element }));
        });
        console.log(settingOptionsArray);
        setBotNameOptionsSetting(settingOptionsArray);
        handleNewBotName(null, settingOptionsArray[0]);
      }
    }
  }, [props.actionProperties]);

  useEffect(() => {
    if (
      !isEdit &&
      setting != undefined &&
      props.actionProperties != undefined &&
      props.actionProperties.actionName != undefined
    ) {
      var actionProperties = props.actionProperties.actionName;
      var actionArray = new Array();
      var actionsForBot = props.actions.filter((x) => x.setting == setting);
      actionProperties.forEach((element) => {
        if (!actionsForBot.map((x) => x.actionName).includes(element.name)) {
          actionArray.push(
            new Object({ key: element.name, text: element.name })
          );
        }
      });
      setActionNameOptionsSetting(actionArray);
      handleNewActionName(null, actionArray[0]);
    }
  }, [setting]);

  useEffect(() => {
    if (
      !isEdit &&
      actionName != undefined &&
      props.actionProperties != undefined
    ) {
      var actionProperties = props.actionProperties.actionName.find(
        (x) => x.name == actionName
      );
      var propertyArray = new Array();
      var actionsForBot = props.actions.filter((x) => x.setting == setting);
      actionProperties.properties.forEach((element) => {
        if (!actionsForBot.map((x) => x.propertyName).includes(element)) {
          propertyArray.push(new Object({ key: element, text: element }));
        }
      });
      setPropertyNameOptionsSetting(propertyArray);
      handleNewPropertyName(null, propertyArray[0]);
    }
  }, [actionName]);

  useEffect(() => {
    if (loadedAction != undefined) {
      setAction(loadedAction);
      setActionName(loadedAction.actionName);
      setPropertyName(loadedAction.propertyName);
      setDefaultValue(loadedAction.default);
    }
  }, [loadedAction]);

  useEffect(() => {
    var newCanAddAction = true;
    if (newOptionName == undefined || newOptionName == "") {
      newCanAddAction = false;
    }

    if (action != undefined) {
      if (action.options != undefined) {
        if (action.options.includes(newOptionName)) {
          newCanAddAction = false;
        }
      }
    }

    setCanAddAction(newCanAddAction);
  }, [newOptionName]);

  useEffect(() => {
    var newDuplicateActionName = false;
    if (action != undefined) {
      if (action.options != undefined) {
        if (action.options.includes(newOptionName)) {
          newDuplicateActionName = true;
        }
      }
    }

    setDuplicateAdtionName(newDuplicateActionName);
  }, [newOptionName]);

  useEffect(() => {
    setNewOptions();
  }, [action]);

  const handleDeleteOption = (item) => {
    console.log(action.options);
    console.log(JSON.stringify(item));
    var index = action.options.findIndex((x) => x == item.optionName);

    console.log(index);

    let changedAction = action;
    changedAction.options.splice(index, 1);
    changedAction.values.dev.splice(index, 1);
    changedAction.values.uat.splice(index, 1);
    changedAction.values.prd.splice(index, 1);
    if (item.optionName == action.default) {
      changedAction.default = undefined;
    }

    setAction(changedAction);
    setNewOptions();
  };

  const handleEditOption = (optionName, env, value) => {
    var index = action.options.findIndex((x) => x == optionName);

    console.log(index);

    let changedAction = action;
    changedAction.values[env][index] = value;

    setAction(changedAction);
    setNewOptions();
  };

  const handleConfirmation = async (event) => {
    resetStatusMessages();
    let result;
    if (isEdit) {
      result = await SettingService.updateAction(action).catch(function (
        error
      ) {
        console.log(error);
        return error.response;
      });
    } else {
      result = await SettingService.createNewAction(action).catch(function (
        error
      ) {
        console.log(error);
        return error.response;
      });
    }

    if (result.status == 409) {
      setErrorMessage(
        "Someone else changed the options. The screen was reloaded to show the latest options"
      );
      setLoadedAction(
        await SettingService.getActionById(action.setting, action.key)
      );
    } else {
      window.location = SettingManagementPath.InitialScreen;
    }
  };

  const deleteIcon = { iconName: "Delete" };
  const saveItem = { iconName: "save" };

  const columns = [
    { fieldName: "optionName", name: "Elemente", minWidth: 70 },
    {
      fieldName: "devValue",
      name: "Dev",
      minWidth: 150,
      onRender: (item) => {
        return (
          <TextField
            underlined
            value={item.devValue}
            onChange={(ev) =>
              handleEditOption(item.optionName, "dev", ev.target.value)
            }
          ></TextField>
        );
      },
    },
    {
      fieldName: "uatValue",
      name: "Uat",
      minWidth: 150,
      onRender: (item) => {
        return (
          <TextField
            underlined
            value={item.uatValue}
            onChange={(ev) =>
              handleEditOption(item.optionName, "uat", ev.target.value)
            }
          ></TextField>
        );
      },
    },
    {
      fieldName: "prdValue",
      name: "Prod",
      minWidth: 250,
      onRender: (item) => {
        return (
          <TextField
            underlined
            value={item.prdValue}
            onChange={(ev) =>
              handleEditOption(item.optionName, "prd", ev.target.value)
            }
          ></TextField>
        );
      },
    },
    {
      fieldName: "delete",
      minWidth: 20,
      maxWidth: 20,
      onRender: (item) => {
        return (
          <ActionButton
            iconProps={deleteIcon}
            disabled={!hasAccess ? "true" : ""}
            onClick={() => handleDeleteOption(item)}
          ></ActionButton>
        );
      },
    },
  ];

  const classes = mergeStyleSets({
    stack: {
      width: "600px",
    },
    buttons: {
      marginTop: "20px",
      float: "right",
    },
    textFields: {
      width: "200px",
    },
  });

  const onRenderRow = (props) => {
    const customStyles = {};
    if (props) {
      customStyles.cell = { display: "flex", alignItems: "center" };

      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  };

  const resetStatusMessages = () => {
    setErrorMessage("");
  };

  return (
    <div>
      <div>
        {errorMessage.length > 0 && errorMessage != "" && (
          <MessageBar
            isMultiline={false}
            messageBarType={MessageBarType.error}
            onDismiss={resetStatusMessages}
          >
            {errorMessage}
          </MessageBar>
        )}
        <Stack className={classes.stack} gap={20} horizontal>
          {isEdit && (
            <>
              <TextField
                className={classes.textFields}
                label="Einstellung"
                disabled={isEdit}
                value={setting}
              ></TextField>
              <TextField
                className={classes.textFields}
                label="Aktion"
                disabled={isEdit}
                value={actionName}
              ></TextField>
              <TextField
                className={classes.textFields}
                label="Dropdown Feld"
                disabled={isEdit}
                value={propertyName}
              ></TextField>
            </>
          )}
          {!isEdit && (
            <>
              <Dropdown
                className={classes.textFields}
                label="Einstellung"
                onChange={handleNewBotName}
                defaultSelectedKey={settingOptionsSetting[0]?.key}
                options={settingOptionsSetting}
              ></Dropdown>
              <Dropdown
                className={classes.textFields}
                label="Aktion"
                onChange={handleNewActionName}
                defaultSelectedKey={actionNameOptionsSetting[0]?.key}
                options={actionNameOptionsSetting}
              ></Dropdown>
              <Dropdown
                className={classes.textFields}
                label="Setting Feld"
                onChange={handleNewPropertyName}
                defaultSelectedKey={propertyNameOptionsSetting[0]?.key}
                options={propertyNameOptionsSetting}
              ></Dropdown>
            </>
          )}
        </Stack>

        <h2>Optionen</h2>
        <DetailsList
          columns={columns}
          items={settingOptions}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          onRenderRow={onRenderRow}
        ></DetailsList>
        <h3>Neues Element hinzufügen</h3>
        <form>
          <Stack horizontal={true} gap={10}>
            <TextField
              label="Element:"
              underlined={true}
              required={true}
              onChange={handleNewOptionName}
              value={newOptionName}
              errorMessage={
                duplicateActionName ? "This option already exists" : undefined
              }
            ></TextField>
            <TextField
              label="Dev:"
              underlined={true}
              required={true}
              onChange={handleNewOptionDev}
              value={newOptionDev}
            ></TextField>
            <TextField
              label="Uat:"
              underlined={true}
              required={true}
              onChange={handleNewOptionUat}
              value={newOptionUat}
            ></TextField>
            <TextField
              label="Prod:"
              underlined={true}
              required={true}
              onChange={handleNewOptionProd}
              value={newOptionProd}
            ></TextField>
            <ActionButton
              iconProps={saveItem}
              disabled={!canAddAction || !hasAccess}
              onClick={handleSubmit}
            ></ActionButton>
          </Stack>

          <Dropdown
            label="Standardauswahl"
            options={defaultOptions}
            onChange={handleDefaultChange}
            defaultSelectedKey={defaultValue}
            required={true}
          ></Dropdown>

          <Stack gap={20} horizontal className={classes.buttons}>
            <Link to={SettingManagementPath.InitialScreen}>
              <DefaultButton text="Abbrechen"></DefaultButton>
            </Link>
            <PrimaryButton
              disabled={
                action == undefined ||
                action.options.length < 1 ||
                action.default == undefined ||
                !hasAccess
              }
              text="Speichern"
              onClick={handleConfirmation}
            ></PrimaryButton>
          </Stack>
        </form>
      </div>
      <span style={{ verticalAlign: '-30px' , color: 'red'}}>
        {hasAccess ? "" : "Fehlende Rechte, um Einstellungen zu verändern."}
      </span>
    </div>
  );

  function setNewOptions() {
    let options = new Array();
    let defaultOptions = new Array();
    if (action != undefined) {
      for (let i = 0; i < action.options.length; i++) {
        const option = action.options[i];
        defaultOptions.push(new Object({ key: option, text: option }));
        options.push(
          new Object({
            optionName: option,
            devValue: action.values.dev[i],
            uatValue: action.values.uat[i],
            prdValue: action.values.prd[i],
          })
        );
      }
    }
    setSettingOptions((opt) => options);
    setDefaultOptions(defaultOptions);
  }
}
