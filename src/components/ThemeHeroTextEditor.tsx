import { useEffect, useState } from 'react';
import { api, errorMessage, GALLERY_THEMES } from '../api/client';
import type { ServiceResponse, ThemeHeroText } from '../api/client';
import { X } from 'lucide-react';

const MAX_LENGTH = 200;

// Pop-up for one theme's hero message, prefilled with the saved message or else the theme's default.
export const ThemeHeroTextEditor = ({ theme, onClose }: { theme: number; onClose: () => void }) => {
  const [current, setCurrent] = useState<ThemeHeroText | null>(null);
  const [en, setEn] = useState('');
  const [ar, setAr] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ServiceResponse<ThemeHeroText[]>>('/SiteSettings/theme-hero-texts')
      .then(res => {
        const text = res.data.data?.find(t => t.theme === theme) ?? null;
        setCurrent(text);
        setEn(text?.heroTextEn ?? text?.defaultHeroTextEn ?? '');
        setAr(text?.heroTextAr ?? text?.defaultHeroTextAr ?? '');
      })
      .catch(err => {
        console.error(err);
        setError(errorMessage(err, 'Could not load the hero message'));
      });
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Text equal to the default (or empty) is sent as empty, so the theme stays on its default
  // and would pick up a changed default later instead of keeping an old copy of it.
  const asOverride = (text: string, fallback: string | undefined) =>
    text.trim() === '' || text.trim() === fallback ? '' : text;

  const save = async (nextEn: string, nextAr: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/SiteSettings/theme-hero-texts/${theme}`, {
        heroTextEn: asOverride(nextEn, current?.defaultHeroTextEn),
        heroTextAr: asOverride(nextAr, current?.defaultHeroTextAr),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, 'Could not save the hero message'));
      setSaving(false);
    }
  };

  const label = GALLERY_THEMES[theme]?.label ?? 'Theme';
  const disabled = current === null || saving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-text-title"
        className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 id="hero-text-title" className="text-xl font-serif text-rustic-brown">
            {label} hero message
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-nude-100">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-nude-700 mb-4">
          Shown under the hero title while the {label} theme is active. It starts with the theme's default; edit it as you like.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); save(en, ar); }} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1">English</span>
            <input
              type="text"
              lang="en"
              autoFocus
              maxLength={MAX_LENGTH}
              disabled={disabled}
              placeholder={current?.defaultHeroTextEn}
              value={en}
              onChange={(e) => setEn(e.target.value)}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Arabic</span>
            <input
              type="text"
              dir="rtl"
              lang="ar"
              maxLength={MAX_LENGTH}
              disabled={disabled}
              placeholder={current?.defaultHeroTextAr}
              value={ar}
              onChange={(e) => setAr(e.target.value)}
              className="input-field"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => { setEn(current?.defaultHeroTextEn ?? ''); setAr(current?.defaultHeroTextAr ?? ''); }}
              className="px-5 py-2 rounded border border-nude-300 text-rustic-brown hover:bg-nude-100 transition disabled:opacity-60"
            >
              Reset to default
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded border border-nude-300 text-gray-700 hover:bg-nude-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="bg-rustic-green text-white px-6 py-2 rounded hover:bg-opacity-90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
