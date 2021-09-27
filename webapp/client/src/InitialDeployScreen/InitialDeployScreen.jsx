import React, { useEffect, useState } from "react";
import DeployJobsTable from "./JobsTableDeploy.jsx";

import getKnowledgeBases from "../services/knowledgeBaseService.js";
import { Stack, PrimaryButton } from "office-ui-fabric-react";
import { classes } from "./../styles"
import { DeployPath } from "../services/pathService.js";



export default function StartDeploy() {
  const [knowdledgeBases, setKnowledgeBases] = useState([]);

  const [loadingData, setLoadingData] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    getKnowledgeBases("UAT")
      .then((result) => {
        setKnowledgeBases(result.message.knowledgebases)
        setLoadingData(false);
      })
      .catch((error) => {
        if (error.response.status == 403) {
          setLoadingData(false);
          setHasAccess(false);
        }
        console.log(error)
      });
  }, []);

  return (
    <div className={classes.root}>
      <Stack className={classes.stack} gap={20}>
        <h3 float="left">Neues Deployment in die Produktionsumgebung</h3>
        <PrimaryButton
          variant="contained"
          color="primary"
          href={DeployPath.Start}
          text="Neues Deployment"
          className={classes.button}
        />
        <div style={{ height: "640px" }}>
          {loadingData &&
            <h4 float="left">Lade Daten</h4>}
          {!loadingData && hasAccess &&
            <DeployJobsTable knowledgebases={knowdledgeBases} />
          }
          {!loadingData && !hasAccess &&
            <h4 float="left">Sie haben keine Rechte für diese Seite.</h4>
          }
        </div>
      </Stack>
    </div>
  );
}
