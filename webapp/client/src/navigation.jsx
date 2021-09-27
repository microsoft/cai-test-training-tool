/** @jsxImportSource @emotion/react */
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NewTest from "./Test/newTest";
import InitialTestScreen from "./InitialTestScreen/InitialTestScreen";
import { DeployPath, SettingManagementPath, Other, TestPath, ComingSoonPath, BotTestPath } from "./services/pathService";
import Result from "./TestResult/TestResultScreen";
import Home from "./Home/home";
import StartDeploy from "./InitialDeployScreen/InitialDeployScreen";
import DeployResult from "./DeployResult/DeployResultScreen";
import { SideBar } from "./NavBar/SideBar";
import NewDeploy from "./Deploy/NewDeployment";
import SettingListScreen from "./SettingManagement/SettingListScreen";
import AddNewSettingScreen from "./SettingManagement/AddNewSettingScreen";
import EditSettingScreen from "./SettingManagement/EditSettingScreen";
import { mergeStyleSets } from "office-ui-fabric-react";
import ComingSoon from "./Home/comingSoon";

const classes = mergeStyleSets({
  root: {
    display: "flex",
    height: "100%",
  },
});

export function LogoutComonent() {
  return <h1>Please log in</h1>;
}

export default function Nav() {

  return (
    <div className={classes.root}>
      <SideBar />
      <Router>
        <Switch>
          <Route path={Other.Home} exact component={Home} />
          <Route path={Other.Logout} exact component={LogoutComonent} />
          <Route path={TestPath.Start} exact component={NewTest} />
          <Route
            path={TestPath.InitialScreen}
            exact
            component={InitialTestScreen}
          />
          <Route path={TestPath.Results} exact component={Result} />
          <Route
            path={DeployPath.InitialScreen}
            exact
            component={StartDeploy}
          />
          
          <Route path={DeployPath.Start} exact component={NewDeploy} />
          <Route path={DeployPath.Results} exact component={DeployResult} />
          <Route path={SettingManagementPath.InitialScreen} exact component={SettingListScreen} />
          <Route path={SettingManagementPath.NewSetting} exact component={AddNewSettingScreen} />
          <Route path={`${SettingManagementPath.EditSetting}/:partitionKey/:rowKey`} exact component={EditSettingScreen} />
          <Route path={`${ComingSoonPath.InitialScreen}`} exact component={ComingSoon} />
        </Switch>
      </Router>
    </div>
  );
}
