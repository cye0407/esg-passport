import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as mod from 'response-ready';

// Gate 3 (DESIGN-original-workbook-and-reuse.md §6): a user moves from one computer to
// another with nothing but the pack file. The second machine must recognise the paid
// questionnaire, hold the approved answers as priors, and know the policies — without
// an account and without anything having been stored anywhere else.

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

// jsdom's Blob has no arrayBuffer(); every browser's does. FileReader is what jsdom has.
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

const { saveAs } = await import('file-saver');
const { buildPackFromStore, saveResponsePackFile, openResponsePackFile, priorAnswersFromPack, packAnswersInStore } = await import('../responsePack');
const { loadData, saveData } = await import('../store');
const { claimQuestionnaire, getQuestionnairePassClaim, listQuestionnairePassClaims } = await import('../questionnairePass');

function seedFirstMachine() {
  localStorage.clear();
  const data = loadData();
  data.companyProfile = { legalName: 'Muster Technik GmbH', countryOfIncorporation: 'DE', updatedAt: '2026-09-01T00:00:00.000Z' };
  data.policies = [{ id: 'code-of-conduct', name: 'Code of Conduct', status: 'available', fileLocation: 'CoC_v3.pdf', updatedAt: '2026-03-15T00:00:00.000Z' }];
  data.savedResults = [{
    id: 'res_1', name: 'nordhavn-2025.xlsx', createdAt: '2025-09-30T10:00:00.000Z', questionnaireFingerprint: 'qfp-v1-21-abc',
    answers: [
      { questionId: 'a', questionText: 'Do you have a written environmental policy?', answer: 'Yes', answerConfidence: 'high', category: 'Company & Governance' },
      { questionId: 'b', questionText: 'Number of employees (FTE)', answer: '142', answerConfidence: 'medium', _edited: true },
      { questionId: 'c', questionText: 'Describe your biodiversity strategy.', answer: 'This information is not currently tracked.', answerConfidence: 'none' },
    ],
  }];
  data.settings.dataSources = { electricityKwh: 'Stadtwerke_2025.pdf' };
  saveData(data);
  claimQuestionnaire({ licenseKeyId: 884213, fingerprint: 'qfp-v1-21-abc', displayName: 'Nordhavn 2025', claimedAt: '2025-09-30T10:00:00.000Z' });
}

describe('buildPackFromStore', () => {
  beforeEach(seedFirstMachine);

  it('takes the approved answers, the policies and the pass claims — and not the unanswered draft', () => {
    const pack = buildPackFromStore(mod, new Date('2026-09-13T10:00:00.000Z'));
    expect(pack.company).toEqual({ name: 'Muster Technik GmbH', country: 'DE', reportingPeriods: [] });
    expect(pack.answers.map(a => a.answer)).toEqual(['Yes', '142']);
    expect(pack.answers[0]).toMatchObject({ normalizedKey: 'do you have a written environmental policy', source: { type: 'questionnaire', name: 'nordhavn-2025.xlsx' }, sourceDate: '2025-09-30', approvedAt: '2025-09-30T10:00:00.000Z' });
    expect(pack.answers[1].edited).toBe(true);
    expect(pack.policies[0]).toMatchObject({ id: 'code-of-conduct', status: 'available', file: 'CoC_v3.pdf' });
    expect(pack.passClaims).toEqual([{ licenceRef: '884213', fingerprint: 'qfp-v1-21-abc', displayName: 'Nordhavn 2025', claimedAt: '2025-09-30T10:00:00.000Z' }]);
    expect(pack.documents).toEqual([{ name: 'Stadtwerke_2025.pdf', sha256: '', extractedFields: ['electricityKwh'], addedAt: '2026-09-13T10:00:00.000Z' }]);
  });

  it('never serialises anything credential-shaped from the store', async () => {
    const data = loadData();
    data.settings.aiApiKey = 'sk-must-not-leave';
    saveData(data);
    const text = mod.serializeResponsePack(buildPackFromStore(mod));
    expect(text).not.toContain('sk-must-not-leave');
    expect(text).not.toMatch(/apiKey|licenseKey|license_key/);
  });
});

describe('the second machine', () => {
  beforeEach(seedFirstMachine);

  it('recognises the paid questionnaire and holds the answers as priors from the file alone', async () => {
    const saved = await saveResponsePackFile(mod);
    expect(saved).toMatchObject({ encrypted: false, answers: 2, passClaims: 1 });
    expect(saved.fileName).toBe('Muster-Technik-GmbH.responsepack.json');
    const blob = saveAs.mock.calls[0][0];
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // the other computer: nothing here
    localStorage.clear();
    expect(getQuestionnairePassClaim(884213)).toBeNull();
    expect(packAnswersInStore()).toEqual([]);

    const result = await openResponsePackFile(mod, new File([bytes], saved.fileName));
    expect(result).toMatchObject({ answersImported: 2, claimsAdded: 1, policiesUpdated: 1, company: 'Muster Technik GmbH' });
    expect(getQuestionnairePassClaim(884213)).toMatchObject({ fingerprint: 'qfp-v1-21-abc' });
    expect(loadData().policies.find(p => p.id === 'code-of-conduct')).toMatchObject({ status: 'available', fileLocation: 'CoC_v3.pdf' });
    expect(loadData().companyProfile.legalName).toBe('Muster Technik GmbH');

    const priors = priorAnswersFromPack(packAnswersInStore());
    expect(priors).toHaveLength(2);
    expect(priors[0]).toMatchObject({ question: 'Do you have a written environmental policy?', answer: 'Yes', sourceFile: 'nordhavn-2025.xlsx', approved: true });
    // and the matcher can use them straight away
    const [m] = mod.matchPriorAnswers([{ id: 'q', text: 'Do you have a written environmental policy?', rawRow: {}, rowIndex: 0 }], priors);
    expect(m?.tier).toBe('exact');
  });

  it('opens an encrypted pack with the passphrase and refuses without one', async () => {
    const saved = await saveResponsePackFile(mod, { passphrase: 'correct horse battery staple' });
    expect(saved.encrypted).toBe(true);
    expect(saved.fileName).toBe('Muster-Technik-GmbH.responsepack.enc');
    const bytes = new Uint8Array(await saveAs.mock.calls.at(-1)[0].arrayBuffer());
    localStorage.clear();
    await expect(openResponsePackFile(mod, new File([bytes], saved.fileName))).rejects.toMatchObject({ code: 'encrypted' });
    await expect(openResponsePackFile(mod, new File([bytes], saved.fileName), { passphrase: 'wrong' })).rejects.toMatchObject({ code: 'wrong-passphrase' });
    const result = await openResponsePackFile(mod, new File([bytes], saved.fileName), { passphrase: 'correct horse battery staple' });
    expect(result.claimsAdded).toBe(1);
  });

  it('never lets an opened pack override a claim this device already holds', async () => {
    const saved = await saveResponsePackFile(mod);
    const bytes = new Uint8Array(await saveAs.mock.calls.at(-1)[0].arrayBuffer());
    // this device spent the same licence on a different questionnaire
    localStorage.clear();
    claimQuestionnaire({ licenseKeyId: 884213, fingerprint: 'qfp-v1-29-other', displayName: 'Other' });
    const result = await openResponsePackFile(mod, new File([bytes], saved.fileName));
    expect(result.claimsAdded).toBe(0);
    expect(listQuestionnairePassClaims()).toEqual([{ licenceRef: '884213', fingerprint: 'qfp-v1-29-other', displayName: 'Other', claimedAt: expect.any(String) }]);
  });
});
