// Release 1: thin slice, fully connected experience.
// Scope follows the Release 1 slide. Anything switched off here stays in the codebase for later releases.
export const RELEASE = { name: 'Release 1', label: 'Thin slice · fully connected' }

// Service lines in Release 1
export const ACTIVE_LINES = ['Radiopharma', 'Clinical Supply Logistics'] as const
export const isActiveLine = (name: string) => /radiopharma|clinical supply/i.test(name)

export const FEATURES = {
  storage: false,          // Depot and inventory: out of scope for Release 1
  recommended: false,      // Service upsell catalogue on the Overview: later release
  voice: true,             // Cora with speech recognition and spoken replies
  chatAndCall: false,      // Support chat and request a call: out of scope (cases and Cora remain)
  tour: false,             // Onboarding: out of scope
  security: false,         // Security and sessions settings: later release
  packagingTracking: false,// Packaging asset tracking: out of scope
  brokerage: true,         // Brokerage (OK to Send): in scope
  insightsPages: ['overview', 'kpis', 'sustainability', 'spend'] as const, // Data: Live KPIs, Sustainability, Spend and value
}
