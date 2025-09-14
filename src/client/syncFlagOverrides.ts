"use client";
import posthog from "posthog-js";

async function waitFlagsReady(timeoutMs = 800) {
	await new Promise<void>((resolve) => {
		let done = false;
		posthog.onFeatureFlags(() => {
			if (!done) {
				done = true;
				resolve();
			}
		});
		setTimeout(() => {
			if (!done) resolve();
		}, timeoutMs);
	});
}

export async function syncServerOverridesAll(apiURL: string) {
	await waitFlagsReady();

	const keys: string[] = posthog.featureFlags.getFlags() ?? [];

	const flags: Record<string, boolean | string | null> = {};
	const payloads: Record<string, unknown> = {};

	for (const k of keys) {
		const flagValue = posthog.getFeatureFlag(k);
		flags[k] = flagValue === undefined ? null : flagValue;
		payloads[k] = posthog.getFeatureFlagPayload(k);
	}

	await fetch(apiURL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ flags, payloads }),
	});
}
