import React, { useEffect, useState } from "react";
import BatchProcessingTable from "./BatchProcessingTable.jsx";

import { Stack, PrimaryButton } from "office-ui-fabric-react";
import { classes } from "../styles"
import { BatchProcessingPath } from "../services/pathService.js";

import { useTranslation } from 'react-i18next';


export default function BatchProcessing() {
  const [hasAccess, setHasAccess] = useState(true)

  const { t } = useTranslation();

  useEffect(() => {
  }, []);

  return (
    <div className={classes.root}>
      <Stack className={classes.stack} gap={20}>
        <h3 float="left">{t("BatchProcessing_Title")}</h3>
        <PrimaryButton
          variant="contained"
          color="primary"
          href={BatchProcessingPath.Start}
          text={t("BatchProcessing_NewLabel")}
          className={classes.button}
        />
        <div style={{ height: "640px" }}>
          {hasAccess &&
            <BatchProcessingTable/>
          }
          {!hasAccess &&
            <h4 float="left">{t("General_NoAccess")}</h4>
          }
        </div>
      </Stack>
    </div>
  );
}
