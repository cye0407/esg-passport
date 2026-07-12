import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';

const PRO_PLUS_CHECKOUT = 'https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970';

export default function ExtractorUpgradeCard({ tier }) {
  const { t } = useLanguage();
  const headline = t('ext.headline');
  const body = tier === 'pro' ? t('ext.bodyPro') : t('ext.bodyDefault');

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
            href={PRO_PLUS_CHECKOUT}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('checkout_opened', { source: 'extractor_upgrade_card', from_tier: tier })}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5"
          >
            {t('ext.cta')}
            <ArrowRight className="w-4 h-4" />
          </a>
          {tier === 'pro' && (
            <p className="text-xs text-slate-400 mt-2">
              {t('ext.upgradeRatePre')}{' '}
              <a href="mailto:contact@esgforsuppliers.com" className="underline">contact@esgforsuppliers.com</a>
              {' '}{t('ext.upgradeRatePost')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
