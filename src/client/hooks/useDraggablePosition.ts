"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { top: number; left: number };

type UseDraggablePositionOptions = {
	boxSize?: number; // square footprint to keep in viewport
	defaultMargin?: number;
	initial?: Point | null; // externally managed persisted position
};

export function useDraggablePosition({
	boxSize = 80,
	defaultMargin = 12,
	initial = null,
}: UseDraggablePositionOptions = {}) {
	const [pos, setPos] = useState<Point | null>(initial);
	const isDraggingRef = useRef(false);
	const [isDragging, setIsDragging] = useState(false);
	const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
	const movedRef = useRef(false);

	// initialize / adopt external initial position
	useEffect(() => {
		if (initial && !pos) {
			setPos(initial);
			return;
		}
		if (!initial && !pos) {
			const margin = defaultMargin;
			const size = boxSize;
			const top = Math.max(
				margin,
				typeof window !== "undefined"
					? window.innerHeight - size - margin
					: 600 - size - margin,
			);
			setPos({ top, left: margin });
		}
	}, [initial, pos, boxSize, defaultMargin]);

	// clamp into viewport on resize/orientation change
	useEffect(() => {
		const clamp = () => {
			setPos((prev) => {
				if (!prev) return prev;
				const margin = defaultMargin;
				const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
				const vh = typeof window !== "undefined" ? window.innerHeight : 800;
				const maxLeft = Math.max(margin, vw - boxSize - margin);
				const maxTop = Math.max(margin, vh - boxSize - margin);
				const left = Math.min(Math.max(prev.left, margin), maxLeft);
				const top = Math.min(Math.max(prev.top, margin), maxTop);
				if (left === prev.left && top === prev.top) return prev;
				return { top, left };
			});
		};
		clamp();
		window.addEventListener("resize", clamp);
		window.addEventListener("orientationchange", clamp);
		return () => {
			window.removeEventListener("resize", clamp);
			window.removeEventListener("orientationchange", clamp);
		};
	}, [boxSize, defaultMargin]);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (!pos) return;
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			isDraggingRef.current = true;
			setIsDragging(true);
			movedRef.current = false;
			dragOffsetRef.current = {
				dx: e.clientX - rect.left,
				dy: e.clientY - rect.top,
			};
			(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
		},
		[pos],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLElement>) => {
			if (!isDraggingRef.current || !dragOffsetRef.current) return;
			const margin = defaultMargin; // allow true zero if requested
			const { dx, dy } = dragOffsetRef.current;
			const nextLeft = Math.max(
				margin,
				Math.min(
					e.clientX - dx,
					(typeof window !== "undefined" ? window.innerWidth : 1200) -
						boxSize -
						margin,
				),
			);
			const nextTop = Math.max(
				margin,
				Math.min(
					e.clientY - dy,
					(typeof window !== "undefined" ? window.innerHeight : 800) -
						boxSize -
						margin,
				),
			);
			setPos({ top: nextTop, left: nextLeft });
			movedRef.current = true;
		},
		[boxSize, defaultMargin],
	);

	const onPointerUp = useCallback(() => {
		isDraggingRef.current = false;
		setIsDragging(false);
		dragOffsetRef.current = null;
	}, []);

	return useMemo(
		() => ({
			pos,
			setPos,
			onPointerDown,
			onPointerMove,
			onPointerUp,
			isDraggingRef,
			movedRef,
			isDragging,
		}),
		[pos, onPointerDown, onPointerMove, onPointerUp, isDragging],
	);
}
