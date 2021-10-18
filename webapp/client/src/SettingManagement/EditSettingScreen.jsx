import SettingForm from "./SettingForm";
import { classes } from "../styles";
import { useTranslation } from 'react-i18next';

export default function EditSettingScreen() {

    const { t } = useTranslation();

    return (
        <div className={classes.root}>
            <h1>{t("Settings_EditSettings_Title")}</h1>
            <SettingForm isEdit={true}></SettingForm>
        </div>

    )
}