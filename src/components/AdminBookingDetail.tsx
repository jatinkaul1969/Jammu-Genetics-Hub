"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileUp, FileDown, Trash2, Check } from "lucide-react";
import { BOOKING_STATUSES, STATUS_LABEL } from "@/lib/booking-status";

type Props = {
  bookingId: string;
  status: string;
  adminNote: string;
  reportFile: string | null;
  bookingCode: string;
};

export function AdminBookingDetail({ bookingId, status, adminNote, reportFile, bookingCode }: Props) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [note, setNote] = useState(adminNote);
  const [hasReport, setHasReport] = useState(Boolean(reportFile));
  const [statusSaving, setStatusSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function updateStatus(next: string) {
    setStatusSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update status.");
      setCurrentStatus(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveNote() {
    setNoteSaving(true);
    setError(null);
    setSavedNote(false);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save note.");
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setNoteSaving(false);
    }
  }

  async function uploadReport(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/bookings/${bookingId}/report`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not upload report.");
      setHasReport(true);
      setCurrentStatus("REPORT_READY");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeReport() {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/report`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not remove report.");
      setHasReport(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Status</h3>
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUSES.map((s) => (
            <button
              key={s}
              disabled={statusSaving}
              onClick={() => updateStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                currentStatus === s
                  ? "border-brand bg-brand text-white"
                  : "border-border text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Report</h3>
        {hasReport ? (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/reports/${bookingCode}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-brand hover:text-white"
            >
              <FileDown size={14} /> View report
            </a>
            <button
              onClick={removeReport}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-accent hover:border-accent disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ) : (
          <div>
            <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              Upload PDF report
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadReport(file);
                }}
              />
            </label>
            <p className="mt-2 text-xs text-ink-faint">
              Uploading a report automatically sets status to &ldquo;Report Ready&rdquo;.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Internal note</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Notes visible only to admins — e.g. collection issues, callbacks needed"
          className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={saveNote}
          disabled={noteSaving}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {noteSaving ? <Loader2 size={13} className="animate-spin" /> : savedNote ? <Check size={13} /> : null}
          {savedNote ? "Saved" : "Save note"}
        </button>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}
