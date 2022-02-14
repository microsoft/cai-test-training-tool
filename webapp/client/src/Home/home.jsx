import React from "react";
import { CompoundButton, mergeStyleSets, Stack } from "office-ui-fabric-react";
import { DeployPath, SettingManagementPath, BatchProcessingPath, AudioGenerationPath, TestPath } from "../services/pathService";
import { useTranslation } from 'react-i18next';
import {homeButtonStyle} from "../styles"

const classes = mergeStyleSets({
  root: {
    margin: "50px",
    paddingTop: "30px",
    textAlign: "left",
    objectAlign: "left",
  },
});

const horizontalGap = 30;

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className={classes.root}>
      <Stack gap={20}>
        <Stack horizontal gap={horizontalGap}>
          <CompoundButton
            href={TestPath.InitialScreen}
            primary
            secondaryText={t("Home_KnowledgeBase_Description")}
            style={homeButtonStyle}
          >
            QnA Maker Test
          </CompoundButton>
          <CompoundButton
            href={DeployPath.InitialScreen}
            primary
            secondaryText={t("Home_QnaDeployment_Description")}
            style={homeButtonStyle}
          >
            QnA Maker Deployment
          </CompoundButton>
        </Stack>
        <Stack horizontal gap={horizontalGap}>
          <CompoundButton
            href={BatchProcessingPath.InitialScreen}
            secondaryText={t("Home_BatchProcessing_Description")}
            style={homeButtonStyle}
          >
            Batch Processing
          </CompoundButton>
          <CompoundButton
            href={AudioGenerationPath.InitialScreen}
            secondaryText={t("Home_AudioGeneration_Description")}
            style={homeButtonStyle}
          >
            Audio Generation
          </CompoundButton>
        </Stack>
        {/* <Stack horizontal gap={horizontalGap}>
          <CompoundButton
            href={SettingManagementPath.InitialScreen}
            primary
            secondaryText={t("Home_ToolSettings_Description")}
            style={homeButtonStyle}
          >
            Bot Management Tool Settings
          </CompoundButton>
        </Stack> */}
      </Stack>

    </div>
  );
}
