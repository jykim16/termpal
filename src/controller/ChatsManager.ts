import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class ChatsManager {
  private chats: Chat[] = [];
  private currentChatId: string | null = null;
  private readonly storageDir: string;

  constructor() {
    this.storageDir = path.join(os.homedir(), '.termpal', 'chats');
    this.initializeStorage();
    this.loadChats();
  }

  private initializeStorage(): void {
    try {
      fs.ensureDirSync(this.storageDir);
    } catch (error) {
      console.error('CRITICAL: Failed to create chat storage directory:', error);
      // Depending on the application's needs, this might throw the error further
      // or the application might try to operate in a degraded mode (e.g., in-memory only).
      // For now, we log and let it continue, which might lead to failures in other operations.
    }
  }

  private loadChats(): void {
    let files: string[];
    try {
      files = fs.readdirSync(this.storageDir);
    } catch (error) {
      console.error('Error reading chat directory:', error);
      this.chats = [];
      return;
    }

    this.chats = files
      .filter(file => file.endsWith('.json'))
      .reduce((acc: Chat[], file) => {
        const filePath = path.join(this.storageDir, file);
        try {
          const content = fs.readJsonSync(filePath);
          acc.push({
            ...content,
            createdAt: new Date(content.createdAt),
            updatedAt: new Date(content.updatedAt),
            messages: content.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          });
        } catch (error) {
          console.error(`Error loading chat file ${file}:`, error);
          // Skip this file and continue with others
        }
        return acc;
      }, [])
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private saveChat(chat: Chat): void {
    const filePath = path.join(this.storageDir, `${chat.id}.json`);
    try {
      fs.writeJsonSync(filePath, chat, { spaces: 2 });
    } catch (error) {
      console.error(`Error saving chat ${chat.id}:`, error);
    }
  }

  createNewChat(): Chat {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.chats.unshift(newChat);
    this.currentChatId = newChat.id;
    this.saveChat(newChat);
    return newChat;
  }

  getCurrentChat(): Chat | null {
    if (!this.currentChatId) return null;
    return this.chats.find(chat => chat.id === this.currentChatId) || null;
  }

  addMessage(chatId: string, role: 'user' | 'assistant', content: string): void {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) return;

    const message: Message = {
      role,
      content,
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();

    // Update title if it's the first message
    if (chat.messages.length === 1 && role === 'user') { // Typically set title based on first user message
      chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

    // TODO: Implement message limit if needed
    // const MAX_MESSAGES_PER_CHAT = 100; // Example limit
    // if (chat.messages.length > MAX_MESSAGES_PER_CHAT) {
    //   chat.messages = chat.messages.slice(chat.messages.length - MAX_MESSAGES_PER_CHAT);
    // }

    this.saveChat(chat);
  }

  getAllChats(): Chat[] {
    return [...this.chats];
  }

  deleteChat(chatId: string): void {
    const index = this.chats.findIndex(chat => chat.id === chatId);
    if (index === -1) return;

    this.chats.splice(index, 1);
    const filePath = path.join(this.storageDir, `${chatId}.json`);
    try {
      fs.removeSync(filePath);
    } catch (error) {
      console.error(`Error deleting chat file ${chatId}.json:`, error);
    }

    if (this.currentChatId === chatId) {
      this.currentChatId = this.chats[0]?.id || null;
    }
  }

  setCurrentChat(chatId: string): void {
    if (this.chats.some(chat => chat.id === chatId)) {
      this.currentChatId = chatId;
    }
  }
}