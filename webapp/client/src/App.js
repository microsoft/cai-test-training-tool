import "./App.css";
import Nav from "./navigation.jsx";
import { initializeIcons } from "@uifabric/icons";
import { classes } from "./styles"
import icon from "./composerIcon.svg"
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import './i18nextConf';
import i18n from "./i18nextConf";
import { useTranslation } from 'react-i18next';
import { WindowContext } from "@fluentui/react";

initializeIcons();

function App() {

  const { t } = useTranslation();
  let languageOptions = i18n.options.whitelist.map(x => new Object({ key: x, text: x.toUpperCase() }))

  document.title = t("Tool_Title");

  return (
    <div className="App">
      <div className={classes.headerContainer} role="banner">
        <img
          src={icon}
          style={{ marginLeft: '9px' }}
        />
        <div className={classes.headerTextContainer}>
          <div className={classes.title}>{t("Tool_Title")}</div>
        </div>
        <div className={classes.headerLanguageDropdown}>
          <Dropdown
            options={languageOptions}
            defaultSelectedKey={i18n.language}
            onChange={(ev, item) => { i18n.changeLanguage(item.key); localStorage.setItem("chosenLanguage", item.key); window.location.reload() }}
          />
        </div>
      </div>
      <Nav />
    </div>
  );
}

export default App;
