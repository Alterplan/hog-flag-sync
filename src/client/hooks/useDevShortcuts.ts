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

// Detect Apple platforms (macOS, iOS, iPadOS)
export function isApplePlatform(): boolean {
	if (typeof navigator === "undefined") return false;
	const platform =
		(navigator as any).userAgentData?.platform || navigator.platform || "";
	return /(Mac|iPhone|iPad|iPod)/i.test(platform);
}

// Return the primary modifier state for the current OS from a keyboard event
function primaryKeyForOS(
	e:
		| Pick<KeyboardEvent, "metaKey" | "ctrlKey">
		| Pick<React.KeyboardEvent, "metaKey" | "ctrlKey">,
): boolean {
	return isApplePlatform() ? !!e.metaKey : !!e.ctrlKey;
}

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
			const cmdOrCtrl = primaryKeyForOS(e);
			if (cmdOrCtrl && e.shiftKey && key === syncKey) {
				e.preventDefault();
				onSync();
			} else if (cmdOrCtrl && e.shiftKey && key === clearKey) {
				e.preventDefault();
				onClear();
			} else if (cmdOrCtrl && e.shiftKey && key === toggleKey) {
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
