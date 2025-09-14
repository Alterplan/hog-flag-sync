"use client";

import posthog from "posthog-js";
import { useCallback, useEffect, useRef } from "react";
import { syncServerOverridesAll } from "../syncFlagOverrides";

async function clearOverridesOnServer(apiURL: string) {
	await fetch(apiURL, { method: "DELETE" });
}

type UsePostHogAutoSyncOptions = {
	enabled?: boolean;
	apiURL?: string;
	debounceMs?: number;
	onSynced?: () => void;
};

export function usePostHogAutoSync({
	enabled = process.env.NODE_ENV !== "production",
	apiURL = "/api/hfs/override",
	debounceMs = 500,
	onSynced,
}: UsePostHogAutoSyncOptions = {}) {
	const lastSnapshot = useRef<Record<string, boolean | string | null>>({});
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const primedRef = useRef(false);

	// Auto sync when toolbar flags change
	useEffect(() => {
		if (!enabled) return;

		(async () => {
			await new Promise<void>((resolve) => {
				let ready = false;
				posthog.onFeatureFlags(() => {
					if (!ready) {
						ready = true;
						resolve();
					}
				});
				setTimeout(() => (!ready ? resolve() : undefined), 800);
			});

			const keys: string[] = posthog.featureFlags.getFlags() ?? [];
			const snap: Record<string, boolean | string | null> = {};
			for (const k of keys) {
				const v = posthog.getFeatureFlag(k);
				snap[k] = v === undefined ? null : v;
			}
			lastSnapshot.current = snap;
			primedRef.current = true;
		})();

		const unsubscribe = posthog.onFeatureFlags(() => {
			if (!primedRef.current) return;
			const keys: string[] = posthog.featureFlags.getFlags() ?? [];
			const next: Record<string, boolean | string | null> = {};
			for (const k of keys) {
				const v = posthog.getFeatureFlag(k);
				next[k] = v === undefined ? null : v;
			}

			const changed =
				keys.length !== Object.keys(lastSnapshot.current).length ||
				keys.some((k) => lastSnapshot.current[k] !== next[k]);

			if (!changed) return;

			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				await syncServerOverridesAll(apiURL);
				lastSnapshot.current = next;
				onSynced?.();
			}, debounceMs);
		});

		return () => {
			unsubscribe();
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [enabled, debounceMs, onSynced, apiURL]);

	const syncNow = useCallback(async () => {
		await syncServerOverridesAll(apiURL);
		onSynced?.();
	}, [onSynced, apiURL]);

	const clearOverrides = useCallback(async () => {
		await clearOverridesOnServer(apiURL);
		onSynced?.();
	}, [apiURL, onSynced]);

	return { syncNow, clearOverrides } as const;
}
