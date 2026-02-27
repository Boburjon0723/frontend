const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged;

// Register 'app' as a standard and secure scheme
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Essential for local resource loading in some cases
            preload: path.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#050505',
    });

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        // Use absolute-like path within our protocol
        win.loadURL('app://./index.html');
    }
}

app.whenReady().then(() => {
    // Handle the 'app://' protocol
    protocol.handle('app', async (request) => {
        let url = new URL(request.url);
        let pathname = url.pathname;

        // Remove leading dots/slashes to normalize
        let normalizedPath = pathname;
        if (normalizedPath.startsWith('//')) normalizedPath = normalizedPath.slice(2);
        if (normalizedPath.startsWith('./')) normalizedPath = normalizedPath.slice(2);
        if (normalizedPath.startsWith('/')) normalizedPath = normalizedPath.slice(1);

        // Default to index.html
        if (normalizedPath === '' || normalizedPath === '/') {
            normalizedPath = 'index.html';
        }

        // Check if it's a directory-like route (no extension)
        // Next.js uses trailingslashes/directories for pages
        if (!path.extname(normalizedPath) && !normalizedPath.endsWith('/')) {
            normalizedPath += '/index.html';
        } else if (normalizedPath.endsWith('/')) {
            normalizedPath += 'index.html';
        }

        const fullPath = path.join(__dirname, '../out', normalizedPath);

        try {
            return net.fetch(pathToFileURL(fullPath).toString());
        } catch (error) {
            console.error(`Protocol error for ${request.url}:`, error);
            // Fallback to main index.html for SPA routing if file not found
            const indexPath = path.join(__dirname, '../out/index.html');
            return net.fetch(pathToFileURL(indexPath).toString());
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
