import { NextResponse } from "next/server";
import { clearOverrides, writeOverrides } from "../server/overrides";
import type { OverridesBag } from "../types/flags";

export async function handleOverridePOST(req: Request) {
	const { flags, payloads } = (await req
		.json()
		.catch(() => ({}))) as Partial<OverridesBag>;

	if (!flags || typeof flags !== "object") {
		return NextResponse.json(
			{ ok: false, error: "Invalid flags" },
			{ status: 400 },
		);
	}

	const safe: OverridesBag = {
		flags,
		payloads: payloads && typeof payloads === "object" ? payloads : {},
	} as OverridesBag;

	await writeOverrides(safe);
	return NextResponse.json({ ok: true });
}

export async function handleOverrideDELETE() {
	await clearOverrides();
	return NextResponse.json({ ok: true });
}
