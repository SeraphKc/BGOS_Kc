import React from 'react';
import { createRoot } from 'react-dom/client';
import NotificationPopup from './NotificationPopup';

const container = document.getElementById('notification-root');
if (container) {
  const root = createRoot(container);
  root.render(<NotificationPopup />);
}
