import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    openSWTFile: () => ipcRenderer.invoke('open-swt-file'),
    saveSWTFile: (filePath: string, content: string) =>
        ipcRenderer.invoke('save-swt-file', filePath, content),
    saveSWTFileAs: (content: string) =>
        ipcRenderer.invoke('save-swt-file-as', content)
});

declare global {
    interface Window {
        electronAPI?: {
            openSWTFile: () => Promise<{
                success: boolean;
                content?: string;
                filePath?: string;
                error?: string;
            }>;
            saveSWTFile: (filePath: string, content: string) => Promise<{
                success: boolean;
                error?: string;
            }>;
            saveSWTFileAs: (content: string) => Promise<{
                success: boolean;
                filePath?: string;
                error?: string;
            }>;
        };
    }
}
