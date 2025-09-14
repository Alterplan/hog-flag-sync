"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HFS_TOOLBAR_VERSION } from "../version";

export default function SyncMiniBar({
	anchor,
	anchorSize = 80,
	onSync,
	onClear,
	onClose,
	anchorRef,
	onToggleHide,
	settings,
}: {
	anchor: { top: number; left: number };
	anchorSize?: number;
	onSync: () => void | Promise<void>;
	onClear: () => void | Promise<void>;
	onClose: () => void;
	anchorRef?: React.RefObject<HTMLElement | HTMLButtonElement | null>;
	onToggleHide?: () => void;
	settings?: {
		bounceEnabled: boolean;
		setBounceEnabled: (v: boolean) => void;
		defaultVisible: boolean;
		setDefaultVisible: (v: boolean) => void;
		shortcutSyncKey: string;
		setShortcutSyncKey: (s: string) => void;
		shortcutClearKey: string;
		setShortcutClearKey: (s: string) => void;
		shortcutToggleKey: string;
		setShortcutToggleKey: (s: string) => void;
		onReset?: () => void;
	};
}) {
	const ref = useRef<HTMLDivElement>(null);

	// compute position above the anchor, clamped to viewport
	const { left, top } = useMemo(() => {
		const width = 360;
		const barH = 44; // approx height
		const margin = 8;
		const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
		const vh = typeof window !== "undefined" ? window.innerHeight : 800;
		let l = anchor.left + anchorSize / 2 - width / 2;
		l = Math.min(Math.max(margin, l), vw - width - margin);
		let t = anchor.top - barH - margin;
		if (t < margin)
			t = Math.min(vh - barH - margin, anchor.top + anchorSize + margin);
		return { left: l, top: t };
	}, [anchor.left, anchor.top, anchorSize]);

	// Close on Escape
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	// close on outside pointer down
	useEffect(() => {
		const handler = (e: Event) => {
			const target = e.target as Node | null;
			if (ref.current?.contains(target)) return;
			if (anchorRef?.current?.contains(target as Node)) return;
			onClose();
		};
		document.addEventListener("pointerdown", handler, true);
		return () => document.removeEventListener("pointerdown", handler, true);
	}, [onClose, anchorRef]);

	const [menuOpen, setMenuOpen] = useState(false);
	const [infoOpen, setInfoOpen] = useState(false);

	// Local editing state for shortcut inputs to allow clearing with Backspace/Delete
	const [syncKeyInput, setSyncKeyInput] = useState<string>(
		(settings?.shortcutSyncKey ?? "f").toUpperCase(),
	);
	const [clearKeyInput, setClearKeyInput] = useState<string>(
		(settings?.shortcutClearKey ?? "x").toUpperCase(),
	);
	const [toggleKeyInput, setToggleKeyInput] = useState<string>(
		(settings?.shortcutToggleKey ?? "h").toUpperCase(),
	);

	// Re-sync local inputs when settings change or menu opens
	useEffect(() => {
		if (!menuOpen) return;
		setSyncKeyInput((settings?.shortcutSyncKey ?? "f").toUpperCase());
		setClearKeyInput((settings?.shortcutClearKey ?? "x").toUpperCase());
		setToggleKeyInput((settings?.shortcutToggleKey ?? "h").toUpperCase());
	}, [
		menuOpen,
		settings?.shortcutSyncKey,
		settings?.shortcutClearKey,
		settings?.shortcutToggleKey,
	]);

	const handleShortcutKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		kind: "sync" | "clear" | "toggle",
	) => {
		const setDisplay =
			kind === "sync"
				? setSyncKeyInput
				: kind === "clear"
					? setClearKeyInput
					: setToggleKeyInput;
		const commit = (c: string) => {
			const lower = c.toLowerCase();
			if (kind === "sync") settings?.setShortcutSyncKey(lower);
			else if (kind === "clear") settings?.setShortcutClearKey(lower);
			else settings?.setShortcutToggleKey(lower);
			setDisplay(c.toUpperCase());
		};
		const k = e.key;
		if (k === "Backspace" || k === "Delete") {
			e.preventDefault();
			setDisplay("");
			return;
		}
		if (k.length === 1 && /^[a-zA-Z0-9]$/.test(k)) {
			e.preventDefault();
			commit(k);
			return;
		}
		// Allow Tab, Enter, Escape to pass
	};

	return (
		<div
			ref={ref}
			role="toolbar"
			aria-label="PostHog Overrides"
			style={{
				position: "fixed",
				left,
				top,
				width: 360,
				height: 44,
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "0 10px",
				background: "#151516",
				color: "#fff",
				borderRadius: 10,
				border: "1px solid #2a2b2e",
				boxShadow: "0 10px 24px rgba(0,0,0,0.30)",
				zIndex: 10000,
			}}
		>
			<button
				type="button"
				onClick={onSync}
				style={{
					height: 28,
					padding: "0 10px",
					borderRadius: 6,
					border: "1px solid rgba(255,255,255,0.12)",
					background: "#1f2022",
					color: "#fff",
					cursor: "pointer",
					display: "inline-flex",
					alignItems: "center",
					gap: 6,
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#212225";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#1f2022";
				}}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Sync overrides"
				>
					<title>Sync overrides</title>

					<polyline points="23 4 23 10 17 10"></polyline>
					<polyline points="1 20 1 14 7 14"></polyline>
					<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
				</svg>
				<span style={{ fontSize: 12 }}>Sync</span>
			</button>
			<button
				type="button"
				onClick={onClear}
				style={{
					height: 28,
					padding: "0 10px",
					borderRadius: 6,
					border: "1px solid rgba(255,255,255,0.12)",
					background: "#fff",
					color: "#111",
					cursor: "pointer",
					display: "inline-flex",
					alignItems: "center",
					gap: 6,
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#f6f6f6";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#fff";
				}}
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Clear overrides"
				>
					<title>Clear overrides</title>
					<polyline points="3 6 5 6 21 6"></polyline>
					<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>
					<path d="M10 11v6M14 11v6"></path>
					<path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path>
				</svg>
				<span style={{ fontSize: 12 }}>Clear</span>
			</button>
			<div style={{ flex: 1 }} />
			{onToggleHide && (
				<>
					<button
						type="button"
						aria-label="Hide logo"
						onClick={onToggleHide}
						style={{
							height: 28,
							width: 32,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 6,
							border: "1px solid rgba(255,255,255,0.12)",
							background: "#1f2022",
							color: "#fff",
							cursor: "pointer",
							marginRight: 4,
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"#212225";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"#1f2022";
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							role="img"
							aria-label="Hide"
						>
							<title>Hide</title>
							<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
							<circle cx="12" cy="12" r="3"></circle>
						</svg>
					</button>
					<button
						type="button"
						aria-label="About this toolbar"
						onClick={() => {
							setInfoOpen((v) => !v);
							setMenuOpen(false);
						}}
						style={{
							height: 28,
							width: 32,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 6,
							border: "1px solid rgba(255,255,255,0.12)",
							background: "#1f2022",
							color: "#fff",
							cursor: "pointer",
							marginRight: 4,
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"#212225";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"#1f2022";
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							role="img"
							aria-label="Info"
						>
							<title>Info</title>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="16" x2="12" y2="12" />
							<line x1="12" y1="8" x2="12.01" y2="8" />
						</svg>
					</button>
				</>
			)}
			<button
				type="button"
				aria-label="Shortcuts menu"
				onClick={() => {
					setMenuOpen((v) => !v);
					setInfoOpen(false);
				}}
				style={{
					height: 28,
					width: 32,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: 6,
					border: "1px solid rgba(255,255,255,0.12)",
					background: "#1f2022",
					color: "#fff",
					cursor: "pointer",
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#212225";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background = "#1f2022";
				}}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Menu"
				>
					<title>Menu</title>
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>

			{infoOpen && (
				<div
					style={{
						position: "absolute",
						right: 8 + 32 + 4, // rough offset to avoid overlap with menu
						...(top < anchor.top
							? { bottom: "calc(100% + 8px)" }
							: { top: 44 + 8 }),
						width: 300,
						background: "#151516",
						color: "#fff",
						border: "1px solid #2a2b2e",
						borderRadius: 10,
						boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
						padding: "12px",
						fontSize: 12,
						lineHeight: 1.5,
						overflow: "hidden",
						animation:
							"phSettingsBounce 260ms cubic-bezier(.18,.89,.32,1.28) both",
						transformOrigin: "top right",
					}}
				>
					<div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
						What is this?
					</div>
					<p style={{ margin: 0, opacity: 0.85 }}>
						<strong>Hog Flag Sync</strong> syncs PostHog feature flag overrides
						you set in the PostHog toolbar into your local app (client &
						server).
						<br />
						<br />
						Use
						<strong> Sync</strong> to pull current values for your flags
						(including overrides), and
						<strong> Clear</strong> to remove them.
					</p>
				</div>
			)}
			{menuOpen && (
				<div
					style={{
						position: "absolute",
						right: 8,
						...(top < anchor.top
							? { bottom: "calc(100% + 8px)" }
							: { top: 44 + 8 }),
						width: 320,
						background: "#151516",
						color: "#fff",
						border: "1px solid #2a2b2e",
						borderRadius: 10,
						boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
						padding: "12px",
						fontSize: 12,
						lineHeight: 1.5,
						overflow: "hidden",
						animation:
							"phSettingsBounce 260ms cubic-bezier(.18,.89,.32,1.28) both",
						transformOrigin: "top right",
					}}
				>
					<style>{`@keyframes phSettingsBounce{0%{opacity:.0;transform:translateY(-6px) scale(.98)}60%{opacity:1;transform:translateY(0) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
					<div
						style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
					>
						<div style={{ fontWeight: 600, fontSize: 13 }}>Settings</div>
						<div style={{ flex: 1 }} />
						<button
							type="button"
							aria-label="Close settings"
							onClick={() => setMenuOpen(false)}
							style={{
								height: 24,
								width: 24,
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: 6,
								border: "1px solid rgba(255,255,255,0.12)",
								background: "#1f2022",
								color: "#fff",
								cursor: "pointer",
							}}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLButtonElement).style.background =
									"#212225";
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLButtonElement).style.background =
									"#1f2022";
							}}
						>
							×
						</button>
					</div>

					<div style={{ display: "grid", gap: 10 }}>
						<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<input
								type="checkbox"
								checked={!!settings?.bounceEnabled}
								onChange={(e) => settings?.setBounceEnabled(e.target.checked)}
								style={{ accentColor: "rgba(119, 137, 146, 1)" }}
							/>
							<span>Bounce animation on logo</span>
						</label>

						<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<input
								type="checkbox"
								checked={!!settings?.defaultVisible}
								onChange={(e) => settings?.setDefaultVisible(e.target.checked)}
								style={{ accentColor: "rgba(119, 137, 146, 1)" }}
							/>
							<span>Make the toolbar visible by default</span>
						</label>

						<div
							style={{ height: 1, background: "#2a2b2e", margin: "4px 0" }}
						/>

						<div style={{ fontWeight: 600, opacity: 0.9 }}>
							Shortcuts (hold ⌘⇧ + key)
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr auto",
								rowGap: 8,
								columnGap: 8,
							}}
						>
							<span>Sync overrides</span>
							<input
								type="text"
								inputMode="text"
								value={syncKeyInput}
								onChange={(e) => setSyncKeyInput(e.target.value.toUpperCase())}
								onKeyDown={(e) => handleShortcutKeyDown(e, "sync")}
								onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
								onBlur={() =>
									setSyncKeyInput(
										(settings?.shortcutSyncKey ?? "f").toUpperCase(),
									)
								}
								maxLength={2}
								style={{
									width: 32,
									height: 24,
									textAlign: "center",
									borderRadius: 6,
									border: "1px solid rgba(255,255,255,0.12)",
									background: "#1f2022",
									color: "#fff",
								}}
							/>

							<span>Clear overrides</span>
							<input
								type="text"
								inputMode="text"
								value={clearKeyInput}
								onChange={(e) => setClearKeyInput(e.target.value.toUpperCase())}
								onKeyDown={(e) => handleShortcutKeyDown(e, "clear")}
								onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
								onBlur={() =>
									setClearKeyInput(
										(settings?.shortcutClearKey ?? "x").toUpperCase(),
									)
								}
								maxLength={2}
								style={{
									width: 32,
									height: 24,
									textAlign: "center",
									borderRadius: 6,
									border: "1px solid rgba(255,255,255,0.12)",
									background: "#1f2022",
									color: "#fff",
								}}
							/>

							<span>Toggle toolbar visibility</span>
							<input
								type="text"
								inputMode="text"
								value={toggleKeyInput}
								onChange={(e) =>
									setToggleKeyInput(e.target.value.toUpperCase())
								}
								onKeyDown={(e) => handleShortcutKeyDown(e, "toggle")}
								onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
								onBlur={() =>
									setToggleKeyInput(
										(settings?.shortcutToggleKey ?? "h").toUpperCase(),
									)
								}
								maxLength={2}
								style={{
									width: 32,
									height: 24,
									textAlign: "center",
									borderRadius: 6,
									border: "1px solid rgba(255,255,255,0.12)",
									background: "#1f2022",
									color: "#fff",
								}}
							/>
						</div>
						<div style={{ opacity: 0.7 }}>
							Shortcuts use ⌘⇧ + the chosen key.
						</div>
						<div
							style={{
								marginTop: 12,
								display: "flex",
								gap: 10,
								alignItems: "center",
							}}
						>
							<button
								type="button"
								aria-label="Reset settings"
								onClick={() => settings?.onReset?.()}
								style={{
									padding: "4px 10px",
									fontSize: 12,
									borderRadius: 6,
									border: "1px solid rgba(255,255,255,0.16)",
									background: "#27282b",
									color: "#fff",
									cursor: "pointer",
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLButtonElement).style.background =
										"#2d2e31";
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLButtonElement).style.background =
										"#27282b";
								}}
							>
								Reset settings
							</button>
							<span style={{ fontSize: 11, opacity: 0.55 }}>
								Restores defaults
							</span>
							<div style={{ flex: 1 }} />
							<span style={{ fontSize: 11, opacity: 0.4 }}>
								v{HFS_TOOLBAR_VERSION}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
