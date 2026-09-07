// Which ESG topic a question belongs to, from the domain the matcher assigned it.
//
// The coverage report used to group questions by how confident the ENGINE was —
// answered / written / cannot answer. Nobody opening a questionnaire thinks that way.
// They think "there is a load of workforce stuff in here and I have none of it". So the
// report groups by topic, the way the customer asking the questions groups them, and
// confidence stays where it belongs: on each individual answer.
//
// Written as a table with a test per domain. Every domain the ESG pack can emit appears
// exactly once — a test asserts that against the live pack, so a new domain fails the
// suite instead of silently landing in "other".

export const TOPIC_ORDER = Object.freeze(['environmental', 'social', 'governance', 'other']);

const DOMAIN_TOPIC = Object.freeze({
  // What the business consumes and emits.
  energy_electricity: 'environmental',
  energy_fuel: 'environmental',
  energy_water: 'environmental',
  emissions: 'environmental',
  waste: 'environmental',
  effluents: 'environmental',
  materials: 'environmental',
  packaging: 'environmental',
  transport: 'environmental',
  infrastructure: 'environmental',

  // People.
  workforce: 'social',
  health_safety: 'social',
  training: 'social',

  // How the business governs itself and its suppliers.
  regulatory: 'governance',
  buyer_requirements: 'governance',
  goals: 'governance',
  swot: 'governance',

  // Who the business IS. Not governance — "how many operational sites do you have" is a
  // profile question, and filing it under ethics would be a tidier lie.
  company: 'other',
  site: 'other',
  products: 'other',
  external_context: 'other',
  financial_context: 'other',
});

/** The topic for a matcher domain. An unmatched question is 'other', never guessed at. */
export function topicForDomain(domain) {
  return DOMAIN_TOPIC[domain] || 'other';
}

/** Every domain the table covers — used by the test that keeps it in step with the pack. */
export function mappedDomains() {
  return Object.keys(DOMAIN_TOPIC);
}
