# NewChat Mod for OpenClaw

A simple, beautiful chat interface mod for OpenClaw with dashboard integration. Featuring a ChatGPT/DeepSeek-like web interface with sidebar chat history and dark/light theme support.

## Features

- **Beautiful Chat Interface**: ChatGPT/DeepSeek-like design with dark/light theme support
- **Sidebar Chat History**: Easy access to all your conversations
- **Dashboard Integration**: Full integration with CSIS Dashboard
- **Simple Configuration**: Only port configuration needed
- **Theme Switching**: One-click dark/light theme toggle
- **Responsive Design**: Works on desktop and mobile devices

## Screenshots

### Dark Theme (Default)
![Dark Theme](https://via.placeholder.com/800x450/202123/ECEFF1?text=Dark+Theme+Chat+Interface)

### Light Theme  
![Light Theme](https://via.placeholder.com/800x450/F7F7F8/1F2937?text=Light+Theme+Chat+Interface)

### Dashboard Integration
![Dashboard](https://via.placeholder.com/800x450/343541/ECEFF1?text=CSIS+Dashboard+Integration)

## Quick Start

### Prerequisites
- OpenClaw installed and running
- CSIS Dashboard mod enabled
- roter mod manager available

### Recommended Installation (via roter)
```bash
# Install NewChat mod directly from GitHub
roter install github:cuiJY-still-in-school/CSIS-newchat --force

# Enable the mod
roter enable newchat

# Restart OpenClaw if needed
openclaw restart
```

### Alternative Installation Methods

#### Download with curl (for manual installation)
```bash
# Download the mod archive
curl -L https://github.com/cuiJY-still-in-school/CSIS-newchat/archive/refs/heads/master.tar.gz -o newchat.tar.gz

# Extract and install
tar -xzf newchat.tar.gz
cd CSIS-newchat-master
roter install $(pwd) --force
```

#### Development Installation (from source)
```bash
# Clone the repository
git clone git@github.com:cuiJY-still-in-school/CSIS-newchat.git
cd CSIS-newchat

# Install via roter
roter install $(pwd) --force
```

## Configuration

NewChat is designed to be simple and beautiful. The only configuration needed is:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `port` | number | `3001` | Port for the NewChat web server |

## Dashboard Integration

NewChat integrates seamlessly with the CSIS Dashboard:

### Main Panel
- **Server Status**: Shows if NewChat server is running
- **Launch Button**: One-click access to the chat interface
- **Quick Stats**: Shows chat sessions and total messages
- **Direct Link**: Opens NewChat in a new tab

### Configure Panel
- **Port Configuration**: Set the port NewChat runs on
- **Simple Setup**: No complex API keys or model selection needed

## Usage

1. **Install and enable the mod**:
   ```bash
   roter install github:cuiJY-still-in-school/CSIS-newchat --force
   roter enable newchat
   ```

2. **Access via Dashboard**:
   - Open CSIS Dashboard at `http://localhost:3000`
   - Find the NewChat component
   - Click "Open NewChat Interface"

3. **Start Chatting**:
   - Type your message and press Enter
   - Switch between dark/light theme using the button in sidebar
   - Create new chats using the "+ New Chat" button
   - View your chat history in the sidebar

## Theme Features

### Dark Theme (Default)
- Sidebar: `#202123`
- Main background: `#343541` 
- User messages: `#444654`
- Assistant messages: `#343541`
- Text: `#ececf1`
- Accent color: `#10a37f`

### Light Theme
- Sidebar: `#f7f7f8`
- Main background: `#ffffff`
- User messages: `#f7f7f8`
- Assistant messages: `#ffffff`
- Text: `#1f2937`
- Accent color: `#10a37f`

## Project Structure

```
newchat/
├── index.js              # Main mod entry point (HTTP server + dashboard integration)
├── manifest.json         # Mod metadata and dependencies
├── config/
│   └── schema.json      # Simple port configuration schema
├── public/
│   └── index.html       # Beautiful chat interface with dark/light themes
├── README.md            # This documentation
└── .gitignore           # Git ignore rules
```

## Extending NewChat

### Adding Features

1. **Real AI Integration**:
   - Implement `getAIResponse()` method with actual API calls
   - Add configuration options for API keys and endpoints

2. **Enhanced UI Features**:
   - Message editing/deletion
   - Chat export/import
   - Search functionality
   - Voice input/output

3. **Advanced Features**:
   - Multiple chat rooms
   - User authentication
   - File attachments
   - Markdown formatting

## Dependencies

- **dashboard** (^1.0.0): Required for GUI interface
- **OpenClaw** (>=2026.4.0): Required runtime environment

## License

MIT License

## Support

For issues and feature requests, please open an issue on GitHub:
https://github.com/cuiJY-still-in-school/CSIS-newchat/issues

