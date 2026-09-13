// The response pack, at the app's edge. The engine owns the format (response-ready
// responsePack: create / serialise / parse / merge / encrypt); this module says what goes
// into it from this browser's store, what an opened pack does to the store, and how the
// answers in a pack become prior answers for the next questionnaire.
//
// It is the record the company keeps instead of an account: one file, saved where they
// choose, opened on any machine. What never goes in: document bytes (only names and the
// fields read from them), and anything credential-shaped — the engine strips those on
// serialise, and backup.js's rule applies on top.
//
// The one thing that MUST travel with it: the questionnaire pass claims. The €99 pass is
// a licence reference plus a fingerprint of the questionnaire it was spent on, held in
// localStorage; without them a second machine would refuse the very questionnaire the
// user paid to finish. See questionnairePass.js.

import { saveAs } from 'file-saver';
import { loadData, saveData, getCompanyProfile, getPolicies, getSettings } from '@/lib/store';
import { buildCompanyData } from '@/lib/dataBridge';
import { listQuestionnairePassClaims, importQuestionnairePassClaims } from '@/lib/questionnairePass';

const FACT_KEYS = [
  'employeeCount', 'numberOfSites', 'electricityKwh', 'renewablePercent', 'naturalGasM3', 'dieselLiters',
  'scope1Tco2e', 'scope2Tco2e', 'waterM3', 'totalWasteKg', 'recyclingPercent', 'hazardousWasteKg',
  'femalePercent', 'womenInLeadershipPercent', 'turnoverRate', 'trainingHours', 'lostTimeIncidents',
  'recordableIncidents', 'fatalities', 'hoursWorked', 'collectiveBargainingPercent',
];

function iso(value, fallback) {
  return typeof value === 'string' && value ? value : fallback;
}

/** What this browser holds, as a pack. `mod` is the response-ready module. */
export function buildPackFromStore(mod, now = new Date()) {
  const data = loadData();
  const profile = getCompanyProfile() || {};
  const settings = getSettings() || {};
  const companyData = buildCompanyData() || {};
  const stamp = now.toISOString();
  const dataSources = settings.dataSources || {};

  const periods = [...new Set((data.dataRecords || []).map(r => String(r.period || '').slice(0, 4)).filter(Boolean))].sort();

  const facts = FACT_KEYS
    .filter(key => companyData[key] !== undefined && companyData[key] !== null && companyData[key] !== '')
    .map(key => ({
      key,
      value: companyData[key],
      period: companyData.reportingPeriod || undefined,
      source: dataSources[key] ? { type: 'document', name: dataSources[key] } : undefined,
      approvedAt: iso(profile.updatedAt, stamp),
    }));

  // Every saved result is a questionnaire the user finished (results are saved only past
  // the paid line). Its high and medium answers, and anything they edited, are what they
  // stood behind; low and absent drafts were never answers.
  const answers = [];
  for (const result of data.savedResults || []) {
    for (const a of result.answers || []) {
      const approved = a._edited || a.answerConfidence === 'high' || a.answerConfidence === 'medium';
      if (!approved || !a.answer) continue;
      answers.push({
        question: a.questionText,
        normalizedKey: mod.normalizeAnswerKey(a.questionText),
        answer: a.verifiedAnswer || a.answer,
        category: a.category,
        source: a.source === 'previous' && a.sourceRef
          ? { type: 'questionnaire', name: a.sourceRef.file, sheet: a.sourceRef.sheet, row: a.sourceRef.row, referenceId: a.sourceRef.referenceId }
          : { type: 'questionnaire', name: result.name },
        sourceDate: a.sourceDate || iso(result.createdAt, stamp).slice(0, 10),
        approvedAt: iso(result.createdAt, stamp),
        edited: !!a._edited,
      });
    }
  }
  // Answers already imported from a pack stay in the pack.
  for (const a of data.responsePackAnswers || []) answers.push(a);

  const policies = (getPolicies() || []).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status || 'not_available',
    adoptedOn: p.adoptedOn || undefined,
    reviewDue: p.reviewDue || undefined,
    file: p.fileLocation || undefined,
    updatedAt: iso(p.updatedAt, stamp),
  }));

  const passClaims = listQuestionnairePassClaims().map(c => ({
    licenceRef: c.licenceRef, fingerprint: c.fingerprint, displayName: c.displayName, claimedAt: c.claimedAt,
  }));

  const documents = [...new Set(Object.values(dataSources))].map(name => ({
    name,
    sha256: '',
    extractedFields: Object.entries(dataSources).filter(([, n]) => n === name).map(([field]) => field),
    addedAt: stamp,
  }));

  return mod.createResponsePack({
    company: {
      name: profile.tradingName || profile.legalName || companyData.companyName || '',
      country: profile.countryOfIncorporation || undefined,
      reportingPeriods: periods,
    },
    facts, answers, policies, passClaims, documents,
    certificates: [],
    rejected: [],
  }, now);
}

/** Save the pack as a file: plain JSON, or encrypted when a passphrase is given. */
export async function saveResponsePackFile(mod, { passphrase } = {}) {
  const pack = buildPackFromStore(mod);
  const encrypted = !!passphrase;
  const bytes = encrypted
    ? await mod.encryptResponsePack(pack, passphrase)
    : new TextEncoder().encode(mod.serializeResponsePack(pack));
  const fileName = mod.responsePackFileName(pack.company.name, encrypted);
  saveAs(new Blob([bytes], { type: encrypted ? 'application/octet-stream' : 'application/json' }), fileName);
  return { fileName, encrypted, answers: pack.answers.length, facts: pack.facts.length, passClaims: pack.passClaims.length };
}

/**
 * Open a pack and merge it into this browser: policies by id (newer wins), the answers
 * kept as prior answers for the next questionnaire, the pass claims re-entered, and
 * company profile fields filled where this browser had none. Facts are kept in the pack
 * and not written into the monthly data grid — that is a different model and a different
 * decision. Throws the engine's ResponsePackError ('encrypted', 'wrong-passphrase',
 * 'not-a-pack', 'unsupported-version', 'malformed').
 */
export async function openResponsePackFile(mod, file, { passphrase } = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const imported = await mod.openResponsePack(bytes, passphrase);
  const current = buildPackFromStore(mod);
  const merged = mod.mergeResponsePacks(current, imported);

  const data = loadData();
  const byId = new Map((data.policies || []).map(p => [p.id, p]));
  let policiesUpdated = 0;
  for (const p of merged.policies) {
    const have = byId.get(p.id);
    if (!have || (p.updatedAt || '') > (have.updatedAt || '')) {
      byId.set(p.id, { ...(have || {}), id: p.id, name: p.name ?? have?.name, status: p.status, fileLocation: p.file ?? have?.fileLocation ?? '', adoptedOn: p.adoptedOn, reviewDue: p.reviewDue, updatedAt: p.updatedAt });
      policiesUpdated += 1;
    }
  }
  data.policies = [...byId.values()];
  data.responsePackAnswers = merged.answers;
  if (!data.companyProfile?.legalName && imported.company?.name) {
    data.companyProfile = { ...(data.companyProfile || {}), legalName: imported.company.name, countryOfIncorporation: data.companyProfile?.countryOfIncorporation || imported.company.country, updatedAt: new Date().toISOString() };
  }
  saveData(data);
  const claimsAdded = importQuestionnairePassClaims(imported.passClaims || []);

  return {
    answers: merged.answers.length,
    answersImported: imported.answers.length,
    policiesUpdated,
    claimsAdded,
    company: imported.company?.name || '',
  };
}

/** The answers a pack holds, as prior answers the matcher can use. */
export function priorAnswersFromPack(answers) {
  return (answers || []).map((a, i) => ({
    id: `pack:${a.normalizedKey || i}`,
    question: a.question,
    answer: a.answer,
    referenceId: a.source?.referenceId || a.referenceId,
    category: a.category,
    sourceFile: a.source?.name || 'response pack',
    sourceSheet: a.source?.sheet,
    sourceRow: a.source?.row,
    sourceDate: a.sourceDate,
    approved: true,
  }));
}

export function packAnswersInStore() {
  return loadData().responsePackAnswers || [];
}
