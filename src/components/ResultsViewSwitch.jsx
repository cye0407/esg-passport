import React from 'react';

// Two faces of the same finished questionnaire, for a reader who has paid.
//
// The drafts are what they bought, so that is where they land. The report answers the
// other question they have at this point — what is still open before I send this — and
// it used to be reachable only by not having paid, which was backwards: the person
// chasing a colleague for the waste manifest against a deadline is the buyer, not the
// visitor.
export default function ResultsViewSwitch({ value, onChange, t }) {
  const option = (key, label) => (
    <button
      key={key}
      onClick={() => onChange(key)}
      aria-pressed={value === key}
      className={`h-9 px-4 text-sm font-medium transition-colors ${
        value === key
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex border border-slate-300">
      {option('answers', t('respond.viewAnswers'))}
      {option('report', t('respond.viewReport'))}
    </div>
  );
}
