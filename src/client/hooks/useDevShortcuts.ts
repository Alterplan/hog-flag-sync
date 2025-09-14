"use client";

import { useEffect } from "react";

type DevShortcutsOptions = {
	enabled?: boolean;
	onSync: () => void;
	onClear: () => void;
	onToggleButton?: () => void;
	keys?: {
		sync?: string; // letter key, defaults to 'f'
		clear?: string; // letter key, defaults to 'x'
		toggleButton?: string; // letter key, defaults to 'h'
	};
};

export function useDevShortcuts({
	enabled = true,
	onSync,
	onClear,
	onToggleButton,
	keys,
}: DevShortcutsOptions) {
	useEffect(() => {
		if (!enabled) return;
		const syncKey = (keys?.sync ?? "f").toLowerCase();
		const clearKey = (keys?.clear ?? "x").toLowerCase();
		const toggleKey = (keys?.toggleButton ?? "h").toLowerCase();
		const onKey = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			if (e.metaKey && e.shiftKey && key === syncKey) {
				e.preventDefault();
				onSync();
			} else if (e.metaKey && e.shiftKey && key === clearKey) {
				e.preventDefault();
				onClear();
			} else if (e.metaKey && e.shiftKey && key === toggleKey) {
				e.preventDefault();
				onToggleButton?.();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		enabled,
		onSync,
		onClear,
		onToggleButton,
		keys?.sync,
		keys?.clear,
		keys?.toggleButton,
	]);
}
