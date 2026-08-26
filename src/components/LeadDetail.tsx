"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Phone, MapPin } from "lucide-react";
import { LEAD_STATUSES as STATUSES } from "@/lib/lead-status";

const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up needed",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};
const STATUS_STYLE: Record<(typeof STATUSES)[number], string> = {
  NEW: "border-cat-blue text-cat-blue",
  CONTACTED: "border-cat-amber text-cat-amber",
  FOLLOW_UP: "border-accent text-accent",
  CONVERTED: "border-success text-success",
  CLOSED: "border-ink-faint text-ink-faint",
};

type Note = { id: string; body: string; createdAt: string; adminName: string | null };

export function LeadDetail({
  leadId,
  name,
  phone,
  city,
  area,
  status: initialStatus,
  assignedToName,
  notes: initialNotes,
}: {
  leadId: string;
  name: string;
  phone: string;
  city: string;
  area: string;
  status: string;
  assignedToName: string | null;
  notes: Note[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: string) {
    setStatusSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update status.");
      setStatus(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const text = newNote.trim();
    if (!text || noteSaving) return;
    setNoteSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save note.");
      setNotes((n) => [...n, { id: data.note.id, body: text, createdAt: data.note.createdAt, adminName: null }]);
      setNewNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{name}</h2>
            <a href={`tel:+91${phone}`} className="flex items-center gap-1.5 text-sm text-brand hover:underline">
              <Phone size={13} /> +91 {phone}
            </a>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
              <MapPin size={12} /> {area}, {city}
            </p>
          </div>
          {assignedToName && (
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
              Assigned to {assignedToName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={statusSaving}
              onClick={() => updateStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                status === s ? `${STATUS_STYLE[s]} bg-bg` : "border-border text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Call notes &amp; updates</h3>
        <p className="mb-3 text-xs text-ink-faint">
          Log what happened on each call — anyone who picks this lead up next sees the full history below.
        </p>

        <div className="mb-3 space-y-2">
          {notes.length === 0 ? (
            <p className="text-sm text-ink-faint">No notes yet — log the first update below.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border bg-bg p-3">
                <p className="text-sm text-ink">{n.body}</p>
                <p className="mt-1 text-[11px] text-ink-faint">
                  {n.adminName ?? "Owner"} ·{" "}
                  {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={addNote} className="flex items-start gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            placeholder="e.g. Called at 3pm, will confirm slot tomorrow morning"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            disabled={noteSaving}
          />
          <button
            type="submit"
            disabled={noteSaving || !newNote.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {noteSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Log update
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}
