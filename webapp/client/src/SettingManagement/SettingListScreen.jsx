import React, { useEffect, useState } from "react";
import { mergeStyleSets } from 'office-ui-fabric-react';
import SettingList from "./SettingList";
import * as SettingService from "../services/settingService";
import { useTranslation } from 'react-i18next';


const classes = mergeStyleSets({
    root: {
        margin: "50px",
        paddingTop: "30px",
        textAlign: "left",
        width: "66%",
        height: "450px",
    },
    stack: {
        width: "200px"
    }
});

export default function SettingListScreen() {
    const [botOptions, setBotOptions] = useState([]);

    const [actionList, setActionList] = useState([])
    const [nameFilter, setNameFilter] = useState('*')

    const [loadingData, setLoadingData] = useState(true)
    const [hasAccess, setHasAccess] = useState(true)

    const { t } = useTranslation();

    useEffect(() => {
        SettingService.getAllActions()
            .then((result) => {
                setBotOptions([{ key: "*", text: "" }].concat(result.map(x => x.setting).filter((value, index, self) => self.indexOf(value) === index).map(x => new Object({ key: x, text: x }))));
                setActionList(result);
                setLoadingData(false);
            })
            .catch((error) => {
                console.log(error)
                if (error.response.status == 403) {
                    setLoadingData(false);
                    setHasAccess(false);
                }
            });
    }, []);


    return (
        <div className={classes.root}>
            <h1>Tool Settings</h1>

            {loadingData &&
                <h4 float="left">{t("General_LoadingData")}</h4>}
            {!loadingData && hasAccess &&
                <SettingList actionList={actionList} nameFilter={nameFilter}></SettingList>
            }
            {!loadingData && !hasAccess &&
                <h4 float="left">{t("General_NoAccess")}</h4>
            }
        </div>
    );
}