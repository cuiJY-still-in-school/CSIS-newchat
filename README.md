# NewChat Mod for OpenClaw

A chat interface mod for OpenClaw with dashboard integration, featuring AI model integration and real-time messaging.

## Features

- **Dashboard Integration**: Full integration with CSIS Dashboard for GUI
- **AI Model Support**: Multiple AI model options (DeepSeek, GPT-4, Claude, local)
- **Real-time Chat**: Interactive chat interface with message history
- **Configurable**: Extensive configuration options via dashboard
- **Streaming Responses**: Optional streaming responses for better UX

## Installation

### From Source
```bash
# Clone the repository
git clone <repository-url>
cd newchat

# Install via roter (from local path)
roter install ./ --force
```

### From GitHub
```bash
roter install github:cuiJY-still-in-school/CSIS-newchat --force
```

## Configuration

NewChat provides the following configuration options:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `model` | string | `deepseek-chat` | AI model to use |
| `apiKey` | string | (empty) | API key for the selected model |
| `apiEndpoint` | string | `https://api.deepseek.com` | API endpoint URL |
| `streaming` | boolean | `true` | Enable streaming responses |
| `systemPrompt` | string | `You are a helpful assistant.` | System prompt for AI |
| `maxHistory` | number | `50` | Maximum messages in history |
| `temperature` | number | `0.7` | Temperature for generation |
| `enableVoice` | boolean | `false` | Enable voice input/output |
| `autoConnect` | boolean | `true` | Auto-connect on startup |

## Dashboard Integration

NewChat integrates with the CSIS Dashboard providing:

### Configuration Panel (Left)
- Model selection dropdown
- API key input (password protected)
- System prompt editor
- Streaming toggle
- Advanced settings

### Main Panel (Right)
- Chat history display
- Message input field
- Send button
- Real-time message streaming
- History management

## Usage

1. **Enable the mod**:
   ```bash
   roter enable newchat
   ```

2. **Configure via Dashboard**:
   - Open Dashboard at `http://localhost:3000`
   - Find NewChat component
   - Configure your AI model and API key
   - Start chatting!

3. **API Access** (for other mods):
   ```javascript
   const newchat = context.require('newchat');
   
   // Send a message
   const response = await newchat.sendMessage("Hello!");
   
   // Get chat history
   const history = newchat.getHistory();
   
   // Clear history
   newchat.clearHistory();
   ```

## Development

### Project Structure
```
newchat/
├── index.js              # Main mod entry point
├── manifest.json         # Mod metadata
├── config/
│   └── schema.json      # Configuration schema
├── README.md            # This file
└── package.json         # Dependencies (if needed)
```

### Adding New Features

1. **New AI Model Integration**:
   - Add model to `config/schema.json` enum
   - Implement API client in `index.js`
   - Update dashboard configuration panel

2. **UI Enhancements**:
   - Modify `renderChatInterface()` method
   - Add new dashboard components
   - Implement event handlers

3. **Extended Features**:
   - File upload support
   - Voice interaction
   - Multi-user chat rooms
   - Plugin system for custom commands

## Dependencies

- **dashboard** (^1.0.0): Required for GUI interface
- **OpenClaw** (>=2026.4.0): Required runtime

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.