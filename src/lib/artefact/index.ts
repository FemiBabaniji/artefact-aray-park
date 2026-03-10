// ════════════════════════════════════════════════════════════════════════════
// Artefact System - Barrel Export
// ════════════════════════════════════════════════════════════════════════════

// P0: Reducer
export {
  reduceEvents,
  createEmptyState,
  validateEventSequence,
  getLatestEventTimestamp,
  getEventsByType,
} from "./reducer";

// P0: Event Store
export {
  EVENT_STORE_KEY,
  loadEventStore,
  saveEventStore,
  clearEventStore,
  createEventStore,
  appendEvent,
  computeState,
  initializeGuestArtefact,
  EventBuilders,
} from "./event-store";

// P3: Output Compilation
export {
  compile,
  compileResume,
  compilePortfolio,
  compileContext,
  compileMCPResource,
  type OutputFormat,
  type ResumeOutput,
  type PortfolioOutput,
  type ContextOutput,
  type MCPResource,
} from "./output";

// P3: Resume HTML Template
export { generateResumeHTML } from "./resume-html";
