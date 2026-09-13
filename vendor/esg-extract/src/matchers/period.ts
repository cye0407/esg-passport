const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', 'mär': '03', apr: '04', mai: '05', may: '05',
  jun: '06', jul: '07', aug: '08', sep: '09', okt: '10', oct: '10',
  nov: '11', dez: '12', dec: '12',
};

/** Detect coverage, preferring explicit ranges over invoice and creation dates. */
export function detectReportingPeriod(text: string): string | undefined {
  return detectReportingPeriodDetails(text)?.period;
}

export interface ReportingPeriodDetails {
  period: string;
  periodStart: string;
  periodEnd: string;
  coveredMonths: string[];
}

export function detectReportingPeriodDetails(text: string): ReportingPeriodDetails | undefined {
  const iso = /(20[2-3]\d)-(\d{2})-\d{2}\s*(?:to|bis|au|–|—|-)\s*(20[2-3]\d)-(\d{2})-\d{2}/i.exec(text);
  if (iso) return rangeDetails(iso[1], iso[2], iso[3], iso[4]);

  const eu = /\d{1,2}\.(\d{1,2})\.(20[2-3]\d)\s*(?:to|bis|au|–|—|-)\s*\d{1,2}\.(\d{1,2})\.(20[2-3]\d)/i.exec(text);
  if (eu) return rangeDetails(eu[2], eu[1], eu[4], eu[3]);

  const named = /\b(jan(?:uar[iy]?)?|feb(?:ruar[iy]?)?|m[aä]r[czs]?|apr(?:il)?|ma[iy]|jun[ei]?|jul[iy]?|aug(?:ust)?|sep(?:tember)?|o[ck]t(?:ober)?|nov(?:ember)?|de[czs](?:ember)?)\s*(20[2-3]\d)\b/i.exec(text);
  if (named) {
    const month = MONTHS[named[1].substring(0, 3).toLowerCase()];
    if (month) return rangeDetails(named[2], month, named[2], month);
  }
  const year = /\b(20[2-3]\d)\b/.exec(text)?.[1];
  return year ? rangeDetails(year, '01', year, '12') : undefined;
}

function rangeDetails(startYear: string, startMonthRaw: string, endYear: string, endMonthRaw: string): ReportingPeriodDetails {
  const startMonth = startMonthRaw.padStart(2, '0');
  const endMonth = endMonthRaw.padStart(2, '0');
  const periodStart = `${startYear}-${startMonth}`;
  const periodEnd = `${endYear}-${endMonth}`;
  const monthCount = Math.max(1,
    (Number(endYear) - Number(startYear)) * 12 + Number(endMonth) - Number(startMonth) + 1);
  const coveredMonths = Array.from({ length: monthCount }, (_, index) => {
    const zeroBased = Number(startMonth) - 1 + index;
    const year = Number(startYear) + Math.floor(zeroBased / 12);
    const month = zeroBased % 12 + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  });
  const period = startYear === endYear && startMonth === '01' && endMonth === '12'
    ? startYear
    : `${startYear}-${startMonth}`;
  return { period, periodStart, periodEnd, coveredMonths };
}
