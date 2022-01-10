/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { NeutralColors, FontSizes } from '@uifabric/fluent-theme';
import { useState } from 'react';
import formatMessage from 'format-message';
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { FocusZone } from 'office-ui-fabric-react/lib/FocusZone';
import { TooltipHost, DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { Other, TestPath, DeployPath, SettingManagementPath, BatchProcessingPath, AudioGenerationPath } from '../services/pathService';
import { NavItem } from './NavItem';

// -------------------- Styles -------------------- //

const globalNav = css`
  height: 44px;
  width: 100%;
  align-items: left;
  line-height: 44px;
  cursor: pointer;
  display: flex;
  margin-right: 12px;
  padding-left: 12px;
  position: relative;
  font-size: ${FontSizes.size16};
  color: #106ebe;
  &:hover {
    background: ${NeutralColors.gray50};
  }
`;

const sideBar = (isExpand) => css`
  width: ${isExpand ? "200" : "48"}px;
  background-color: ${NeutralColors.gray20};
  height: calc(100vh - 50px);
  border-right: 1px solid ${NeutralColors.gray50};
  transition: width 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 1rem;
`;

const dividerTop = css`
  width: 100%;
  border-bottom: 1px solid ${NeutralColors.gray40};
  margin: 0 auto;
`;



// -------------------- SideBar -------------------- //

let links = [
  {
    area: "/",
    to: Other.Home,
    iconName: "Home",
    labelName: formatMessage("Home"),
    exact: true,
    disabled: false,
  },
  {
    area: "/test",
    to: TestPath.InitialScreen,
    iconName: "Questionnaire",
    labelName: formatMessage("QnA Test"),
    exact: false,
    disabled: false,
  },
  {
    area: "/deploy",
    to: DeployPath.InitialScreen,
    iconName: "CloudUpload",
    labelName: formatMessage("QnA Deployment"),
    exact: false,
    disabled: false,
  },
  {
    area: "/batchprocessing",
    to: BatchProcessingPath.InitialScreen,
    iconName: 'Processing',
    labelName: formatMessage('Batch Processing'),
    exact: false,
    disabled: false,
  },
  {
    area: "/audiogeneration",
    to: AudioGenerationPath.InitialScreen,
    iconName: 'BoxPlaySolid',
    labelName: formatMessage('Audio Generation'),
    exact: false,
    disabled: false,
  },
  {
    area: "/settings",
    to: SettingManagementPath.InitialScreen,
    iconName: 'Settings',
    labelName: formatMessage('Tool Settings'),
    exact: false,
    disabled: false,
  },
];

export const SideBar = () => {
  const [sideBarExpand, setSideBarExpand] = useState(false);

  const globalNavButtonText = sideBarExpand
    ? formatMessage("Collapse Navigation")
    : formatMessage("Expand Navigation");
  const showTooltips = () => !sideBarExpand;
  return (
    <nav css={sideBar(sideBarExpand)}>
      <div>
        <TooltipHost
          content={globalNavButtonText}
          directionalHint={DirectionalHint.rightCenter}
        >
          <IconButton
            ariaLabel={globalNavButtonText}
            css={globalNav}
            data-testid={"LeftNavButton"}
            iconProps={{
              iconName: "GlobalNavButton",
            }}
            onClick={() => {
              setSideBarExpand((current) => !current);
            }}
          />
        </TooltipHost>
        <div css={dividerTop} />{" "}
        <FocusZone allowFocusRoot>
          {links.map((link, index) => {
            return (
              <NavItem
                area={link.area}
                key={"NavLeftBar" + index}
                disabled={link.disabled}
                exact={link.exact}
                iconName={link.iconName}
                labelName={link.labelName}
                showTooltip={showTooltips(link)}
                to={link.to}
              />
            );
          })}
        </FocusZone>
      </div>
    </nav>
  );
};
