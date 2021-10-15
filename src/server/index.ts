import express from "express";
import appConfig from "../config/config";
import profileHandler from "../routes/profile";
import mapHandler from "../routes/map";

const app = express();

app.all(/^\/profile\/([0-9]+)\.png$/, profileHandler);
app.all(/^\/map\/([0-9]+)\.png$/, mapHandler);

app.listen(appConfig.port, appConfig.hostname, () => {
  console.log(
    `Server listening on http://${appConfig.hostname}:${appConfig.port}`
  );
});
