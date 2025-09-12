// import React from 'react';
import { createRoot } from 'react-dom/client';
import { IframeContent } from '@/components/Iframe/IframeContent';
import '@/styles/globals.css';

const container = document.getElementById('iframe-root');
if (container) {
  const root = createRoot(container);
  root.render(<IframeContent />);
}
