export const TestPath = {
  InitialScreen: "/test",
  Start: "/test/start-new",
  Results: "/test/:partitionKey",
};

export const DeployPath = {
  InitialScreen: "/deploy",
  Start: "/deploy/start-new",
  Results: "/deploy/:partitionKey",
};


export const DropdownManagementPath = {
  InitialScreen: '/cam',
  NewDropdown: '/cam/new',
  EditDropdown: '/cam/edit'
}

export const SettingManagementPath = {
  InitialScreen: '/settings',
  NewSetting: '/settings/new',
  EditSetting: '/settings/edit'
}

export const BotTestPath = {
  InitialScreen: "/bottest",
  Start: "/bottest/start-new",
  Results: "/bottest/:partitionKey/:bot",
}

export const BatchProcessingPath = {
  InitialScreen: "/batchprocessing",
  Start: "/batchprocessing/start-new",
  Results: "/batchprocessing/:rowKey",
}

export const AudioGenerationPath = {
  InitialScreen: "/audiogeneration",
  Start: "/audiogeneration/start-new",
  Results: "/audiogeneration/:rowKey",
}

export const BotTestTranscriptPath = {
  InitialScreen: "/bottesttranscript",
}

export const ComingSoonPath = {
  InitialScreen: '/coming-soon',
}

export const Other = {
  Home: "/",
  Logout: "/logout",
};

export function getPath(path, parameters) {
  let output = path;
  for (const key of Object.keys(parameters)) {
    if (parameters[key]) {
      const value = parameters[key].toString();
      output = output.replace(`:${key}`, value);
    }
  }
  return output;
}
