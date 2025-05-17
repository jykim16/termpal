import { startTmuxSession } from "./controller/tmux/manager";
import { loadOrCreateConfig } from "./config";

const config = loadOrCreateConfig();
startTmuxSession(config);
