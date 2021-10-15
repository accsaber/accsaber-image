import Config from "../interfaces/config";

const appConfig: Config = {
  hostname: process.env?.HOST ?? "localhost",
  port: parseInt(process.env?.PORT ?? "8080"),
};

export default appConfig;
