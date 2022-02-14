import { css } from 'emotion';
import {
  mergeStyleSets,
  getTheme,
  FontWeights,
  IIconProps
} from "@fluentui/react";
const theme = getTheme();


export const returnIcon: IIconProps = { iconName: 'ReturnKey' };
export const openIcon: IIconProps = { iconName: 'OpenInNewWindow' };
export const deleteIcon: IIconProps = { iconName: 'Delete' };
export const completeIcon: IIconProps = { iconName: 'CompletedSolid' };
export const cancelIcon: IIconProps = { iconName: 'Cancel' };
export const saveIcon: IIconProps = { iconName: "Save" };
export const editIcon: IIconProps = { iconName: 'Edit' };
export const refreshIcon: IIconProps = { iconName: 'Refresh' };
export const downloadIcon: IIconProps = { iconName: 'Download' };

export const stackTokens = { childrenGap: '5%' };
export const modalStyles = mergeStyleSets({
  container: {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'stretch',
    maxWidth: '25%'
  },
  header: [
    theme.fonts.xLargePlus,
    {
      flex: '1 1 auto',
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: 'flex',
      alignItems: 'center',
      fontWeight: FontWeights.semibold,
      padding: '12px 12px 14px 24px',
    },
  ],
  body: {
    flex: '4 4 auto',
    padding: '0 24px 24px 24px',
    overflowY: 'hidden',
    selectors: {
      p: { margin: '14px 0' },
      'p:first-child': { marginTop: 0 },
      'p:last-child': { marginBottom: 0 },
    },
  },
  buttons: {
    flex: '1 1 auto',
    display: 'flex',
    alignItems: 'center',
    padding: '0px 32px 24px 24px',
    marginLeft: 'auto',
    width: 'fit-content'
  }
});

export const modelIconButtonStyles = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: 'auto',
    marginTop: '4px',
    marginRight: '2px',
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};

export const classes = mergeStyleSets({
  root: {
    margin: "50px",
    paddingTop: "30px",
    textAlign: "left",
    objectAlign: "left",
    width: "100%",
  },
  stack: {
    width: "100%"
  },
  button: {
    width: "200px"
  },
  headerContainer: {
    position: "relative",
    background: "#0078d4",
    height: "50px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "50%"
  },
  headerLanguageDropdown: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "50%",
    marginRight: "9px"
  },
  title: {
    marginLeft: "20px",
    fontWeight: "600",
    fontSize: "16px",
    color: "#fff"
  }
});

export const pageRoot = css`
  display: flex;
  flex-flow: column nowrap;
  padding: 25px;
  height: 100vh
`;


export const dialogListStyle = css`
  height:260px;
  width:40vw;
  position: relative;
`;

export const homeButtonStyle ={
  width:"300px"
}

export const iconClassNames = mergeStyleSets({
  success: [{ color: "green" }],
  created: [{ color: "yellow" }],
  failure: [{ color: "red" }],
});
