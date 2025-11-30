const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notificationAPI', {
  // Receive notification data from main process
  onNotificationData: (callback) => {
    ipcRenderer.on('notification-data', (event, data) => callback(data));
  },

  // Notify main process that notification was clicked
  notificationClicked: (chatId) => {
    ipcRenderer.send('notification-clicked', chatId);
  },

  // Notify main process to close this notification
  notificationClosed: () => {
    ipcRenderer.send('notification-closed');
  },

  // Notify main process of hover state (to pause/resume timer)
  notificationHovered: (isHovered) => {
    ipcRenderer.send('notification-hovered', isHovered);
  }
});
