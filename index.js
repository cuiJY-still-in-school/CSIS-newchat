/**
 * NewChat - A simple, beautiful chat interface for OpenClaw
 * 
 * Features:
 * 1. Standalone web server with ChatGPT-like interface
 * 2. Dashboard integration for configuration and launch
 * 3. AI integration (DeepSeek/OpenAI)
 * 4. Chat history with sidebar
 * 5. Simple configuration (port, API key, model)
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

module.exports = {
  // Server instance and state
  server: null,
  chatSessions: new Map(), // chatId -> { messages: [], title: string }
  config: {},
  logger: null,
  dashboard: null,
  
  /**
   * Initialize the mod
   */
  async onLoad(context) {
    const { logger, config, exports, require } = context;
    
    this.logger = logger;
    this.config = config;
    this.context = context;
    
    logger.info('NewChat mod loading... 🗨️');
    logger.info('NewChat onLoad called with context keys: ' + JSON.stringify(Object.keys(context)));
    logger.info('Context has modPath: ' + ('modPath' in context));
    logger.info('Context has modDir: ' + ('modDir' in context));
    if ('modPath' in context) logger.info('modPath: ' + context.modPath);
    if ('modDir' in context) logger.info('modDir: ' + context.modDir);
    
    try {
      // Load dashboard library
      const dashboardModule = require('dashboard');
      logger.info('Dashboard library loaded successfully');
      logger.info('Dashboard module keys: ' + JSON.stringify(Object.keys(dashboardModule)));
      
      // Dashboard API might be under the 'dashboard' property
      if (dashboardModule.dashboard) {
        this.dashboard = dashboardModule.dashboard;
        logger.info('Using dashboard.dashboard API');
      } else {
        this.dashboard = dashboardModule;
        logger.info('Using dashboard module directly');
      }
      
      logger.info('Dashboard API keys: ' + JSON.stringify(Object.keys(this.dashboard)));
      if (this.dashboard.components) {
        logger.info('Dashboard.components type: ' + typeof this.dashboard.components);
        logger.info('Dashboard.components keys: ' + JSON.stringify(Object.keys(this.dashboard.components)));
        logger.info('Has Input method: ' + ('Input' in this.dashboard.components));
      } else {
        logger.warn('Dashboard.components is undefined');
      }
      logger.info('Has registerComponent: ' + ('registerComponent' in this.dashboard));
      
      // Create data directory for chat history
      await this.ensureDataDirectory();
      
      // Load existing chat sessions
      await this.loadChatSessions();
      
      // Start the web server
      await this.startServer();
      
      // Register with dashboard
      await this.registerDashboardComponent();
      
      // Export API for other mods (optional)
      exports.newchat = {
        getServerUrl: () => `http://localhost:${this.config.port || 3001}`,
        sendMessage: this.sendMessage.bind(this)
      };
      
      logger.info(`NewChat mod initialized successfully on port ${this.config.port || 3001}`);
      
    } catch (error) {
      logger.error(`Failed to initialize NewChat: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      // Try to get modPath from context, fall back to current directory
      let modPath = '.';
      if (this.context && this.context.modPath) {
        modPath = this.context.modPath;
      } else if (this.context && this.context.modDir) {
        modPath = this.context.modDir;
      } else {
        // Try to use the directory containing this file
        modPath = path.dirname(__filename || '.');
      }
      
      this.logger.info(`Using modPath: ${modPath}`);
      
      const dataDir = path.resolve(modPath, 'data');
      this.logger.info(`Creating data directory: ${dataDir}`);
      
      await fs.mkdir(dataDir, { recursive: true });
      this.dataDir = dataDir;
      this.logger.info(`Data directory created: ${dataDir}`);
    } catch (error) {
      this.logger.warn(`Could not create data directory: ${error.message}`);
      // Continue without data directory
      this.dataDir = null;
    }
  },
  

  

  
  /**
   * Load chat sessions from disk
   */
  async loadChatSessions() {
    if (!this.dataDir) return;
    
    try {
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(this.dataDir, file), 'utf8');
          const session = JSON.parse(content);
          const chatId = path.basename(file, '.json');
          this.chatSessions.set(chatId, session);
        } catch (error) {
          this.logger.warn(`Failed to load chat session ${file}: ${error.message}`);
        }
      }
      
      this.logger.info(`Loaded ${this.chatSessions.size} chat sessions`);
    } catch (error) {
      this.logger.warn(`Could not load chat sessions: ${error.message}`);
    }
  },
  
  /**
   * Save a chat session to disk
   */
  async saveChatSession(chatId, session) {
    if (!this.dataDir) return;
    
    try {
      const filePath = path.join(this.dataDir, `${chatId}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf8');
    } catch (error) {
      this.logger.warn(`Failed to save chat session ${chatId}: ${error.message}`);
    }
  },
  
  /**
   * Start the HTTP server
   */
  async startServer() {
    const port = this.config.port || 3001;
    
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.handleRequest.bind(this));
      
      this.server.on('error', (error) => {
        this.logger.error(`Server error: ${error.message}`);
        reject(error);
      });
      
      this.server.listen(port, 'localhost', () => {
        this.logger.info(`NewChat server listening on http://localhost:${port}`);
        resolve();
      });
    });
  },
  
  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    try {
      // API endpoints
      if (pathname === '/api/chat' && req.method === 'POST') {
        await this.handleChatRequest(req, res);
      } else if (pathname === '/api/history' && req.method === 'GET') {
        await this.handleHistoryRequest(req, res);
      } else if (pathname === '/api/history' && req.method === 'POST') {
        await this.handleSaveHistory(req, res);
      } else {
        // Static file serving
        await this.serveStaticFile(req, res, pathname);
      }
    } catch (error) {
      this.logger.error(`Request handling error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  },
  
  /**
   * Serve static files from the public directory
   */
  async serveStaticFile(req, res, pathname) {
    // Default to index.html
    let filePath = pathname === '/' ? '/index.html' : pathname;
    
    // Prevent directory traversal
    filePath = filePath.replace(/\.\./g, '');
    
    const fullPath = path.join(__dirname, 'public', filePath);
    
    try {
      const content = await fs.readFile(fullPath);
      
      // Set content type based on file extension
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      // File not found, serve 404
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
      } else {
        throw error;
      }
    }
  },
  
  /**
   * Handle chat API request
   */
  async handleChatRequest(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    
    req.on('end', async () => {
      try {
        const { message, chatId = 'default' } = JSON.parse(body);
        
        this.logger.info(`Received chat message: ${message.substring(0, 50)}...`);
        
        // Get or create chat session
        if (!this.chatSessions.has(chatId)) {
          this.chatSessions.set(chatId, {
            messages: [],
            title: message.substring(0, 50) + '...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        const session = this.chatSessions.get(chatId);
        
        // Add user message to session
        session.messages.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });
        
        session.updatedAt = new Date().toISOString();
        
        // Get AI response
        const aiResponse = await this.getAIResponse(message, session.messages);
        
        // Add assistant message to session
        session.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });
        
        // Save session
        await this.saveChatSession(chatId, session);
        
        // Return response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: aiResponse,
          chatId,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        this.logger.error(`Chat request error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  },
  
  /**
   * Get AI response from OpenClaw gateway HTTP API
   */
  async getAIResponse(message, history) {
    try {
      // OpenClaw gateway configuration
      const GATEWAY_URL = 'http://localhost:18789';
      const GATEWAY_TOKEN = 'cuiJY20130111'; // From openclaw.json
      const MODEL = 'openclaw/default';
      
      this.logger.info(`Sending to OpenClaw gateway: "${message.substring(0, 50)}..."`);
      
      // Prepare messages array for OpenAI-compatible API
      const messages = [];
      
      // Add recent history (limit to last 10 exchanges to avoid token limits)
      const maxHistory = 20; // 10 user + 10 assistant messages max
      const recentHistory = history.slice(-maxHistory);
      
      // Convert history to OpenAI format (strip timestamp field)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
      
      // Add the new user message
      messages.push({
        role: 'user',
        content: message
      });
      
      // Make HTTP request to OpenClaw gateway
      const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices in OpenClaw API response');
      }
      
      const aiResponse = data.choices[0].message.content;
      this.logger.info(`OpenClaw response: "${aiResponse.substring(0, 50)}..."`);
      
      return aiResponse;
      
    } catch (error) {
      this.logger.error(`OpenClaw API error: ${error.message}`);
      this.logger.warn('Falling back to simulated response');
      
      // Fallback to simulated responses
      const responses = [
        `I received your message: "${message}". This is a simulated response because OpenClaw API failed.`,
        `You said: "${message}". OpenClaw API error: ${error.message}`,
        `Thanks for your message! I'm NewChat. OpenClaw integration failed, using simulated response.`,
        `Message received: "${message}". OpenClaw error: ${error.message.substring(0, 100)}`
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    }
  },
  
  /**
   * Handle history API request
   */
  async handleHistoryRequest(req, res) {
    const sessions = Array.from(this.chatSessions.entries()).map(([id, session]) => ({
      id,
      title: session.title,
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions }));
  },
  
  /**
   * Handle save history request
   */
  async handleSaveHistory(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    
    req.on('end', async () => {
      try {
        const { chatId, messages, title } = JSON.parse(body);
        
        if (!chatId) {
          throw new Error('chatId is required');
        }
        
        const session = this.chatSessions.get(chatId) || {
          messages: [],
          title: title || 'New Chat',
          createdAt: new Date().toISOString()
        };
        
        if (messages) {
          session.messages = messages;
        }
        if (title) {
          session.title = title;
        }
        
        session.updatedAt = new Date().toISOString();
        
        this.chatSessions.set(chatId, session);
        await this.saveChatSession(chatId, session);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  },
  
  /**
   * Register with dashboard
   */
  async registerDashboardComponent() {
    const { dashboard, config } = this;
    
    // Use dashboard components library
    const components = dashboard.components;
    
    // Register component
    dashboard.registerComponent({
      modName: 'newchat',
      displayName: 'NewChat',
      icon: '🗨️',
      
      // Configuration panel - only port configuration
      configureComponents: [
        components.Input({
          label: 'Server Port',
          value: config.port || 3001,
          type: 'number',
          placeholder: 'Port for NewChat server (default: 3001)',
          onChange: (value) => this.updateConfig({ port: parseInt(value) || 3001 })
        })
      ],
      
      // Main panel - Launch interface
      mainRender: (panel) => this.renderLaunchInterface(panel),
      
      // Layout
      x: 0,
      y: 0,
      width: 6,
      height: 4,
      resizable: true,
      draggable: true
    });
    
    this.logger.info('NewChat component registered with dashboard');
  },
  
  /**
   * Render launch interface for dashboard
   */
  renderLaunchInterface(panel) {
    const port = this.config.port || 3001;
    const url = `http://localhost:${port}`;
    
    return `
      <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px; height: 100%;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; text-align: center; color: white;">
          <h3 style="margin: 0 0 8px 0;">NewChat Server</h3>
          <p style="margin: 0; opacity: 0.9;">Your personal AI chat interface</p>
        </div>
        
        <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <strong>Server Status:</strong>
              <span style="color: #10a37f; margin-left: 8px;">● Running</span>
            </div>
            <div style="font-size: 14px; color: #94a3b8;">Port: ${port}</div>
          </div>
          
          <div style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">
            NewChat is running and ready to use. Click the button below to open the chat interface in a new tab.
          </div>
          
          <a href="${url}" target="_blank" style="display: inline-block; width: 100%;">
            <button style="width: 100%; padding: 12px; background: #10a37f; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>🚀</span>
              Open NewChat Interface
            </button>
          </a>
        </div>
        
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; flex: 1;">
          <strong style="display: block; margin-bottom: 12px;">Quick Stats</strong>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #10a37f;">${this.chatSessions.size}</div>
              <div style="font-size: 12px; color: #94a3b8;">Chat Sessions</div>
            </div>
            <div style="background: #0f172a; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${this.getTotalMessages()}</div>
              <div style="font-size: 12px; color: #94a3b8;">Total Messages</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Get total messages across all sessions
   */
  getTotalMessages() {
    let total = 0;
    for (const session of this.chatSessions.values()) {
      total += session.messages.length;
    }
    return total;
  },
  
  /**
   * Update configuration
   */
  updateConfig(updates) {
    // TODO: Implement configuration persistence
    Object.assign(this.config, updates);
    this.logger.info(`Configuration updated: ${JSON.stringify(updates)}`);
    
    // If port changed, need to restart server
    if (updates.port && updates.port !== (this.config._originalPort || this.config.port)) {
      this.logger.info(`Port changed to ${updates.port}, server restart required`);
      // Note: In a real implementation, you would restart the server
      // For now, just show a warning in the UI
    }
  },
  
  /**
   * Send message via API (for other mods)
   */
  async sendMessage(message, options = {}) {
    const chatId = options.chatId || 'default';
    const session = this.chatSessions.get(chatId) || { messages: [] };
    
    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Get AI response
    const response = await this.getAIResponse(message, session.messages);
    
    // Add assistant message
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    this.chatSessions.set(chatId, session);
    await this.saveChatSession(chatId, session);
    
    return response;
  },
  
  /**
   * Cleanup on unload
   */
  async onUnload(context) {
    this.logger.info('NewChat mod unloading... 👋');
    
    // Stop the server
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      this.logger.info('NewChat server stopped');
    }
    
    // Clear state
    this.chatSessions.clear();
    this.server = null;
    
    this.logger.info('NewChat mod unloaded successfully');
  }
};