const { BrowserWindow, screen, ipcMain } = require('electron');

class NotificationManager {
  constructor(mainWindow, preloadEntry, rendererEntry) {
    this.mainWindow = mainWindow;
    this.preloadEntry = preloadEntry;
    this.rendererEntry = rendererEntry;
    this.notifications = []; // Array of { window, timeout, isPaused, startTime, remainingTime, data }
    this.maxNotifications = 4;
    this.notificationWidth = 380;
    this.notificationHeight = 110;
    this.margin = 16;
    this.gap = 8;

    this.setupIpcHandlers();
  }

  setupIpcHandlers() {
    // Handle notification click
    ipcMain.on('notification-clicked', (event, chatId) => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
        this.mainWindow.webContents.send('open-chat-notification', { chatId });
      }
      this.closeNotificationByWebContents(event.sender);
    });

    // Handle notification close button
    ipcMain.on('notification-closed', (event) => {
      this.closeNotificationByWebContents(event.sender);
    });

    // Handle hover state
    ipcMain.on('notification-hovered', (event, isHovered) => {
      this.setHovered(event.sender, isHovered);
    });
  }

  async showNotification(data) {
    try {
      // Remove oldest if at max
      if (this.notifications.length >= this.maxNotifications) {
        this.closeNotificationByWebContents(this.notifications[0].window.webContents);
      }

      const position = this.calculatePosition(this.notifications.length);

      const notificationWindow = new BrowserWindow({
        width: this.notificationWidth,
        height: this.notificationHeight,
        x: position.x,
        y: position.y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        focusable: false,
        show: false,
        webPreferences: {
          preload: this.preloadEntry,
          contextIsolation: true,
          nodeIntegration: false,
        }
      });

      // Load notification renderer
      await notificationWindow.loadURL(this.rendererEntry);

      // Send data to notification window
      notificationWindow.webContents.send('notification-data', data);

      // Show without stealing focus
      notificationWindow.showInactive();

      // Set up entry with timer
      const entry = {
        window: notificationWindow,
        data,
        timeout: null,
        isPaused: false,
        startTime: Date.now(),
        remainingTime: 5000 // 5 seconds
      };

      this.startDismissTimer(entry);
      this.notifications.push(entry);

      // Handle window close
      notificationWindow.on('closed', () => {
        const index = this.notifications.findIndex(n => n.window === notificationWindow);
        if (index !== -1) {
          clearTimeout(this.notifications[index].timeout);
          this.notifications.splice(index, 1);
          this.repositionNotifications();
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error showing custom notification:', error);
      return { success: false, error: error.message };
    }
  }

  calculatePosition(index) {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    const stackOffset = (this.notificationHeight + this.gap) * index;

    return {
      x: width - this.notificationWidth - this.margin,
      y: height - this.notificationHeight - this.margin - stackOffset
    };
  }

  startDismissTimer(entry) {
    entry.timeout = setTimeout(() => {
      this.closeNotificationByWindow(entry.window);
    }, entry.remainingTime);
    entry.startTime = Date.now();
  }

  setHovered(webContents, isHovered) {
    const entry = this.notifications.find(n => n.window.webContents === webContents);
    if (!entry) return;

    if (isHovered && !entry.isPaused) {
      // Pause timer
      clearTimeout(entry.timeout);
      entry.remainingTime -= (Date.now() - entry.startTime);
      entry.isPaused = true;
    } else if (!isHovered && entry.isPaused) {
      // Resume timer
      entry.isPaused = false;
      this.startDismissTimer(entry);
    }
  }

  closeNotificationByWebContents(webContents) {
    const entry = this.notifications.find(n => n.window.webContents === webContents);
    if (entry) {
      this.closeNotificationByWindow(entry.window);
    }
  }

  closeNotificationByWindow(window) {
    const index = this.notifications.findIndex(n => n.window === window);
    if (index === -1) return;

    const entry = this.notifications[index];
    clearTimeout(entry.timeout);

    try {
      if (!entry.window.isDestroyed()) {
        entry.window.close();
      }
    } catch (e) {
      // Window might already be closed
    }

    this.notifications.splice(index, 1);
    this.repositionNotifications();
  }

  repositionNotifications() {
    this.notifications.forEach((entry, index) => {
      if (!entry.window.isDestroyed()) {
        const position = this.calculatePosition(index);
        entry.window.setPosition(position.x, position.y, true);
      }
    });
  }

  closeAll() {
    this.notifications.forEach(entry => {
      clearTimeout(entry.timeout);
      try {
        if (!entry.window.isDestroyed()) {
          entry.window.close();
        }
      } catch (e) {
        // Window might already be closed
      }
    });
    this.notifications = [];
  }

  // Update main window reference
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }
}

module.exports = { NotificationManager };
