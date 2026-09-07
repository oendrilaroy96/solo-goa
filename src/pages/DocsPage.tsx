import { useState, useEffect, useRef } from 'react';
import { CATEGORY_LABELS, CATEGORY_ICON } from '../data/documents';
import type { DocCategory } from '../data/documents';
import { supabase } from '../lib/supabase';

interface RemoteDoc {
  id: string;
  label: string;
  sublabel: string;
  category: DocCategory;
  filename: string;
  created_at: string;
}

const CATEGORY_ORDER: DocCategory[] = ['flight', 'train', 'hotel', 'cab', 'activity', 'payment'];

function isPdfName(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf');
}

function publicUrl(filename: string): string {
  const { data } = supabase.storage.from('docs').getPublicUrl(filename);
  return data.publicUrl;
}

interface Props {
  autoOpenLabel?: string | null;
  onAutoOpenHandled?: () => void;
}

export default function DocsPage({ autoOpenLabel, onAutoOpenHandled }: Props) {
  const [docs, setDocs]         = useState<RemoteDoc[]>([]);
  const [viewing, setViewing]   = useState<RemoteDoc | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [label, setLabel]       = useState('');
  const [sublabel, setSublabel] = useState('');
  const [category, setCategory] = useState<DocCategory>('flight');
  const fileRef = useRef<HTMLInputElement>(null);

  function fetchDocs() {
    supabase.from('documents').select('*').order('created_at').then(({ data }) => {
      if (data) setDocs(data as RemoteDoc[]);
    });
  }

  useEffect(() => { fetchDocs(); }, []);

  // Auto-open a doc by label when navigated from the itinerary
  useEffect(() => {
    if (!autoOpenLabel || !docs.length) return;
    const match = docs.find(d => d.label === autoOpenLabel);
    if (match) {
      setViewing(match);
      onAutoOpenHandled?.();
    }
  }, [autoOpenLabel, docs, onAutoOpenHandled]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !label.trim()) { setError('Please choose a file and enter a label.'); return; }
    setError(null);
    setUploading(true);

    const ext      = file.name.split('.').pop() ?? 'bin';
    const filename = `${Date.now()}-${label.trim().replace(/\s+/g, '-').toLowerCase()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('docs').upload(filename, file, { upsert: false });
    if (uploadErr) { setError(uploadErr.message); setUploading(false); return; }

    const { error: dbErr } = await supabase.from('documents').insert({
      label: label.trim(),
      sublabel: sublabel.trim(),
      category,
      filename,
    });
    if (dbErr) { setError(dbErr.message); setUploading(false); return; }

    setUploading(false);
    setLabel('');
    setSublabel('');
    setCategory('flight');
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(false);
    fetchDocs();
  }

  async function handleDelete(doc: RemoteDoc) {
    await supabase.storage.from('docs').remove([doc.filename]);
    await supabase.from('documents').delete().eq('id', doc.id);
    if (viewing?.id === doc.id) setViewing(null);
    fetchDocs();
  }

  const grouped: Partial<Record<DocCategory, RemoteDoc[]>> = {};
  for (const d of docs) {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category]!.push(d);
  }
  const presentCategories = CATEGORY_ORDER.filter(cat => grouped[cat]?.length);

  return (
    <section>
      <div className="gold-line mb-8" />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <h2
            className="m-0 mb-1 text-[22px]"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
          >
            Documents
          </h2>
          <p className="mt-1 mb-0 text-[13px] leading-relaxed" style={{ color: '#8a8070' }}>
            Tickets, confirmations &amp; receipts
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(f => !f); setError(null); }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#c9a84c',
            background: 'rgba(201,168,76,.1)',
            border: '1px solid rgba(201,168,76,.3)',
            borderRadius: 3,
            padding: '7px 14px',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div
          className="luxury-card"
          style={{ padding: '20px', marginBottom: 32, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Label *
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. IndiGo 6E 634 — Kolkata → Goa"
              style={{
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 2,
                padding: '8px 12px',
                color: '#f5f0e8',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sublabel
            </label>
            <input
              type="text"
              value={sublabel}
              onChange={e => setSublabel(e.target.value)}
              placeholder="e.g. 14 September · Ticket"
              style={{
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 2,
                padding: '8px 12px',
                color: '#f5f0e8',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DocCategory)}
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 2,
                  padding: '8px 12px',
                  color: '#f5f0e8',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {CATEGORY_ORDER.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_ICON[cat]} {CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                File *
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 2,
                  padding: '6px 12px',
                  color: '#8a8070',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#e07070', fontSize: 12, margin: 0 }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: uploading ? '#8a8070' : '#0d0d0d',
              background: uploading ? 'rgba(201,168,76,.2)' : '#c9a84c',
              border: 'none',
              borderRadius: 3,
              padding: '10px 20px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-end',
            }}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}

      {docs.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#8a8070', marginTop: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <p style={{ fontSize: 14, marginBottom: 8, color: '#f5f0e8' }}>No documents yet</p>
          <p style={{ fontSize: 13, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            Tap <strong style={{ color: '#c9a84c' }}>+ Add</strong> to upload a PDF or image — it'll sync to all your devices.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: showForm ? 0 : 24 }}>
          {presentCategories.map(cat => (
            <div key={cat}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#c9a84c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span aria-hidden="true">{CATEGORY_ICON[cat]}</span>
                {CATEGORY_LABELS[cat]}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[cat]!.map(doc => (
                  <div
                    key={doc.id}
                    className="luxury-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#f5f0e8',
                          marginBottom: 3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {doc.label}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#8a8070' }}>{doc.sublabel}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setViewing(doc)}
                        aria-label={`View ${doc.label}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#c9a84c',
                          background: 'rgba(201,168,76,.1)',
                          border: '1px solid rgba(201,168,76,.3)',
                          borderRadius: 3,
                          padding: '5px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                      <a
                        href={publicUrl(doc.filename)}
                        download={doc.label}
                        aria-label={`Download ${doc.label}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#8a8070',
                          background: 'rgba(255,255,255,.04)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 3,
                          padding: '5px 12px',
                          textDecoration: 'none',
                          display: 'inline-block',
                          lineHeight: 'normal',
                        }}
                      >
                        ↓
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc)}
                        aria-label={`Delete ${doc.label}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#8a8070',
                          background: 'rgba(255,255,255,.04)',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 3,
                          padding: '5px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Full-screen viewer overlay ── */}
      {viewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${viewing.label}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,.92)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: '#c9a84c',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: 16,
              }}
            >
              {viewing.label}
            </span>
            <button
              type="button"
              onClick={() => setViewing(null)}
              aria-label="Close viewer"
              style={{
                background: 'none',
                border: 'none',
                color: '#c9a84c',
                fontSize: 24,
                lineHeight: 1,
                cursor: 'pointer',
                padding: '0 4px',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 16,
            }}
          >
            {isPdfName(viewing.filename) ? (
              <iframe
                src={publicUrl(viewing.filename)}
                title={viewing.label}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 4,
                  background: '#fff',
                }}
              />
            ) : (
              <img
                src={publicUrl(viewing.filename)}
                alt={viewing.label}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: 4,
                }}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
