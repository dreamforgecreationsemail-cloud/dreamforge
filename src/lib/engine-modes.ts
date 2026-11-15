// src/lib/engine-modes.ts
// Deployment-mode constants for the media pipeline.
//
// These lived nowhere in the Lovable export. The pasted pipeline
// code imported them from './dreamforge' — which is src/lib/dreamforge.ts,
// the MODES / CREW / SKIT data file. Importing them from there was a
// self-import in the pasted file, and would have broken the real
// dreamforge.ts if it had been overwritten. They live here now,
// in their own module, and dreamforge.ts is untouched.

export const ENGINE_MODES = {
  UNRESTRICTED_DEVELOPER_SANDBOX: "unrestricted-developer-sandbox",
  PUBLIC_TESTER: "public-tester",
} as const;

export type EngineMode =
  (typeof ENGINE_MODES)[keyof typeof ENGINE_MODES];

// Founders Edition: unrestricted developer sandbox.
// Consumer tiers / restrictions do not belong in this project.
export const ACTIVE_DEPLOYMENT_MODE: EngineMode =
  ENGINE_MODES.UNRESTRICTED_DEVELOPER_SANDBOX;
