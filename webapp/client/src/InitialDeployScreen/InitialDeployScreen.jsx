import React, { useEffect, useState } from "react";
import DeployJobsTable from "./JobsTableDeploy.jsx";

import getKnowledgeBases from "../services/knowledgeBaseService.js";
import { Stack, PrimaryButton } from "office-ui-fabric-react";
import { classes } from "./../styles"
import { DeployPath } from "../services/pathService.js";

import { useTranslation } from 'react-i18next';


export default function StartDeploy() {
  const [knowdledgeBases, setKnowledgeBases] = useState([]);

  const [loadingData, setLoadingData] = useState(true)

  const { t } = useTranslation();

  useEffect(() => {
    getKnowledgeBases(0)
      .then((result) => {
        setKnowledgeBases(result.message.knowledgebases)
        setLoadingData(false);
      })
      .catch((error) => {
        if (error.response.status == 403) {
          setLoadingData(false);
        }
        console.log(error)
      });
  }, []);

  return (
    <div className={classes.root}>
      <Stack className={classes.stack} gap={20}>
        <h3 float="left">{t("KnowledgeBaseDeployment_Title")}</h3>
        <PrimaryButton
          variant="contained"
          color="primary"
          href={DeployPath.Start}
          text={t("KnowledgeBaseDeployment_NewDeploymentButtonLabel")}
          className={classes.button}
        />
        <div style={{ height: "640px" }}>
          {loadingData &&
            <h4 float="left">{t("General_LoadingData")}</h4>}
          {!loadingData &&
            <DeployJobsTable knowledgebases={knowdledgeBases} />
          }
        </div>
      </Stack>
    </div>
  );
}
