import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { getAgentResponse } from "../../agent";
import { ChatsManager, Chat } from "../../controller/ChatsManager";

const PromptPane = () => {
  const [input, setInput] = useState("");
  const [chatsManager] = useState(() => new ChatsManager());
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  useEffect(() => {
    // Initialize with a new chat if none exists
    if (!currentChat) {
      const newChat = chatsManager.createNewChat();
      setCurrentChat(newChat);
    }
  }, []);

  let onSubmit = (prompt) => {
    if (!currentChat) {
      const newChat = chatsManager.createNewChat();
      setCurrentChat(newChat);
    }

    // Add user message
    chatsManager.addMessage(currentChat!.id, 'user', prompt);
    setCurrentChat(chatsManager.getCurrentChat());

      // Get and add agent response
    getAgentResponse(prompt).then((res) => {
      chatsManager.addMessage(currentChat!.id, 'assistant', res);
      setCurrentChat(chatsManager.getCurrentChat());
    });

    setInput("");
  };



  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginTop={1}>
        {currentChat?.messages.map((message, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text color={message.role === 'user' ? 'green' : 'cyan'}>
              {message.role === 'user' ? '> ' : ''}{message.content}
            </Text>
          </Box>
        ))}
      </Box>
      <Text color="green">TermPal Prompt (type your request):</Text>
      <TextInput value={input} onSubmit={onSubmit}  onChange={setInput}/>
    </Box>
  );
};

render(<PromptPane />);
