// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

// In Claude Code cloud sessions Chromium is pre-installed and the automatic
// Chrome Headless Shell download is blocked, so use it when it is present.
const preinstalledChromium = "/opt/pw-browsers/chromium";
if (existsSync(preinstalledChromium)) {
  Config.setBrowserExecutable(preinstalledChromium);
}

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
