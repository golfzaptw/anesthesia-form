"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { UseFormSetValue, UseFormGetValues, FieldValues } from "react-hook-form";

const DRAFT_PREFIX = "draft";
const DEBOUNCE_MS = 3000;

function getDraftKey(formId: string, batchId?: number, userId?: string): string {
  return `${DRAFT_PREFIX}_${formId}_batch_${batchId ?? "default"}_user_${userId ?? "unknown"}`;
}

interface UseDraftAutoSaveOptions<T extends FieldValues> {
  formId: string;
  batchId?: number;
  userId: string;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  /** Field names to watch for changes */
  watchedValues: Record<string, unknown>;
  /** Callback when draft is restored — useful for showing a toast */
  onDraftRestored?: () => void;
}

interface UseDraftAutoSaveReturn {
  /** Whether a draft was found and restored */
  hasDraft: boolean;
  /** Last saved timestamp (ms) */
  lastSavedAt: number | null;
  /** Manually clear the saved draft */
  clearDraft: () => void;
  /** Whether draft is currently being saved */
  isSaving: boolean;
}

export function useDraftAutoSave<T extends FieldValues>({
  formId,
  batchId,
  userId,
  getValues,
  setValue,
  watchedValues,
  onDraftRestored,
}: UseDraftAutoSaveOptions<T>): UseDraftAutoSaveReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const draftKey = getDraftKey(formId, batchId, userId);

  // Restore draft on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { data: Record<string, string>; savedAt: number };
      if (!parsed.data || typeof parsed.data !== "object") return;

      const entries = Object.entries(parsed.data);
      if (entries.length === 0) return;

      // Restore all values
      entries.forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          setValue(key as Parameters<typeof setValue>[0], value as Parameters<typeof setValue>[1]);
        }
      });

      setHasDraft(true);
      setLastSavedAt(parsed.savedAt);
      onDraftRestored?.();
    } catch {
      // Corrupted draft — ignore
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, setValue, onDraftRestored]);

  // Auto-save with debounce when watchedValues change
  useEffect(() => {
    // Skip the initial render / restore
    if (!restoredRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const currentValues = getValues();
        // Only save if there's at least one non-empty value
        const hasData = Object.values(currentValues).some(
          (v) => v !== undefined && v !== ""
        );
        if (!hasData) return;

        setIsSaving(true);
        const now = Date.now();
        localStorage.setItem(
          draftKey,
          JSON.stringify({ data: currentValues, savedAt: now })
        );
        setLastSavedAt(now);
        setHasDraft(true);
        setIsSaving(false);
      } catch {
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, draftKey, getValues]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setLastSavedAt(null);
  }, [draftKey]);

  return { hasDraft, lastSavedAt, clearDraft, isSaving };
}
