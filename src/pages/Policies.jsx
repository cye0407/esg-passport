import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import PoliciesSection from '@/components/settings/PoliciesSection';
import { useLanguage } from '@/components/LanguageContext';

export default function Policies() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6" />
          {t('nav.policies')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('pol.subtitle')}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-none p-6">
        <PoliciesSection />
      </div>
    </div>
  );
}
