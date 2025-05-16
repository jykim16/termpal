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
    fs.ensureDirSync(this.storageDir);
  }

  private loadChats(): void {
    try {
      const files = fs.readdirSync(this.storageDir);
      this.chats = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const content = fs.readJsonSync(path.join(this.storageDir, file));
          return {
            ...content,
            createdAt: new Date(content.createdAt),
            updatedAt: new Date(content.updatedAt),
            messages: content.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
        })
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error loading chats:', error);
      this.chats = [];
    }
  }

  private saveChat(chat: Chat): void {
    const filePath = path.join(this.storageDir, `${chat.id}.json`);
    fs.writeJsonSync(filePath, chat, { spaces: 2 });
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
    return {...this.chats.find(chat => chat.id === this.currentChatId)} || null;
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
    if (chat.messages.length === 1) {
      chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }

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
    fs.removeSync(filePath);

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