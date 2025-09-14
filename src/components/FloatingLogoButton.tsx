"use client";

import { useEffect } from "react";

const logo = new URL("../image/logo.png", import.meta.url).toString();

export function FloatingLogoButton({
	pos,
	size = 60,
	onClick,
	drag,
	hidden = false,
	buttonRef,
	bounce = false,
	noAnimate = false,
}: {
	pos: { top: number; left: number } | null;
	size?: number;
	onClick: () => void;
	drag: {
		onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
		onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
		onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
		isDragging?: boolean;
	};
	hidden?: boolean;
	buttonRef?: React.Ref<HTMLButtonElement>;
	bounce?: boolean;
	noAnimate?: boolean;
}) {
	// Inject keyframes once (no dangerouslySetInnerHTML)
	useEffect(() => {
		if (typeof document === "undefined") return;
		const id = "ph-bounce-kf";
		let el = document.getElementById(id) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = id;
			el.textContent =
				"@keyframes phBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}";
			document.head.appendChild(el);
		}
	}, []);

	if (hidden || !pos) return null;
	return (
		<button
			ref={buttonRef as any}
			aria-label="Open Hog Flag Sync Panel"
			type="button"
			onClick={onClick}
			onPointerDown={drag.onPointerDown}
			onPointerMove={drag.onPointerMove}
			onPointerUp={drag.onPointerUp}
			onDragStart={(e) => e.preventDefault()}
			onMouseEnter={(e) => {
				const inner = (e.currentTarget.firstChild as HTMLElement) || null;
				if (inner) inner.style.animationPlayState = "paused";
			}}
			onMouseLeave={(e) => {
				const inner = (e.currentTarget.firstChild as HTMLElement) || null;
				if (inner) inner.style.animationPlayState = "running";
			}}
			style={{
				position: "fixed",
				left: 0,
				top: 0,
				transform: `translate(${pos.left}px, ${pos.top}px)`,
				zIndex: 9999,
				width: size,
				height: size,
				background: "transparent",
				border: "none",
				padding: 0,
				cursor: "grab",
				userSelect: "none",
				touchAction: "none",
				transition: `${drag.isDragging || noAnimate ? "filter .2s" : "transform .35s cubic-bezier(.18,.89,.32,1.18), filter .2s"}`,
				filter: "drop-shadow(0 4px 10px rgba(0,0,0,.25))",
			}}
		>
			<span
				style={{
					display: "block",
					width: "100%",
					height: "100%",
					backgroundImage: `url(${logo})`,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
					backgroundSize: "contain",
					animation: bounce ? "phBounce 2.6s ease-in-out infinite" : undefined,
				}}
			/>
		</button>
	);
}
