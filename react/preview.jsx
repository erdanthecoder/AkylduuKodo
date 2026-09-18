// preview.jsx — mounts the component on its own page. This is the entry the
// build bundles; the component itself has no opinion about how it is hosted.

import React from 'react';
import { createRoot } from 'react-dom/client';
import AkylduuKodoLesson from './AkylduuKodoLesson.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AkylduuKodoLesson onFinish={(stats) => console.log('finished', stats)} />
  </React.StrictMode>,
);
