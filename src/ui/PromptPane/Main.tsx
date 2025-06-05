import React, { useState, useEffect, useRef } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { getAgentResponse } from "../../agent/index";
import { ChatsManager, Chat } from "../../controller/ChatsManager";

const PromptPane = () => {
  const [input, setInput] = useState("");
  const [chatsManager] = useState(() => new ChatsManager());
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | Box>(null); // For scrolling

  useEffect(() => {
    // Initialize with a new chat if none exists
    if (!currentChat) {
      const newChat = chatsManager.createNewChat();
      setCurrentChat(newChat);
    }
  }, []);

  useInput((inputKey, key) => {
    if (key.return && input.trim()) {
      if (!currentChat) {
        // This case should ideally not happen if initialized in useEffect, but as a fallback:
        const newChat = chatsManager.createNewChat();
        setCurrentChat(newChat);
        // Note: newChat.id would be used below, so ensure currentChat is updated for the logic
        chatsManager.addMessage(newChat.id, 'user', input);
      } else {
        chatsManager.addMessage(currentChat.id, 'user', input);
      }

      const currentInput = input; // Store current input
      setInput(""); // Clear input before agent response
      setIsLoading(true);
      setError(null);
      setCurrentChat(chatsManager.getCurrentChat()); // Update chat after adding user message

      getAgentResponse(currentInput)
        .then((res) => {
          chatsManager.addMessage(currentChat!.id, 'assistant', res);
          setCurrentChat(chatsManager.getCurrentChat());
        })
        .catch((err) => {
          setError("Agent failed to respond. Please try again.");
          // Optionally, add this error as a system message to the chat
          // chatsManager.addMessage(currentChat!.id, 'system', `Error: ${err.message || "Unknown error"}`);
          // setCurrentChat(chatsManager.getCurrentChat());
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    // Note: Ink's <Box> might not directly support a imperative scroll API like DOM's scrollIntoView.
    // This is a placeholder for a more Ink-idiomatic way if available, or relies on Ink's default behavior.
    // For now, we'll ensure the container has a fixed height and let Ink handle overflow.
    if (messagesEndRef.current) {
      // This is a conceptual attempt; Ink might not support this.
      // If not, scrolling will rely on Box's default behavior with overflow.
    }
  }, [currentChat?.messages]);

  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" flexGrow={1} overflowY="scroll" height="80%"> {/* Scrollable messages area */}
        {currentChat?.messages.map((message, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text color={message.role === 'user' ? 'green' : 'cyan'}>
              {message.role === 'user' ? 'You: ' : 'Agent: '}
              {message.content}
            </Text>
          </Box>
        ))}
        <Box ref={messagesEndRef} /> {/* Element to help with scrolling if needed */}
      </Box>

      {isLoading && <Text>Agent is thinking...</Text>}
      {error && <Text color="red">{error}</Text>}

      <Box flexDirection="column" marginTop={1}> {/* Input area */}
        <Text color="green">TermPal Prompt (type your request):</Text>
        <TextInput
          value={input}
          onChange={(newInput) => {
            setInput(newInput);
            if (error) setError(null); // Clear error when user types
          }}
        />
      </Box>
    </Box>
  );
};

render(<PromptPane />);
