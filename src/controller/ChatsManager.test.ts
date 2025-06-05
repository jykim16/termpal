// Jest/Vitest setup and mocks will be at the top
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ChatsManager, Chat, Message } from './ChatsManager';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock os.homedir() to provide a consistent test path
jest.mock('os');
const mockOs = os as jest.Mocked<typeof os>;
mockOs.homedir.mockReturnValue('/testhome');

const testStorageDir = path.join('/testhome', '.termpal', 'chats');

describe('ChatsManager', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Spy on console.error and console.log
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock implementations
    mockFs.ensureDirSync.mockReturnValue(undefined);
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.readJsonSync.mockReturnValue(undefined);
    mockFs.writeJsonSync.mockImplementation(() => {});
    mockFs.removeSync.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize storage and load chats', () => {
      new ChatsManager();
      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(testStorageDir);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(testStorageDir); // From loadChats
    });

    it('should handle error during ensureDirSync', () => {
      mockFs.ensureDirSync.mockImplementationOnce(() => {
        throw new Error('Failed to create dir');
      });
      new ChatsManager();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'CRITICAL: Failed to create chat storage directory:',
        expect.any(Error)
      );
    });
  });

  describe('loadChats', () => {
    it('should load and parse chat files correctly', () => {
      const chatFiles = ['chat1.json', 'chat2.json'];
      const chat1Data = { id: 'chat1', title: 'Chat 1', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const chat2Data = { id: 'chat2', title: 'Chat 2', messages: [{role: 'user', content: 'Hello', timestamp: new Date().toISOString()}], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

      mockFs.readdirSync.mockReturnValue(chatFiles as any);
      mockFs.readJsonSync
        .mockReturnValueOnce(chat1Data)
        .mockReturnValueOnce(chat2Data);

      const manager = new ChatsManager();
      const chats = manager.getAllChats();

      expect(chats.length).toBe(2);
      expect(chats[0].id).toBe(chat1Data.id); // Assuming sort order or checking specific content
      expect(chats[1].id).toBe(chat2Data.id);
      expect(chats[1].messages[0].content).toBe('Hello');
      expect(mockFs.readJsonSync).toHaveBeenCalledTimes(2);
    });

    it('should skip corrupted JSON files and log error', () => {
      const chatFiles = ['chat1.json', 'corrupted.json', 'chat2.json'];
      const chat1Data = { id: 'chat1', title: 'Chat 1', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const chat2Data = { id: 'chat2', title: 'Chat 2', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

      mockFs.readdirSync.mockReturnValue(chatFiles as any);
      mockFs.readJsonSync
        .mockReturnValueOnce(chat1Data)
        .mockImplementationOnce(() => { throw new Error('JSON parse error'); })
        .mockReturnValueOnce(chat2Data);

      const manager = new ChatsManager();
      const chats = manager.getAllChats();

      expect(chats.length).toBe(2);
      expect(chats.find(c => c.id === 'chat1')).toBeDefined();
      expect(chats.find(c => c.id === 'chat2')).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading chat file corrupted.json:',
        expect.any(Error)
      );
    });

    it('should handle error when reading chat directory', () => {
      mockFs.readdirSync.mockImplementationOnce(() => {
        throw new Error('Cannot read dir');
      });

      new ChatsManager();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading chat directory:',
        expect.any(Error)
      );
      // In this case, manager.chats would be empty
    });
  });

  describe('saveChat', () => {
    it('should call writeJsonSync with correct parameters', () => {
      const manager = new ChatsManager();
      const chat: Chat = { id: 'test', title: 'Test Chat', messages: [], createdAt: new Date(), updatedAt: new Date() };
      (manager as any).saveChat(chat); // Access private method for test

      expect(mockFs.writeJsonSync).toHaveBeenCalledWith(
        path.join(testStorageDir, 'test.json'),
        chat,
        { spaces: 2 }
      );
    });

    it('should log error if writeJsonSync fails', () => {
      mockFs.writeJsonSync.mockImplementationOnce(() => {
        throw new Error('Disk full');
      });
      const manager = new ChatsManager();
      const chat: Chat = { id: 'test', title: 'Test Chat', messages: [], createdAt: new Date(), updatedAt: new Date() };
      (manager as any).saveChat(chat);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving chat test:',
        expect.any(Error)
      );
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat, save it, and set it as current', () => {
      const manager = new ChatsManager();
      const newChat = manager.createNewChat();

      expect(newChat.title).toBe('New Chat');
      expect(newChat.messages.length).toBe(0);
      expect(manager.getAllChats()[0]).toEqual(newChat);
      expect(manager.getCurrentChat()).toEqual(newChat);
      expect(mockFs.writeJsonSync).toHaveBeenCalledWith(
        path.join(testStorageDir, `${newChat.id}.json`),
        newChat,
        { spaces: 2 }
      );
    });
  });

  describe('addMessage', () => {
    it('should add a message to the specified chat and save it', () => {
      const manager = new ChatsManager();
      const chat = manager.createNewChat(); // Creates 'chat1' and saves

      mockFs.writeJsonSync.mockClear(); // Clear mock from createNewChat

      const messageContent = 'Hello, world!';
      manager.addMessage(chat.id, 'user', messageContent);

      const updatedChat = manager.getCurrentChat();
      expect(updatedChat?.messages.length).toBe(1);
      expect(updatedChat?.messages[0].role).toBe('user');
      expect(updatedChat?.messages[0].content).toBe(messageContent);
      expect(updatedChat?.updatedAt).not.toEqual(chat.createdAt); // Assuming time progresses
      expect(mockFs.writeJsonSync).toHaveBeenCalledTimes(1); // Called by addMessage
    });

    it('should update chat title with first user message content', () => {
        const manager = new ChatsManager();
        const chat = manager.createNewChat();
        const firstMessage = "This is the very first message to define title";
        manager.addMessage(chat.id, 'user', firstMessage);
        expect(chat.title).toBe(firstMessage.slice(0, 30));

        manager.addMessage(chat.id, 'assistant', "I am an assistant");
        expect(chat.title).toBe(firstMessage.slice(0, 30)); // Title should not change

        manager.addMessage(chat.id, 'user', "Another user message");
        expect(chat.title).toBe(firstMessage.slice(0, 30)); // Title should not change
    });

    it('should not add message if chat ID is invalid', () => {
        const manager = new ChatsManager();
        manager.addMessage('invalid-id', 'user', 'test');
        expect(mockFs.writeJsonSync).not.toHaveBeenCalled();
    });
  });

  describe('deleteChat', () => {
    it('should remove chat and its file, then update currentChatId if needed', () => {
      const manager = new ChatsManager();
      const chat1 = manager.createNewChat(); // chat1
      const chat2 = manager.createNewChat(); // chat2, now current

      expect(manager.getAllChats().length).toBe(2);
      manager.deleteChat(chat2.id);

      expect(manager.getAllChats().length).toBe(1);
      expect(manager.getAllChats()[0].id).toBe(chat1.id);
      expect(mockFs.removeSync).toHaveBeenCalledWith(path.join(testStorageDir, `${chat2.id}.json`));
      expect(manager.getCurrentChat()?.id).toBe(chat1.id); // currentChatId updated to chat1
    });

    it('should set currentChatId to null if last chat is deleted', () => {
        const manager = new ChatsManager();
        const chat1 = manager.createNewChat();
        manager.deleteChat(chat1.id);
        expect(manager.getCurrentChat()).toBeNull();
        expect(mockFs.removeSync).toHaveBeenCalledWith(path.join(testStorageDir, `${chat1.id}.json`));
    });

    it('should log error if fs.removeSync fails', () => {
        mockFs.removeSync.mockImplementationOnce(() => {
            throw new Error('Cannot delete file');
        });
        const manager = new ChatsManager();
        const chat = manager.createNewChat();
        manager.deleteChat(chat.id);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Error deleting chat file ${chat.id}.json:`,
            expect.any(Error)
        );
    });

    it('should do nothing if chat ID to delete is not found', () => {
        const manager = new ChatsManager();
        manager.createNewChat(); // Create one chat
        manager.deleteChat('non-existent-id');
        expect(mockFs.removeSync).not.toHaveBeenCalled();
        expect(manager.getAllChats().length).toBe(1);
    });
  });

  describe('setCurrentChat', () => {
    it('should set currentChatId if chat exists', () => {
      const manager = new ChatsManager();
      const chat1 = manager.createNewChat();
      const chat2 = manager.createNewChat();

      manager.setCurrentChat(chat1.id);
      expect(manager.getCurrentChat()?.id).toBe(chat1.id);
    });

    it('should not change currentChatId if chat does not exist', () => {
      const manager = new ChatsManager();
      const chat1 = manager.createNewChat();
      manager.setCurrentChat('non-existent-id');
      expect(manager.getCurrentChat()?.id).toBe(chat1.id);
    });
  });

  describe('getAllChats', () => {
    it('should return a copy of the chats array', () => {
        const manager = new ChatsManager();
        const chat1 = manager.createNewChat();
        const allChats = manager.getAllChats();
        expect(allChats.length).toBe(1);
        expect(allChats[0].id).toBe(chat1.id);

        // Modify returned array and check if original is unaffected
        allChats.push({} as Chat);
        expect(manager.getAllChats().length).toBe(1);
    });
  });
});
