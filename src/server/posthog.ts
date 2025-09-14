import "server-only";
import { PostHog } from "posthog-node";
import type { PHFlagOptions } from "../types/flags";
import { readOverrides } from "./overrides";

function ensureKey(): string {
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
		throw new Error("Missing NEXT_PUBLIC_POSTHOG_KEY env var");
	}
	return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function ensureHost(): string {
	if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) {
		throw new Error("Missing NEXT_PUBLIC_POSTHOG_HOST env var");
	}
	return process.env.NEXT_PUBLIC_POSTHOG_HOST;
}

export function createPatchedPostHog(
	apiKey = ensureKey(),
	host = ensureHost(),
	options?: PHFlagOptions,
) {
	const ph = new PostHog(apiKey, {
		host,
		flushAt: 1,
		flushInterval: 0,
		...options,
	} as any);

	const original = {
		getFeatureFlag: ph.getFeatureFlag.bind(ph) as (
			key: string,
			distinctId: string,
			opts?: PHFlagOptions,
		) => Promise<boolean | string | null>,
		getFeatureFlagPayload: ph.getFeatureFlagPayload.bind(ph) as (
			key: string,
			distinctId: string,
			matchValue?: boolean | string | null,
			opts?: { onlyEvaluateLocally?: boolean },
		) => Promise<unknown>,
		getAllFlags: ph.getAllFlags.bind(ph) as (
			distinctId: string,
			opts?: PHFlagOptions,
		) => Promise<Record<string, boolean | string | null>>,
	};

	(ph as any).__original = original;

	ph.getFeatureFlag = async function getFeatureFlag(
		key: string,
		distinctId: string,
		opts?: PHFlagOptions,
	) {
		const overrides = await readOverrides();
		if (overrides && key in overrides.flags) {
			return overrides.flags[key];
		}
		return original.getFeatureFlag(key, distinctId, opts);
	} as any;

	ph.getFeatureFlagPayload = async function getFeatureFlagPayload(
		key: string,
		distinctId: string,
		matchValue?: boolean | string | null,
		opts?: { onlyEvaluateLocally?: boolean },
	) {
		const overrides = await readOverrides();
		if (overrides && key in overrides.flags) {
			return overrides.payloads[key] ?? null;
		}
		// If matchValue is undefined, try to avoid an extra network call by fetching flag first
		const mv =
			typeof matchValue === "undefined"
				? await original.getFeatureFlag(key, distinctId, opts)
				: matchValue;
		return original.getFeatureFlagPayload(key, distinctId, mv, opts);
	} as any;

	ph.getAllFlags = async function getAllFlags(
		distinctId: string,
		opts?: PHFlagOptions,
	) {
		const base = await original.getAllFlags(distinctId, opts);
		const overrides = await readOverrides();
		return overrides ? { ...base, ...overrides.flags } : base;
	} as any;

	return ph;
}
