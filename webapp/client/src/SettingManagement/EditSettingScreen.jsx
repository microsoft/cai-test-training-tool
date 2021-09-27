import SettingForm from "./SettingForm";
import { classes } from "../styles";


export default function EditSettingScreen() {

    return (
        <div className={classes.root}>
            <h1>Einstellung bearbeiten</h1>
            <SettingForm isEdit={true}></SettingForm>
        </div>

    )
}