import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { GalleryText, ServiceResponse } from '../api/client';

const MAX_LENGTH = 200;

interface Draft {
  bannerTextEn: string;
  bannerTextAr: string;
  // A datetime-local value in the browser's time zone, e.g. "2026-11-14T18:00"; empty means no expiry.
  expiresLocal: string;
}

const EMPTY: Draft = { bannerTextEn: '', bannerTextAr: '', expiresLocal: '' };

const pad = (n: number) => String(n).padStart(2, '0');

// UTC ISO from the API -> the local "YYYY-MM-DDTHH:mm" a datetime-local input expects.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// A datetime-local value is read as local time; toISOString converts it to UTC with a "Z".
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

// The news strip that scrolls under the gallery's hero and header band. Independent of the theme.
export const GalleryTextEditor = () => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [expired, setExpired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    api.get<ServiceResponse<GalleryText>>('/SiteSettings/gallery-text')
      .then(res => {
        const data = res.data.data;
        setDraft({
          bannerTextEn: data?.bannerTextEn ?? '',
          bannerTextAr: data?.bannerTextAr ?? '',
          expiresLocal: toLocalInput(data?.bannerExpiresAt ?? null),
        });
        setExpired(!!data?.bannerExpiresAt && new Date(data.bannerExpiresAt).getTime() <= Date.now());
      })
      .catch(err => {
        console.error(err);
        setDraft(EMPTY);
        setStatus({ ok: false, message: errorMessage(err, 'Could not load the current message') });
      });
  }, []);

  const update = (patch: Partial<Draft>) => setDraft(prev => (prev ? { ...prev, ...patch } : prev));

  const save = async (next: Draft) => {
    setSaving(true);
    setStatus(null);
    try {
      await api.put('/SiteSettings/gallery-text', {
        bannerTextEn: next.bannerTextEn,
        bannerTextAr: next.bannerTextAr,
        bannerExpiresAt: toIso(next.expiresLocal),
      });
      // Clearing the message clears its expiry on the server too.
      const cleared = !next.bannerTextEn.trim() && !next.bannerTextAr.trim();
      setDraft(cleared ? EMPTY : next);
      setExpired(false);
      setStatus({ ok: true, message: 'Saved. Refresh the gallery to see it.' });
    } catch (err) {
      console.error(err);
      setStatus({ ok: false, message: errorMessage(err, 'Could not save the message') });
    } finally {
      setSaving(false);
    }
  };

  const disabled = draft === null || saving;

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-nude-200">
      <h2 className="text-xl font-serif text-rustic-brown mb-1">News Strip</h2>
      <p className="text-sm text-nude-700 mb-4">
        A scrolling message under the gallery's header, shown in every theme. Leave both fields empty to hide it.
        If the Arabic field is empty, Arabic visitors see the English message.
      </p>

      {expired && (
        <p className="mb-4 text-sm text-red-600">This message has expired and is no longer shown. Set a new time or clear it.</p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); if (draft) save(draft); }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <label className="block">
          <span className="block text-sm font-medium mb-1">English</span>
          <input
            type="text"
            lang="en"
            maxLength={MAX_LENGTH}
            disabled={disabled}
            value={draft?.bannerTextEn ?? ''}
            onChange={(e) => update({ bannerTextEn: e.target.value })}
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
            value={draft?.bannerTextAr ?? ''}
            onChange={(e) => update({ bannerTextAr: e.target.value })}
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Show until (optional)</span>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              disabled={disabled}
              value={draft?.expiresLocal ?? ''}
              onChange={(e) => update({ expiresLocal: e.target.value })}
              className="input-field"
            />
            {draft?.expiresLocal && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => update({ expiresLocal: '' })}
                className="px-3 rounded border border-nude-300 text-sm text-rustic-brown hover:bg-nude-100 transition"
              >
                No expiry
              </button>
            )}
          </div>
          <span className="block mt-1 text-xs text-nude-600">Your local time. The strip disappears by itself after this.</span>
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="bg-rustic-green text-white px-6 py-2 rounded hover:bg-opacity-90 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => save(EMPTY)}
            className="px-6 py-2 rounded border border-nude-300 text-rustic-brown hover:bg-nude-100 transition disabled:opacity-60"
          >
            Clear
          </button>
          {status && (
            <span className={`text-sm ${status.ok ? 'text-rustic-green' : 'text-red-600'}`}>{status.message}</span>
          )}
        </div>
      </form>
    </section>
  );
};
