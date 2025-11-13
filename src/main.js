const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, nativeImage, Notification } = require('electron');
const path = require('node:path');

// Set app name for notifications
app.setName('BGOS');

// Override the app name for notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('BGOS');
}

// Enable remote debugging for Chrome DevTools MCP integration
app.commandLine.appendSwitch('remote-debugging-port', '9222');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let tray = null;
let mainWindow = null;

const createWindow = () => {
  // Create the browser window.
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'src', 'assets', 'icon.ico')
    : path.join(__dirname, '..', '..', 'src', 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: '',
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      // Enable WebGL support
      experimentalFeatures: true,
      webAudio: true,
      // Enable WebGL
      webgl: true,
      // Enable hardware acceleration
      hardwareAcceleration: true,
      // Enable DevTools
      devTools: true,
    },
  });

  mainWindow.maximize();

  // Handle window close event - minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Create tray icon
  if (!tray) {
    // use icon.ico for system tray - works for both dev and production
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'icon.ico')
      : path.join(__dirname, '..', '..', 'src', 'assets', 'icon.ico');

    // Create and resize icon for system tray (16x16 is standard for Windows)
    let icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 16, height: 16 });
    }

    tray = new Tray(icon);

    tray.setToolTip('BGOS');
    
    // Create tray menu
    const trayMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          mainWindow.show();
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(trayMenu);
    
    // Click to show window
    tray.on('click', () => {
      mainWindow.show();
    });
  }

  // Remove the default menu bar - we're using a custom TitleBar component in React
  Menu.setApplicationMenu(null);

  // Set Content Security Policy to allow blob URLs
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'unsafe-inline' 'unsafe-eval' 'self' data: blob:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://api.elevenlabs.io; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "media-src 'self' data: blob:; " +
          "connect-src * data: blob:; " +
            "worker-src 'self' blob: data:; " +
            "child-src 'self' blob: data:; " +
            "object-src 'self' blob: data:;"
        ]
      }
    });
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Register keyboard shortcuts for DevTools
  globalShortcut.register('F12', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  // Ctrl+Shift+I (or Cmd+Option+I on macOS) for DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.openDevTools();
  });

  // Ctrl+Shift+C (or Cmd+Option+C on macOS) for element inspector
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    mainWindow.webContents.openDevTools();
    // Focus on Elements tab
    mainWindow.webContents.executeJavaScript(`
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // This will work if React DevTools are installed
        console.log('React DevTools available');
      }
    `);
  });

  // Reload app with Ctrl+R (or Cmd+R on macOS)
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow.reload();
  });

  // Hard reload with Ctrl+Shift+R (or Cmd+Shift+R on macOS)
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow.webContents.reloadIgnoringCache();
  });

  // Handle DevTools events
  mainWindow.webContents.on('devtools-opened', () => {
    console.log('DevTools opened');
  });

  mainWindow.webContents.on('devtools-closed', () => {
    console.log('DevTools closed');
  });

  // Handle window focus to ensure shortcuts work
  mainWindow.on('focus', () => {
    // Re-register shortcuts when window gains focus
    globalShortcut.register('F12', () => {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    });
  });
};

// Webhook handler main proc
ipcMain.handle('send-webhook-request', async (event, { url, formData }) => {
  try {
    console.log('Main process: Sending webhook request to:', url);
    
    // use fetch (Node.js 18+)
    const fetch = (await import('node-fetch')).default;
    
    // create FormData
    const FormData = require('form-data');
    const reconstructedFormData = new FormData();
    
    console.log('Main process: FormData received:', formData);
    console.log('Main process: FormData type:', typeof formData);
    console.log('Main process: FormData keys:', Object.keys(formData));
    
    for (const [key, value] of Object.entries(formData)) {
      if (value && typeof value === 'object' && value.type === 'blob') {
        // Convert base64 back to buffer
        const base64Data = value.data.split(',')[1]; // Remove data URL prefix
        const buffer = Buffer.from(base64Data, 'base64');
        reconstructedFormData.append(key, buffer, {
          filename: value.name || 'file',
          contentType: value.mimeType || 'application/octet-stream'
        });
      } else {
        reconstructedFormData.append(key, value);
      }
    }

    console.log('Main process: Sending reconstructed FormData');
    console.log('Main process: Sending FormData');

    const response = await fetch(url, {
      method: 'POST',
      body: reconstructedFormData,
      headers: {
        'User-Agent': 'Electron-App/1.0',
      },
    });

    console.log('Main process: Response status:', response.status);
    console.log('Main process: Response headers:', response.headers.raw());

    // Check if response is binary audio data
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const isAudioResponse = contentType && (
      contentType.includes('audio/') || 
      contentType.includes('application/octet-stream') ||
      contentType.includes('binary') ||
      contentType.includes('application/octet-stream')
    );

    console.log('Main process: Response analysis:', {
      contentType: contentType,
      contentLength: contentLength,
      isAudioResponse: isAudioResponse,
      status: response.status
    });

    if (isAudioResponse) {
      console.log('Main process: Detected binary audio response');
      
      // Get binary data as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log('Main process: Audio data size:', buffer.length, 'bytes');
      
      // Validate that we actually have data
      if (buffer.length === 0) {
        console.log('Main process: Empty audio buffer, treating as text response');
        const responseText = await response.text();
        return {
          type: 'text',
          data: responseText || ''
        };
      }
      
      // Return binary response
      return {
        type: 'audio',
        data: buffer.toString('base64'), // Convert to base64 for IPC
        contentType: contentType,
        audioFileName: `audio_response_${Date.now()}.mp3` // Default filename
      };
    } else {
      // Handle text response as before
      const responseText = await response.text();
      console.log('Main process: Full response body:', responseText);

      if (!response.ok) {
        console.log('Main process: Error response body:', responseText);
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}${responseText ? ' - ' + responseText : ''}`);
      }

      console.log('Main process: Webhook response received:', responseText);
      return {
        type: 'text',
        data: responseText
      };
    }
  } catch (error) {
    console.error('Main process: Webhook error:', error);
    throw error;
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (event) => {
  if (process.platform !== 'darwin') {
    event.preventDefault();
  }
});

// Clean up tray when app is quitting
app.on('before-quit', () => {
  app.isQuiting = true;
  if (tray) {
    tray.destroy();
  }
});

// IPC handlers for unread message notifications
ipcMain.handle('show-unread-notification', async (event, { chatId, chatTitle, unreadCount, assistantName }) => {
  try {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      console.log('Notifications not supported on this platform');
      return { success: false, error: 'Notifications not supported' };
    }

    // Create unique notification ID to avoid conflicts
    const notificationId = `unread-${chatId}-${Date.now()}`;

    // Icon path for notifications
    const notificationIconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'src', 'assets', 'icon.ico')
      : path.join(__dirname, '..', '..', 'src', 'assets', 'icon.ico');

    // Create notification
    const notification = new Notification({
      title: `New message from ${assistantName}`,
      body: `${unreadCount} an unread message in the chat "${chatTitle}"`,
      icon: notificationIconPath,
      silent: false, // Play default notification sound
      requireInteraction: false,
      tag: notificationId, // Use tag to replace notifications with same tag
      actions: [
        {
          type: 'button',
          text: 'open chat'
        }
      ]
    });

    // Handle notification click
    notification.on('click', () => {
      console.log('Notification clicked for chat:', chatId);
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // Send message to renderer to open specific chat
        mainWindow.webContents.send('open-chat-notification', { chatId });
      }
    });

    // Handle action button click
    notification.on('action', (event, index) => {
      if (index === 0) {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-chat-notification', { chatId });
        }
      }
    });

    // Handle notification close
    notification.on('close', () => {
    });

    notification.show();
    return { success: true };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('is-window-visible', async () => {
  if (!mainWindow) {
    return false;
  }
  // Check if window is visible and not minimized
  const isVisible = mainWindow.isVisible() && !mainWindow.isMinimized();
  return isVisible;
});

ipcMain.handle('focus-window', async () => {
  if (!mainWindow) {
    return false;
  }
  mainWindow.show();
  mainWindow.focus();
  return true;
});

// Window control IPC handlers for custom title bar
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('is-maximized', () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
  return false;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
