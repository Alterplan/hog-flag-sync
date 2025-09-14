// Central export of package version (inlined for client components)
// This file is tree-shakable and small.
// Using TypeScript resolveJsonModule
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pkg from "../package.json";
export const HFS_TOOLBAR_VERSION: string = (pkg as any).version;
