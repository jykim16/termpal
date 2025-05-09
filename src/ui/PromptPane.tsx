import React, { useState } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { getAgentResponse } from "../agent/index";
import fs from "fs-extra";
import os from "os";
import path from "path";

const memoryFile = path.join(os.homedir(), ".termpal", "memory.txt");

const PromptPane = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [response, setResponse] = useState<string>("");

  useInput((inputKey, key) => {
    if (key.return) {
      setHistory((h) => [...h, `> ${input}`]);
      getAgentResponse(input).then((res) => {
        setResponse(res);
        setHistory((h) => [...h, res]);
        fs.ensureFileSync(memoryFile);
        fs.appendFileSync(memoryFile, `User: ${input}\nAgent: ${res}\n`);
      });
      setInput("");
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="green">TermPal Prompt (type your request):</Text>
      <TextInput value={input} onChange={setInput} />
      <Box flexDirection="column" marginTop={1}>
        {history.slice(-10).map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
      {response && (
        <Box marginTop={1}>
          <Text color="cyan">{response}</Text>
        </Box>
      )}
    </Box>
  );
};

render(<PromptPane />);
