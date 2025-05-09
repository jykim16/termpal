import { startTmuxSession } from "./tmux/manager";
import fs from "fs-extra";
import os from "os";
import path from "path";

function ensureConfig() {
  const base = path.join(os.homedir(), ".termpal");
  fs.ensureDirSync(base);
  fs.ensureDirSync(path.join(base, "workflows"));
  fs.ensureDirSync(path.join(base, "plugins"));
  fs.ensureFileSync(path.join(base, "config.json"));
  fs.ensureFileSync(path.join(base, "memory.txt"));
}

ensureConfig();
startTmuxSession();
