// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  sendWebhookRequest: async (url, formDataObj) => {
    const response = await ipcRenderer.invoke('send-webhook-request', { url, formData: formDataObj });
    
    // Handle different response types
    if (response && response.type === 'audio') {
      try {
        // Convert base64 back to ArrayBuffer for audio data
        const binaryString = atob(response.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('Preload: Converted audio data, size:', bytes.length, 'bytes');
        
        return {
          type: 'audio',
          data: bytes.buffer,
          contentType: response.contentType,
          audioFileName: response.audioFileName
        };
      } catch (error) {
        console.error('Preload: Error converting audio data:', error);
        // Fallback to text response if conversion fails
        return {
          type: 'text',
          data: 'Error processing audio response: ' + error.message
        };
      }
    }
    
    return response;
  },
  
  // Notification API
  showUnreadNotification: async (notificationData) => {
    return await ipcRenderer.invoke('show-unread-notification', notificationData);
  },
  
  isWindowVisible: async () => {
    return await ipcRenderer.invoke('is-window-visible');
  },
  
  focusWindow: async () => {
    return await ipcRenderer.invoke('focus-window');
  },
  
  onOpenChatNotification: (callback) => {
    ipcRenderer.on('open-chat-notification', (event, data) => callback(data));
  },
  
  removeOpenChatNotificationListener: () => {
    ipcRenderer.removeAllListeners('open-chat-notification');
  }
});

// Expose window control methods for custom title bar
contextBridge.exposeInMainWorld('electron', {
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized')
});
