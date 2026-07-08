"use client";

import { useEffect, useRef, useState } from "react";
import type { Client, PostWithPhotos, PostStatus } from "@/lib/types";
import type { Violation } from "@/lib/validate";
import {
  fetchClients,
  fetchPosts,
  insertClient,
  savePost,
  removePost,
  uploadPhoto,
  attachPhotos,
  removePhoto,
  type DraftPhoto,
  type PostInput,
} from "@/lib/data";

const STATUSES: PostStatus[] = ["Neu", "Entwurf", "Freigabe", "Geplant", "Live"];
const STAT_VAR: Record<string, string> = {
  Neu: "--dot-neu",
  Freigabe: "--dot-frei",
  Geplant: "--dot-plan",
  Live: "--dot-live",
  Entwurf: "--dot-ent",
};
const FORMATS = ["Story", "Feed", "Feed (Reel)", "Feed (Carousel)", "Reel"];
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MO = ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"];

function todayISO(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

type Form = {
  client_id: string;
  status: PostStatus;
  date: string;
  time: string;
  format: string;
  theme: string;
  caption: string;
};

type Suggestion = { caption: string; violations: Violation[] };

const EMPTY_FORM = (clientId: string): Form => ({
  client_id: clientId,
  status: "Neu",
  date: todayISO(),
  time: "08:00",
  format: "Story",
  theme: "",
  caption: "",
});

export default function Planner() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [posts, setPosts] = useState<PostWithPhotos[]>([]);
  const [view, setView] = useState<"list" | "cal">("list");
  const [month, setMonth] = useState<Date>(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM(""));
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<DraftPhoto[]>([]); // uploaded this session, post_id still null
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [aiSug, setAiSug] = useState<Suggestion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetAI() {
    setAiLoading(false);
    setAiErr("");
    setAiSug([]);
  }

  const activeClient = clients.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    (async () => {
      try {
        const cs = await fetchClients();
        setClients(cs);
        if (cs.length) setActiveId(cs[0].id);
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoadingClients(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setPosts([]);
      return;
    }
    let cancelled = false;
    setLoadingPosts(true);
    (async () => {
      try {
        const ps = await fetchPosts(activeId);
        if (!cancelled) setPosts(ps);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function reloadPosts() {
    if (!activeId) return;
    setPosts(await fetchPosts(activeId));
  }

  async function onAddClient() {
    const name = window.prompt("Name des neuen Kunden:");
    if (!name || !name.trim()) return;
    try {
      const c = await insertClient(name.trim());
      setClients((prev) => [...prev, c]);
      setActiveId(c.id);
    } catch (e) {
      setError(errMsg(e));
    }
  }

  // ---------- Sheet ----------
  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM(activeId));
    setDraftPhotos([]);
    setNewPhotos([]);
    resetAI();
    setSheetOpen(true);
  }

  function openEdit(p: PostWithPhotos) {
    setEditId(p.id);
    setForm({
      client_id: p.client_id,
      status: p.status,
      date: p.date,
      time: p.time ?? "",
      format: p.format ?? "Story",
      theme: p.theme ?? "",
      caption: p.caption ?? "",
    });
    setDraftPhotos(p.photos);
    setNewPhotos([]);
    resetAI();
    setSheetOpen(true);
  }

  async function closeSheet() {
    // Drop photos uploaded but never attached to a saved post.
    if (newPhotos.length) {
      await Promise.allSettled(newPhotos.map((ph) => removePhoto(ph)));
    }
    setSheetOpen(false);
    setNewPhotos([]);
  }

  async function onSave() {
    if (!form.date) {
      window.alert("Bitte ein Datum wählen.");
      return;
    }
    setSaving(true);
    try {
      const input: PostInput = {
        client_id: form.client_id,
        date: form.date,
        time: form.time || null,
        format: form.format || null,
        theme: form.theme || null,
        caption: form.caption || null,
        status: form.status,
      };
      const saved = await savePost(input, editId ?? undefined);
      if (newPhotos.length) await attachPhotos(saved.id, newPhotos.map((p) => p.id));
      setNewPhotos([]);
      setSheetOpen(false);
      if (form.client_id !== activeId) {
        setActiveId(form.client_id);
      } else {
        await reloadPosts();
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editId) return;
    if (!window.confirm("Post löschen?")) return;
    setSaving(true);
    try {
      await removePost(editId);
      setNewPhotos([]); // these belong to the deleted post now
      setSheetOpen(false);
      await reloadPosts();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ph = await uploadPhoto(file, form.client_id, editId ?? undefined);
        setDraftPhotos((prev) => [...prev, ph]);
        setNewPhotos((prev) => [...prev, ph]);
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onRemovePhoto(ph: DraftPhoto) {
    try {
      await removePhoto(ph);
      setDraftPhotos((prev) => prev.filter((x) => x.id !== ph.id));
      setNewPhotos((prev) => prev.filter((x) => x.id !== ph.id));
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function genAI() {
    setAiErr("");
    setAiSug([]);
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: form.client_id, format: form.format, theme: form.theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generierung fehlgeschlagen.");
      setAiSug(data.suggestions ?? []);
    } catch (e) {
      setAiErr(errMsg(e));
    } finally {
      setAiLoading(false);
    }
  }

  function applyCaption(caption: string) {
    setForm((f) => ({ ...f, caption }));
  }

  // ---------- Render ----------
  return (
    <div className="wrap">
      <header>
        <div className="hrow">
          <div className="logo">LN<span className="d">.</span><small>Planner</small></div>
          <div className="spacer" />
          <button className="add" onClick={openNew} disabled={loadingClients || !clients.length}>+ Post</button>
        </div>
        <div className="tabs">
          {clients.map((c) => (
            <div
              key={c.id}
              className={`ctab ${activeId === c.id ? "active" : ""}`}
              onClick={() => setActiveId(c.id)}
            >
              {c.name}
            </div>
          ))}
          <div className="ctab addc" onClick={onAddClient}>+ Kunde</div>
        </div>
      </header>

      <main>
        {error && (
          <div style={{ color: "var(--dot-frei)", fontSize: 13, marginBottom: 12 }}>
            Fehler: {error}
          </div>
        )}

        {loadingClients ? (
          <div className="loading">Lade …</div>
        ) : !clients.length ? (
          <div className="empty">
            <div className="big">Noch keine Kunden</div>
            Lege deinen ersten Kunden an, um zu starten.
          </div>
        ) : (
          <>
            <div className="meta">
              <b>{posts.length}</b> <span>{posts.length === 1 ? "Post" : "Posts"}</span>
              <div className="toggle">
                <span className={view === "list" ? "on" : ""} onClick={() => setView("list")}>Liste</span>
                <span className={view === "cal" ? "on" : ""} onClick={() => setView("cal")}>Kalender</span>
              </div>
            </div>

            {loadingPosts ? (
              <div className="loading">Lade Posts …</div>
            ) : view === "list" ? (
              <ListView posts={posts} activeName={activeClient?.name ?? ""} onOpen={openEdit} />
            ) : (
              <CalView posts={posts} month={month} setMonth={setMonth} onOpen={openEdit} />
            )}
          </>
        )}
      </main>

      <Sheet
        open={sheetOpen}
        isEdit={editId !== null}
        form={form}
        setForm={setForm}
        clients={clients}
        draftPhotos={draftPhotos}
        uploading={uploading}
        saving={saving}
        aiLoading={aiLoading}
        aiErr={aiErr}
        aiSug={aiSug}
        fileRef={fileRef}
        onFiles={onFiles}
        onRemovePhoto={onRemovePhoto}
        onGen={genAI}
        onApply={applyCaption}
        onCancel={closeSheet}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

function statusDot(s: string) {
  return <div className="dot" style={{ background: `var(${STAT_VAR[s] ?? "--dot-ent"})` }} />;
}

function ListView({
  posts,
  activeName,
  onOpen,
}: {
  posts: PostWithPhotos[];
  activeName: string;
  onOpen: (p: PostWithPhotos) => void;
}) {
  if (!posts.length)
    return (
      <div className="empty">
        <div className="big">Noch keine Posts</div>
        Tippe „+ Post“, um für {activeName} zu starten.
      </div>
    );

  const rows: React.ReactNode[] = [];
  let lastDay = "";
  for (const p of posts) {
    if (p.date !== lastDay) {
      lastDay = p.date;
      const dt = new Date(p.date + "T00:00");
      const isT = p.date === todayISO();
      rows.push(
        <div className={`dayhd ${isT ? "is-today" : ""}`} key={`d-${p.date}`}>
          <span className="dd">{dt.getDate()}. {MO[dt.getMonth()]}</span>
          <span className="dw">{WD[dt.getDay()]}{isT ? " · Heute" : ""}</span>
        </div>
      );
    }
    rows.push(
      <div className="card" key={p.id} onClick={() => onOpen(p)}>
        <div className="tcol">
          <div className="tm">{p.time ?? "—"}</div>
          <div className="fm">{p.format}</div>
        </div>
        <div className="body">
          <div className="tt">{p.theme || p.caption || "—"}</div>
          {p.theme && p.caption ? <div className="cp">{p.caption}</div> : null}
          {p.photos.length ? (
            <div className="thumbs">
              {p.photos.slice(0, 4).map((ph) => (
                <img key={ph.id} src={ph.url} alt="" />
              ))}
              {p.photos.length > 4 ? <div className="more">+{p.photos.length - 4}</div> : null}
            </div>
          ) : null}
        </div>
        <div className="rcol">
          {statusDot(p.status)}
          <div className="stt">{p.status}</div>
        </div>
      </div>
    );
  }
  return <div>{rows}</div>;
}

function CalView({
  posts,
  month,
  setMonth,
  onOpen,
}: {
  posts: PostWithPhotos[];
  month: Date;
  setMonth: (d: Date) => void;
  onOpen: (p: PostWithPhotos) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m + 1, 0).getDate();
  const iso = (day: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < start; i++) cells.push(<div className="ccell" key={`e-${i}`} />);
  for (let day = 1; day <= days; day++) {
    const ds = iso(day);
    const evs = posts.filter((p) => p.date === ds);
    cells.push(
      <div className={`ccell ${ds === todayISO() ? "today" : ""}`} key={ds}>
        <div className="cd">{day}</div>
        {evs.map((p) => (
          <div
            className="cev"
            key={p.id}
            style={{ borderLeftColor: `var(${STAT_VAR[p.status] ?? "--dot-ent"})` }}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(p);
            }}
          >
            {p.time ? p.time + " " : ""}
            {(p.format ?? "").replace("Feed ", "").replace(/[()]/g, "")}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="calnav">
        <button onClick={() => setMonth(new Date(y, m - 1, 1))}>‹</button>
        <div className="mo">{MO[m]} {y}</div>
        <button onClick={() => setMonth(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className="cal">
        <div className="calhd">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((x) => (
            <div key={x}>{x}</div>
          ))}
        </div>
        <div className="calgrid">{cells}</div>
      </div>
    </>
  );
}

function Sheet(props: {
  open: boolean;
  isEdit: boolean;
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  clients: Client[];
  draftPhotos: DraftPhoto[];
  uploading: boolean;
  saving: boolean;
  aiLoading: boolean;
  aiErr: string;
  aiSug: Suggestion[];
  fileRef: React.RefObject<HTMLInputElement>;
  onFiles: (f: FileList | null) => void;
  onRemovePhoto: (ph: DraftPhoto) => void;
  onGen: () => void;
  onApply: (caption: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const {
    open, isEdit, form, setForm, clients, draftPhotos, uploading, saving,
    aiLoading, aiErr, aiSug,
    fileRef, onFiles, onRemovePhoto, onGen, onApply, onCancel, onSave, onDelete,
  } = props;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className={`ov ${open ? "show" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="sheet">
        <div className="grab" />
        <div className="sh-hd">
          <div className="t">{isEdit ? "Post bearbeiten" : "Neuer Post"}</div>
          <div className="cancel" onClick={onCancel}>Abbrechen</div>
        </div>
        <div className="sh-bd">
          <div className="g2">
            <div>
              <label>Kunde</label>
              <select value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as PostStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="g3">
            <div>
              <label>Datum</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <label>Zeit</label>
              <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
            <div>
              <label>Format</label>
              <select value={form.format} onChange={(e) => set("format", e.target.value)}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Thema / Titel</label>
            <input value={form.theme} placeholder="Kurz-Thema" onChange={(e) => set("theme", e.target.value)} />
          </div>
          <div>
            <label>Caption / Text-Overlay</label>
            <textarea value={form.caption} onChange={(e) => set("caption", e.target.value)} />
          </div>

          <div>
            <label>Fotos & Medien</label>
            <div className="drop" onClick={() => fileRef.current?.click()}>
              {uploading ? "Lädt hoch …" : "📷 Fotos hochladen — tippen zum Auswählen"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <div className="gal">
              {draftPhotos.map((ph) => (
                <div className="ph" key={ph.id}>
                  <img src={ph.url} alt="" />
                  <div className="rm" onClick={() => onRemovePhoto(ph)}>×</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai">
            <div className="aih">
              Caption-Vorschlag
              <span className="gen" onClick={aiLoading ? undefined : onGen} style={aiLoading ? { opacity: 0.5 } : undefined}>
                {aiLoading ? "Generiert …" : "Generieren"}
              </span>
            </div>
            {aiErr ? (
              <div className="out" style={{ color: "var(--dot-frei)" }}>{aiErr}</div>
            ) : aiSug.length ? (
              <div className="sugs">
                {aiSug.map((s, i) => (
                  <div className="sug" key={i} onClick={() => onApply(s.caption)}>
                    <div className="sug-tx">{s.caption}</div>
                    {s.violations.length ? (
                      <div className="sug-warn">
                        ⚠ {s.violations.map((v) => v.rule).join(" · ")}
                      </div>
                    ) : (
                      <div className="sug-ok">✓ regelkonform</div>
                    )}
                    <div className="sug-apply">Tippen zum Übernehmen</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="out">
                {aiLoading
                  ? "Claude schreibt 3 Vorschläge nach den Regeln des Kunden …"
                  : "Nutzt Kunde, Format & Thema. Genau das läuft später im WhatsApp-Chat."}
              </div>
            )}
          </div>
        </div>
        <div className="sh-ft">
          {isEdit && (
            <button className="btn danger" onClick={onDelete} disabled={saving}>Löschen</button>
          )}
          <button className="btn primary" onClick={onSave} disabled={saving || uploading}>
            {saving ? "Speichert …" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
