// ════════════════════════════════════════════════════════════════════════════
// Artefact System (P0) - Barrel Export
// ════════════════════════════════════════════════════════════════════════════

// Reducer
export {
  reduceEvents,
  createEmptyState,
  validateEventSequence,
  getLatestEventTimestamp,
  getEventsByType,
} from "./reducer";

// Event Store
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
