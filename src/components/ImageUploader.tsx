import { useState } from 'react';
import { api, errorMessage } from '../api/client';
import { TagSelector } from './TagSelector';
import { Upload, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

const MAX_BYTES = 10 * 1024 * 1024;
const PARALLEL_UPLOADS = 3;

type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed';

interface UploadResult {
  name: string;
  status: UploadStatus;
  message?: string;
}

const StatusIcon = ({ status }: { status: UploadStatus }) => {
  switch (status) {
    case 'queued': return <Clock size={14} className="text-nude-500 shrink-0" />;
    case 'uploading': return <Loader2 size={14} className="text-rustic-brown animate-spin shrink-0" />;
    case 'done': return <CheckCircle2 size={14} className="text-rustic-green shrink-0" />;
    case 'failed': return <XCircle size={14} className="text-red-500 shrink-0" />;
  }
};

export const ImageUploader = ({ onUploaded }: { onUploaded: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<number[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(false);

  const setResult = (index: number, update: Partial<UploadResult>) =>
    setResults(prev => prev.map((r, i) => (i === index ? { ...r, ...update } : r)));

  const uploadOne = async (file: File, index: number) => {
    if (file.size > MAX_BYTES) {
      setResult(index, { status: 'failed', message: 'Larger than 10MB' });
      return;
    }

    const formData = new FormData();
    formData.append('File', file);
    if (caption.trim()) formData.append('Caption', caption.trim());
    tags.forEach(tag => formData.append('Tags', String(tag)));

    setResult(index, { status: 'uploading' });
    try {
      await api.post('/GalleryImage', formData);
      setResult(index, { status: 'done' });
    } catch (err) {
      console.error(err);
      setResult(index, { status: 'failed', message: errorMessage(err, 'Upload failed') });
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (files.length === 0 || tags.length === 0) {
      alert('Choose at least one image and at least one tag.');
      return;
    }

    const batch = files;
    setResults(batch.map(f => ({ name: f.name, status: 'queued' })));
    setLoading(true);

    // A few workers share one queue, so at most PARALLEL_UPLOADS requests are in flight.
    const queue = batch.map((file, index) => ({ file, index }));
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        await uploadOne(next.file, next.index);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, batch.length) }, worker));

    setLoading(false);
    setFiles([]);
    form.reset();
    onUploaded();
  };

  const doneCount = results.filter(r => r.status === 'done').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-sm border border-nude-200">
      <h2 className="text-xl font-serif text-rustic-brown mb-4">Upload Flowers</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tags</label>
        <TagSelector selected={tags} onChange={setTags} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="input-field"
          placeholder="Optional, applied to every image"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Images</label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-nude-200 file:text-rustic-brown
            hover:file:bg-nude-300"
        />
        {files.length > 0 && (
          <p className="mt-1 text-xs text-nude-700">{files.length} selected</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-rustic-green text-white py-2 rounded hover:bg-opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? `Uploading ${doneCount + failedCount} of ${results.length}...`
          : <><Upload size={18} /> Upload {files.length > 1 ? `${files.length} Images` : 'Image'}</>}
      </button>

      {results.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-rustic-brown mb-2">
            {doneCount} uploaded{failedCount > 0 && `, ${failedCount} failed`}
          </p>
          <ul className="max-h-60 overflow-y-auto space-y-1 text-xs">
            {results.map((r, i) => (
              <li key={i} className="flex items-center gap-2 min-w-0">
                <StatusIcon status={r.status} />
                <span className="truncate">{r.name}</span>
                {r.message && <span className="text-red-500 shrink-0">{r.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};
