import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { PASSPORT_CHECKOUT_URL } from '@/lib/checkout';

export default function ExtractorUpgradeCard({ tier }) {
  const { t } = useLanguage();
  // Only `free` ever sees this card: Data.jsx renders it when canExtractDocuments
  // is false, and every paid tier - Questionnaire Pass included - has extraction.
  // The old `tier === 'pro'` branch offered a Passport owner an upgrade to the
  // Passport, left over from when extraction sat behind the retired Pro+ tier.
  const headline = t('ext.headline');
  const body = t('ext.bodyDefault');

  return (
    <div className="border-2 border-dashed border-slate-300 bg-white p-6">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="w-10 h-10 flex items-center justify-center bg-slate-900 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{headline}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{body}</p>
          <a
            href={PASSPORT_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('checkout_opened', { source: 'extractor_upgrade_card', from_tier: tier })}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5"
          >
            {t('ext.cta')}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
