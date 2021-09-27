import React, { useEffect, useState } from "react";
import TestTable from "./TestJobsTable.jsx";
import getKnowledgeBases from "../services/knowledgeBaseService.js";
import { PrimaryButton, Stack } from "office-ui-fabric-react";
import { classes } from "./../styles";
import { TestPath } from "../services/pathService.js";
import { useTranslation } from 'react-i18next';

export default function InitialTestScreen() {
  const [knowdledgeBasesUAT, setKnowledgeBasesUAT] = useState([]);

  const [loadingData, setLoadingData] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)
  const { t } = useTranslation();

  useEffect(() => {
    getKnowledgeBases("UAT")
      .then((result) => {
        setKnowledgeBasesUAT(result.message.knowledgebases);
        setLoadingData(false);
      })
      .catch((error) => {
        console.log(error);
        if (error.response.status == 403) {
          setLoadingData(false);
          setHasAccess(false);
      }
      });
  }, []);


  const refreshIconProps = { iconName: 'Refresh' };

  return (
    <div className={classes.root}>
      <Stack className={classes.stack} gap={20}>
        <h3 float="left">{t("KnowledgeBase_Test_Title")}</h3>
        <PrimaryButton
          className={classes.button}
          text={t("KnowledgeBase_Test_NewTest_Button")}
          variant="contained"
          color="primary"
          href={TestPath.Start}
        />
        <div style={{ height: "640px" }}>
        {loadingData &&
                <h4 float="left">{t("General_LoadingData")}</h4>}
          {!loadingData && hasAccess &&
          <TestTable knowledgeBases={knowdledgeBasesUAT} />
        }
        {!loadingData && !hasAccess &&
            <h4 float="left">{t("General_NoAccess")}</h4>
        }
        </div>
      </Stack>
    </div>
  );
}
