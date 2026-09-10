import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

// The same three steps across the whole free journey, so it is always clear which one
// you are in and what is left. Nothing told you that before, and the job spans three
// screens.
//
// A finished step carries its RESULT rather than a bare tick — "36 questions",
// "2 documents". A tick says you did something; the number says what it got you, which
// is the question someone actually has when they land back here.
export default function JourneySpine({ step, questionCount = 0, documentCount = 0 }) {
  const { t } = useLanguage();

  const steps = [
    {
      label: t('spine.questionnaire'),
      done: step > 1,
      result: questionCount > 0 ? t('spine.questions', { count: questionCount }) : null,
    },
    {
      label: t('spine.evidence'),
      done: step > 2,
      result: documentCount > 0 ? t('spine.documents', { count: documentCount }) : null,
    },
    { label: t('spine.answers'), done: false, result: null },
  ];

  return (
    // Bleeds out of <main>'s padding so it reads as a band under the header rather than
    // a card floating inside the page. Only ever rendered inside that main.
    <div className="-mx-4 -mt-6 mb-6 border-b border-slate-200 bg-white sm:-mx-6 sm:-mt-8 lg:-mx-8">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {steps.map((item, index) => {
          const number = index + 1;
          const current = number === step;
          return (
            <React.Fragment key={item.label}>
              {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
              <div className="flex shrink-0 items-center gap-2.5">
                {item.done ? (
                  <span className="flex h-[22px] w-[22px] items-center justify-center bg-emerald-600">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className={
                      current
                        ? 'flex h-[22px] w-[22px] items-center justify-center bg-slate-900 text-xs font-semibold text-white'
                        : 'flex h-[22px] w-[22px] items-center justify-center border border-slate-300 text-xs font-semibold text-slate-400'
                    }
                  >
                    {number}
                  </span>
                )}
                <span
                  className={
                    current
                      ? 'whitespace-nowrap text-sm font-semibold text-slate-900'
                      : item.done
                        ? 'whitespace-nowrap text-sm text-slate-600'
                        : 'whitespace-nowrap text-sm text-slate-400'
                  }
                >
                  {item.label}
                  {item.result && <span className="text-slate-500"> — {item.result}</span>}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
