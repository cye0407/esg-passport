import { describe, expect, it } from 'vitest';
import {
  SECRET_SETTINGS_FIELDS,
  mergeImportedBackup,
  redactSecretsForBackup,
  serializeBackup,
} from '../backup';

const LIVE_KEY = 'sk-ant-api03-THIS-IS-A-LIVE-CREDENTIAL';

const workspace = () => ({
  company: { name: 'Hartmann Präzisionstechnik GmbH' },
  records: [{ period: '2025-03', energy: { electricityKwh: 41200 } }],
  settings: {
    language: 'de',
    aiProvider: 'claude',
    aiApiKey: LIVE_KEY,
  },
});

describe('backup export never carries credentials', () => {
  it('drops the AI API key from the exported file', () => {
    const exported = JSON.parse(serializeBackup(workspace()));
    expect(exported.settings.aiApiKey).toBeUndefined();
    expect(serializeBackup(workspace())).not.toContain(LIVE_KEY);
  });

  it('keeps everything that is not a credential', () => {
    const exported = JSON.parse(serializeBackup(workspace()));
    expect(exported.company.name).toBe('Hartmann Präzisionstechnik GmbH');
    expect(exported.records[0].energy.electricityKwh).toBe(41200);
    expect(exported.settings.language).toBe('de');
    expect(exported.settings.aiProvider).toBe('claude');
  });

  it('does not modify the workspace it was handed', () => {
    const data = workspace();
    serializeBackup(data);
    expect(data.settings.aiApiKey).toBe(LIVE_KEY);
  });

  it.each([
    'apiKey',
    'api_key',
    'openaiToken',
    'clientSecret',
    'smtpPassword',
    'bearerToken',
    'credentials',
  ])('drops a credential-shaped field a future version might add: %s', field => {
    const data = { ...workspace(), settings: { ...workspace().settings, [field]: 'leaked-value' } };
    expect(serializeBackup(data)).not.toContain('leaked-value');
  });

  it('strips credentials nested anywhere, not just under settings', () => {
    const data = {
      ...workspace(),
      integrations: [{ name: 'buyer-portal', apiKey: 'nested-secret' }],
    };
    const exported = redactSecretsForBackup(data);
    expect(JSON.stringify(exported)).not.toContain('nested-secret');
    expect(exported.integrations[0].name).toBe('buyer-portal');
  });
});

describe('importing a backup keeps the local key', () => {
  it('preserves an API key that is already configured on this device', () => {
    const imported = JSON.parse(serializeBackup(workspace()));
    const merged = mergeImportedBackup(imported, {
      settings: { aiApiKey: 'sk-ant-local-device-key' },
    });
    expect(merged.settings.aiApiKey).toBe('sk-ant-local-device-key');
  });

  it('leaves the key unset when this device has none', () => {
    const imported = JSON.parse(serializeBackup(workspace()));
    const merged = mergeImportedBackup(imported, { settings: {} });
    expect(merged.settings.aiApiKey).toBeUndefined();
  });

  it('never lets a key travel in from the imported file', () => {
    const hostile = { ...workspace(), settings: { ...workspace().settings, aiApiKey: 'sk-ant-attacker' } };
    const merged = mergeImportedBackup(hostile, { settings: {} });
    expect(JSON.stringify(merged)).not.toContain('sk-ant-attacker');
  });

  it('takes the imported workspace content', () => {
    const imported = JSON.parse(serializeBackup(workspace()));
    const merged = mergeImportedBackup(imported, { settings: { aiApiKey: 'x' } });
    expect(merged.records[0].energy.electricityKwh).toBe(41200);
  });

  it('has a redaction list that covers every field the app writes a secret to', () => {
    expect(SECRET_SETTINGS_FIELDS).toContain('aiApiKey');
  });
});
