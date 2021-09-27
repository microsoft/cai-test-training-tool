import React from "react";
import { mergeStyleSets } from "office-ui-fabric-react";

const classes = mergeStyleSets({
  root: {
    margin: "50px",
    paddingTop: "30px",
    textAlign: "left",
    objectAlign: "left",
  },
});

const horizontalGap = 30;

export default function ComingSoon() {
  return (
    <div className={classes.root}>
      <h1>Feature Coming Soon</h1>
    </div>
  );
}
