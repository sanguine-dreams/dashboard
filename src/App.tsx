import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageGallery } from './components/ImageGallery';
import { GalleryThemeSelector } from './components/GalleryThemeSelector';
import { GalleryTextEditor } from './components/GalleryTextEditor';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-nude-50 p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-serif text-rustic-brown">Floral Dashboard</h1>
        <p className="text-nude-700">Manage your collection</p>
      </header>

      <div className="max-w-6xl mx-auto mb-8 space-y-8">
        <GalleryThemeSelector />
        <GalleryTextEditor />
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ImageUploader onUploaded={() => setRefreshKey(k => k + 1)} />
        </div>
        <div className="lg:col-span-2">
          <ImageGallery refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
export default App;
