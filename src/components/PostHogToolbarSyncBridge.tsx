"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDevShortcuts } from "../client/hooks/useDevShortcuts";
import { useDraggablePosition } from "../client/hooks/useDraggablePosition";
import { usePostHogAutoSync } from "../client/hooks/usePostHogAutoSync";
import { FloatingLogoButton } from "./FloatingLogoButton";
import SyncMiniBar from "./SyncMiniBar";

export default function PostHogToolbarSyncBridge({
	enabled = process.env.NODE_ENV !== "production",
	debounceMs = 500,
}: {
	enabled?: boolean;
	debounceMs?: number;
}) {
	const router = useRouter();

	// Auto-sync logic, independent from UI
	const { syncNow, clearOverrides } = usePostHogAutoSync({
		enabled,
		debounceMs,
		onSynced: () => router.refresh(),
	});

	// Settings state (hydrated from localStorage AFTER mount to avoid SSR mismatch)
	const [settings, setSettings] = useState({
		bounceEnabled: false,
		defaultVisible: true,
		position: null as { top: number; left: number } | null,
		shortcutSyncKey: "f",
		shortcutClearKey: "x",
		shortcutToggleKey: "h",
	});
	const [hydrated, setHydrated] = useState(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		try {
			const raw = localStorage.getItem("hfs_dev_toolbar_settings");
			if (raw) {
				const parsed = JSON.parse(raw);
				setSettings((s) => ({ ...s, ...parsed }));
			}
		} catch {
		} finally {
			setHydrated(true);
		}
	}, []);

	// Persist settings only after hydration (avoid overwriting stored values with defaults before load)
	useEffect(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(
				"hfs_dev_toolbar_settings",
				JSON.stringify(settings),
			);
		} catch {}
	}, [settings, hydrated]);

	// Floating position + drag handlers, shared by logo and panel (controlled)
	const drag = useDraggablePosition({
		boxSize: 60,
		defaultMargin: 0, // allow full bottom docking
		initial: settings.position,
	});

	// Panel visibility state
	const [open, setOpen] = useState(false);
	const noAnimateRef = useRef(false);
	const adoptedPosRef = useRef(false);
	const {
		bounceEnabled,
		defaultVisible,
		position,
		shortcutSyncKey,
		shortcutClearKey,
		shortcutToggleKey,
	} = settings;

	// Persist drag position only after pointer up (avoid spam + flicker)
	useEffect(() => {
		if (!hydrated) return; // don't derive/persist before hydration
		if (drag.isDragging) return; // only persist when drag finished
		const p = drag.pos;
		if (!p) return;
		if (!Number.isFinite(p.top) || !Number.isFinite(p.left)) return;
		// Clamp defensively in case viewport shrank drastically
		const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
		const vh = typeof window !== "undefined" ? window.innerHeight : 800;
		const size = 60;
		const clamped = {
			left: Math.min(Math.max(0, p.left), vw - size),
			top: Math.min(Math.max(0, p.top), vh - size),
		};
		if (position?.top !== clamped.top || position?.left !== clamped.left) {
			setSettings((s) => ({ ...s, position: clamped }));
		}
	}, [drag.isDragging, drag.pos, position, hydrated]);

	// Adopt stored position (loaded post-hydration) exactly once if different from current
	useEffect(() => {
		if (!hydrated) return;
		if (adoptedPosRef.current) return;
		if (!settings.position) return;
		const p = settings.position;
		if (!drag.pos || drag.pos.top !== p.top || drag.pos.left !== p.left) {
			// Apply instantly without animation flicker
			noAnimateRef.current = true;
			drag.setPos(p);
			requestAnimationFrame(() => {
				noAnimateRef.current = false;
			});
		}
		adoptedPosRef.current = true;
	}, [hydrated, settings.position, drag.pos, drag.setPos]);

	// Separate hidden button localStorage key deprecated; state persisted within composite settings.

	const logoRef = useRef<HTMLButtonElement | null>(null);

	// Shortcuts
	useDevShortcuts({
		enabled,
		onSync: syncNow,
		onClear: clearOverrides,
		onToggleButton: () => {
			setOpen(false);
			setSettings((s) => ({ ...s, defaultVisible: !s.defaultVisible }));
		},
		keys: {
			sync: shortcutSyncKey,
			clear: shortcutClearKey,
			toggleButton: shortcutToggleKey,
		},
	});

	if (!hydrated) return null;

	return (
		<>
			<FloatingLogoButton
				pos={drag.pos}
				onClick={() => {
					if (!enabled) return;
					if (!drag.movedRef.current) setOpen((v) => !v);
				}}
				drag={drag}
				hidden={!defaultVisible || !enabled}
				buttonRef={logoRef}
				bounce={bounceEnabled && !open}
				noAnimate={noAnimateRef.current}
			/>

			{open && enabled && drag.pos && (
				<SyncMiniBar
					anchor={drag.pos}
					anchorSize={60}
					onClose={() => setOpen(false)}
					onSync={syncNow}
					onClear={clearOverrides}
					anchorRef={logoRef}
					onToggleHide={() => {
						setOpen(false);
						setSettings((s) => ({ ...s, defaultVisible: false }));
					}}
					settings={{
						bounceEnabled,
						setBounceEnabled: (v: boolean) =>
							setSettings((s) => ({ ...s, bounceEnabled: v })),
						defaultVisible,
						setDefaultVisible: (v: boolean) =>
							setSettings((s) => ({ ...s, defaultVisible: v })),
						shortcutSyncKey,
						setShortcutSyncKey: (k: string) =>
							setSettings((s) => ({ ...s, shortcutSyncKey: k })),
						shortcutClearKey,
						setShortcutClearKey: (k: string) =>
							setSettings((s) => ({ ...s, shortcutClearKey: k })),
						shortcutToggleKey,
						setShortcutToggleKey: (k: string) =>
							setSettings((s) => ({ ...s, shortcutToggleKey: k })),
						onReset: () => {
							// Compute center-bottom position (keeping margin 0 since we use defaultMargin:0)
							const vh =
								typeof window !== "undefined" ? window.innerHeight : 800;
							const vw =
								typeof window !== "undefined" ? window.innerWidth : 1200;
							const size = 60;
							const top = vh - size - 0; // bottom flush
							const left = Math.max(0, vw / 2 - size / 2);
							const centerPos = { top, left };
							// Apply instantly
							drag.setPos(centerPos);
							noAnimateRef.current = true;
							requestAnimationFrame(() => {
								noAnimateRef.current = false;
							});
							setSettings((s) => ({
								...s,
								bounceEnabled: false,
								defaultVisible: true,
								position: centerPos,
								shortcutSyncKey: "f",
								shortcutClearKey: "x",
								shortcutToggleKey: "h",
							}));
						},
					}}
				/>
			)}
		</>
	);
}
