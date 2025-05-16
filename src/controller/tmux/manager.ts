import { spawnSync } from "child_process";
import os from "os";
import { Config } from "../../config";

const sessionName = "termpal";
const promptPaneCmd = `bun run src/ui/PromptPane/Main.tsx`;
const workspacePaneCmd = `bun run src/ui/WorkspacePane/Main.tsx`;

export function startTmuxSession(config: Config) {
  // Kill existing session if exists
  spawnSync("tmux", ["kill-session", "-t", sessionName]);

  // Start new session with PromptPane
  spawnSync("tmux", [
    "new-session",
    "-d",
    "-s",
    sessionName,
    promptPaneCmd,
  ]);

  // Split window horizontally for TerminalPane (bottom left)
  spawnSync("tmux", [
    "split-window",
    "-v",
    "-t",
    `${sessionName}:0.0`,
    os.userInfo().shell || "/bin/sh",
  ]);

  // Split window vertically for WorkspacePane (right)
  spawnSync("tmux", [
    "split-window",
    "-h",
    "-t",
    `${sessionName}:0.0`,
    workspacePaneCmd,
  ]);

  // Attach to session
  spawnSync("tmux", ["attach-session", "-t", sessionName], { stdio: "inherit" });
}
