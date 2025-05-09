import React, { useEffect, useState } from "react";
import { render, Box, Text } from "ink";
import fs from "fs-extra";
import os from "os";
import path from "path";

const workflowFile = path.join(os.homedir(), ".termpal", "workflows", "current.sh");

const WorkspacePane = () => {
  const [script, setScript] = useState<string>("");

  useEffect(() => {
    fs.ensureFileSync(workflowFile);
    const updateScript = () => {
      setScript(fs.readFileSync(workflowFile, "utf-8"));
    };
    updateScript();
    const interval = setInterval(updateScript, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="yellow">Workspace (Current Workflow Script):</Text>
      <Box borderStyle="round" borderColor="gray" padding={1}>
        <Text>{script || "No workflow generated yet."}</Text>
      </Box>
    </Box>
  );
};

render(<WorkspacePane />);
