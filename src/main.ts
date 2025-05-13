import { startTmuxSession } from "./controller/tmux/manager";
import fs from "fs-extra";
import os from "os";
import path from "path";

export interface Config {
  baseDir: string;
  workflows: string[];
  plugins: string[];
  config: Record<string, any>;
  memory: string;
}

function loadOrCreateConfig(): Config {
  const base = path.join(os.homedir(), ".termpal");
  fs.ensureDirSync(base);
  fs.ensureDirSync(path.join(base, "workflows"));
  fs.ensureDirSync(path.join(base, "plugins"));
  fs.ensureFileSync(path.join(base, "config.json"));
  fs.ensureFileSync(path.join(base, "memory.txt"));

  // Load configuration files
  const configPath = path.join(base, "config.json");
  const memoryPath = path.join(base, "memory.txt");
  const workflowsDir = path.join(base, "workflows");
  const pluginsDir = path.join(base, "plugins");

  // Load or create config.json
  let configData: Record<string, any> = {};
  try {
    configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    configData = {};
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  }

  // Load memory
  const memory = fs.readFileSync(memoryPath, "utf-8");

  // Load workflows and plugins
  const workflows = fs.readdirSync(workflowsDir);
  const plugins = fs.readdirSync(pluginsDir);

  return {
    baseDir: base,
    workflows,
    plugins,
    config: configData,
    memory
  };
}

const config = loadOrCreateConfig();
startTmuxSession(config);
