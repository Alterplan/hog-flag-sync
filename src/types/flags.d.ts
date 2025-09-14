export type OverridesBag = {
	flags: Record<string, boolean | string | null>;
	payloads: Record<string, unknown>;
};

// Options aligned with posthog-node APIs
export type PHFlagOptions = {
	groups?: Record<string, string>;
	personProperties?: Record<string, string>;
	groupProperties?: Record<string, Record<string, string>>;
	// Common optional flags supported by various calls
	onlyEvaluateLocally?: boolean;
	sendFeatureFlagEvents?: boolean;
	// getAllFlags specific
	disableGeoip?: boolean;
	flagKeys?: string[];
};
