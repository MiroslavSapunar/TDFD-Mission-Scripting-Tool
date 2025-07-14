# Terminator Mission Editor

A user-friendly desktop application for editing Terminator: Dark Fate mission scripts (.swt files) without manual XML editing.

## Features

- Visual SWT editing with tree-based interface
- Cross-platform support (Windows, Mac, Linux)
- Real-time preview of mission events
- Color-coded event types (events, triggers, actions)
- Safe file operations with XML preservation
- No installation required (portable executables)

## Quick Start

### For Users
1. Download from [Releases](../../releases)
2. Run the application:
   - **Windows**: `Terminator Mission Editor.exe`
   - **Mac**: Open the `.dmg` and drag to Applications
   - **Linux**: Make the `.AppImage` executable and run
3. Open an SWT file and start editing

### For Developers
```bash
git clone https://github.com/yourusername/terminator-mission-editor.git
cd terminator-mission-editor
npm install
npm run dev
```

Build executables:
```bash
npm run build

# Package for specific platforms
npm run package:win    # Windows portable exe
npm run package:mac    # macOS dmg (Intel + Apple Silicon)
npm run package:linux  # Linux AppImage

# Or build for all platforms
npm run package
```

## Usage

1. **Open**: Click "Open SWT" and select your mission file
2. **Edit**: Select events from tree view, modify in right panel
3. **Save**: Use Save or Save As (recommended for safety)

### Event Types
- 🔵 **Events** - Main mission events
- 🟡 **Triggers** - Conditions that activate events  
- 🟢 **Actions** - Specific actions to execute

## Tech Stack

- **Electron** + **React** + **TypeScript**
- **Vite** for fast builds and development
- **electron-builder** for cross-platform packaging
- Native file dialogs and XML parsing

## Project Structure
```
src/
├── main.ts      # Electron main process
├── App.tsx      # React UI
├── parser.ts    # SWT parsing logic
└── types.ts     # Type definitions
```

## Roadmap

**Phase 1** ✅ - Basic SWT editing, tree view, portable exe
**Phase 2** 🚧 - Visual flowchart mode, event relationships
**Phase 3** 📋 - SWP support, unit positioning, validation
**Phase 4** 🎮 - Game integration, quick testing

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

---

**Note**: Always backup original files before editing. Designed for Terminator: Dark Fate mission files.