import "server-only";
import { cookies } from "next/headers";
import type { OverridesBag } from "../types/flags";

export const COOKIE_NAME = "hfs_server_flag_overrides";

export async function readOverrides(): Promise<OverridesBag | null> {
	const jar = await cookies();
	const raw = jar.get(COOKIE_NAME)?.value;
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return {
			flags: parsed?.flags ?? {},
			payloads: parsed?.payloads ?? {},
		} satisfies OverridesBag;
	} catch {
		return null;
	}
}

export async function writeOverrides(data: OverridesBag): Promise<void> {
	const jar = await cookies();
	jar.set({ name: COOKIE_NAME, value: JSON.stringify(data), path: "/" });
}

export async function clearOverrides(): Promise<void> {
	const jar = await cookies();
	jar.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
}
