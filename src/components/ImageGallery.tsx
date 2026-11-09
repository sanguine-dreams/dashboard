import { useEffect, useState } from 'react';
import { api, errorMessage, fileUrl, IMAGE_TAGS } from '../api/client';
import type { GalleryImage, ServiceResponse } from '../api/client';
import { Trash2, Edit } from 'lucide-react';

export const ImageGallery = ({ refreshKey }: { refreshKey: number }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api.get<ServiceResponse<GalleryImage[]>>('/GalleryImage')
      .then(res => {
        if (ignore) return;
        setImages(res.data.data ?? []);
        setError(null);
      })
      .catch(err => {
        if (ignore) return;
        console.error(err);
        setError(errorMessage(err, 'Could not load images'));
      });
    return () => { ignore = true; };
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/GalleryImage/${id}`);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
      console.error(err);
      alert(errorMessage(err, 'Delete failed'));
    }
  };

  if (error) {
    return <p className="mt-8 text-red-600">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {images.map(img => (
        <div key={img.id} className="relative group bg-white rounded-lg overflow-hidden shadow-sm border border-nude-200">
          <img src={fileUrl(img.imageUrl)} alt={img.caption ?? 'Flower'} className="w-full h-64 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button className="bg-white p-2 rounded-full shadow hover:bg-nude-100">
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(img.id)}
              className="bg-white p-2 rounded-full shadow hover:bg-red-50 text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="p-3 bg-nude-50">
            {img.caption && <p className="text-sm text-gray-700 mb-1">{img.caption}</p>}
            <p className="text-xs text-rustic-brown font-semibold uppercase tracking-wider">
              {img.tags.map(t => IMAGE_TAGS[t]).join(' · ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
