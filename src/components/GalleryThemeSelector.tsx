import { useEffect, useState } from 'react';
import { api, errorMessage, GALLERY_THEMES } from '../api/client';
import type { GalleryThemeSetting, ServiceResponse } from '../api/client';
import { Check, Pencil } from 'lucide-react';
import { ThemeHeroTextEditor } from './ThemeHeroTextEditor';

// Background, primary, heading and accent colours of each palette in gallery/src/index.css, same order as GALLERY_THEMES.
const SWATCHES = [
  ['#f7f3eb', '#5c6b56', '#8c735a', '#c9a962'],
  ['#f8f1e7', '#1e5631', '#a4161a', '#c9a227'],
  ['#fff0f5', '#d6336c', '#a61e4d', '#f783ac'],
  ['#f0f3f8', '#0b1f4b', '#c9a227', '#e9cf6b'],
  ['#fbeef1', '#efeaf8', '#e7f4ef', '#4a3b2a'],
];

export const GalleryThemeSelector = () => {
  const [active, setActive] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The theme whose hero message pop-up is open, if any.
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    api.get<ServiceResponse<GalleryThemeSetting>>('/SiteSettings/gallery-theme')
      .then(res => setActive(res.data.data?.theme ?? 0))
      .catch(err => {
        console.error(err);
        setError(errorMessage(err, 'Could not load the gallery theme'));
      });
  }, []);

  // Choosing a theme saves it, then opens its hero message pop-up. Default has no hero message.
  const choose = async (theme: number) => {
    if (saving !== null) return;
    if (theme === active) {
      if (theme !== 0) setEditing(theme);
      return;
    }
    setSaving(theme);
    setError(null);
    try {
      await api.put('/SiteSettings/gallery-theme', { theme });
      setActive(theme);
      if (theme !== 0) setEditing(theme);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, 'Could not save the gallery theme'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-nude-200">
      <h2 className="text-xl font-serif text-rustic-brown mb-1">Gallery Theme</h2>
      <p className="text-sm text-nude-700 mb-4">Changes the public gallery's colours, headline, hero message and default filter.</p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {GALLERY_THEMES.map((t, index) => {
          const isActive = index === active;
          return (
            <div key={t.key} className="relative">
              <button
                type="button"
                onClick={() => choose(index)}
                disabled={active === null || saving !== null}
                aria-pressed={isActive}
                className={`w-full rounded-lg border p-3 text-left transition disabled:cursor-wait ${
                  isActive ? 'border-rustic-green ring-2 ring-rustic-green' : 'border-nude-200 hover:border-nude-400'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {SWATCHES[index].map(color => (
                    <span key={color} className="h-5 flex-1 rounded" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-gray-800">
                  {t.label}
                  {isActive && <Check size={16} className="text-rustic-green" aria-label="Active" />}
                </span>
                {saving === index && <span className="block text-xs text-nude-600">Saving...</span>}
              </button>
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setEditing(index)}
                  aria-label={`Edit the ${t.label} hero message`}
                  title="Edit hero message"
                  className="absolute bottom-2 right-2 p-1 rounded text-nude-600 hover:bg-nude-100 hover:text-rustic-brown"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editing !== null && <ThemeHeroTextEditor key={editing} theme={editing} onClose={() => setEditing(null)} />}
    </section>
  );
};
