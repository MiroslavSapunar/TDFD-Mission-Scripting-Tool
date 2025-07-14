import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers for file operations
ipcMain.handle('open-swt-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'SWT Files', extensions: ['swt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return { success: true, content, filePath };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }
    return { success: false, error: 'No file selected' };
});

ipcMain.handle('save-swt-file', async (_event, filePath: string, content: string) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('save-swt-file-as', async (_event, content: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'SWT Files', extensions: ['swt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        try {
            await fs.writeFile(result.filePath, content, 'utf-8');
            return { success: true, filePath: result.filePath };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }
    return { success: false, error: 'Save cancelled' };
});
