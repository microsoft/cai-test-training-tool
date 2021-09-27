import SettingForm from "./SettingForm";
import * as SettingService from "../services/settingService";
import { classes } from "../styles";
import { useEffect, useState } from "react";

export default function AddNewSettingScreen() {

    const [actionProperties,setActionProperties] = useState(undefined)
    const [actions, setActions] = useState(undefined)
    

    useEffect(async () => {
        setActions(await SettingService.getAllActions());
        setActionProperties(await SettingService.getActionProperties())
    }, [])

    return(
        <div className={classes.root}>
        <h1>Neue Bot Management Tool Einstellung hinzufügen</h1>
        <SettingForm isEdit={false} actionProperties={actionProperties} actions={actions}></SettingForm>
        </div>
    )
}