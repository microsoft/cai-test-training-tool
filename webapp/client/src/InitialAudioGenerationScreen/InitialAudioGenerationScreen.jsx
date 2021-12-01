import React, { useEffect, useState } from "react";
import AudioGenerationTable from "./AudioGenerationTable.jsx";

import { Stack, PrimaryButton } from "office-ui-fabric-react";
import { classes } from "../styles"
import { DeployPath } from "../services/pathService.js";

import { useTranslation } from 'react-i18next';


export default function AudioGeneration() {
  const [hasAccess, setHasAccess] = useState(true)

  const { t } = useTranslation();

  useEffect(() => {
  }, []);

  return (
    <div className={classes.root}>
      <Stack className={classes.stack} gap={20}>
        <h3 float="left">{t("AudioGeneration_Title")}</h3>
        <PrimaryButton
          variant="contained"
          color="primary"
          href={DeployPath.Start}
          text={t("AudioGeneration_NewLabel")}
          className={classes.button}
        />
        <div style={{ height: "640px" }}>
          {hasAccess &&
            <AudioGenerationTable/>
          }
          {!hasAccess &&
            <h4 float="left">{t("General_NoAccess")}</h4>
          }
        </div>
      </Stack>
    </div>
  );
}
