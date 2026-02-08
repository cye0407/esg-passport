import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getCompanyProfile,
  getReadinessStats,
  getRequests,
  getDataRecords,
  getAnnualTotals,
  getSettings,
} from '@/lib/store';
import { MONTHS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Database,
  ShieldCheck,
  Inbox,
  ArrowRight,
  Clock,
  TrendingUp,
  Zap,
  Droplets,
  Trash2,
  Users,
  Sparkles,
  CalendarPlus,
  AlertTriangle,
  Upload,
} from 'lucide-react';

export default function Home() {
  const settings = getSettings();
  if (!settings.setupCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const company = getCompanyProfile();
  const stats = getReadinessStats();
  const requests = getRequests();
  const dataRecords = getDataRecords();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const lastMonth = currentMonth === 1
    ? `${currentYear - 1}-12`
    : `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}`;

  const annualTotals = getAnnualTotals(currentYear.toString());

  const hasCurrentMonthData = dataRecords.some(r => r.period === currentPeriod);
  const hasLastMonthData = dataRecords.some(r => r.period === lastMonth);
  const hasAnyData = dataRecords.length > 0;
  const monthsTracked = dataRecords.length;

  const getNextDataMonth = () => {
    if (!hasCurrentMonthData) return { period: currentPeriod, label: 'this month' };
    if (!hasLastMonthData) return { period: lastMonth, label: 'last month' };
    for (let m = 1; m <= currentMonth; m++) {
      const period = `${currentYear}-${String(m).padStart(2, '0')}`;
      if (!dataRecords.some(r => r.period === period)) {
        const monthName = MONTHS.find(mo => mo.value === String(m).padStart(2, '0'))?.label;
        return { period, label: monthName };
      }
    }
    return { period: currentPeriod, label: 'this month' };
  };

  const nextDataMonth = getNextDataMonth();

  const openRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'sent');
  const upcomingDeadlines = openRequests
    .filter(r => r.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const urgentDeadlines = upcomingDeadlines.filter(r => {
    const days = Math.ceil((new Date(r.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  });

  const readinessScore = Math.round(
    (stats.dataSafePercent * 0.4) +
    (stats.policyCompletionPercent * 0.4) +
    ((dataRecords.length > 0 ? 100 : 0) * 0.2)
  );

  const formatNumber = (num, decimals = 0) => {
    if (num == null) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
  };

  const getPrimaryCTA = () => {
    if (urgentDeadlines.length > 0) {
      return {
        type: 'urgent',
        title: `${urgentDeadlines.length} urgent deadline${urgentDeadlines.length > 1 ? 's' : ''}`,
        description: `${urgentDeadlines[0].customerName} response due soon`,
        action: 'View Request',
        href: `/requests/${urgentDeadlines[0].id}`,
        icon: AlertTriangle,
        borderColor: 'border-red-500',
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50',
      };
    }
    if (!hasAnyData) {
      return {
        type: 'first-time',
        title: 'Start tracking your sustainability data',
        description: 'Enter your first month of data to build your response-ready profile',
        action: 'Enter Data for ' + MONTHS.find(m => m.value === currentPeriod.split('-')[1])?.label,
        href: '/data',
        icon: Sparkles,
        borderColor: 'border-indigo-600',
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
      };
    }
    if (!hasCurrentMonthData) {
      return {
        type: 'monthly-update',
        title: `Time to enter ${MONTHS.find(m => m.value === String(currentMonth).padStart(2, '0'))?.label} data`,
        description: `Keep your profile current — you have ${monthsTracked} month${monthsTracked !== 1 ? 's' : ''} tracked so far`,
        action: 'Enter This Month\'s Data',
        href: '/data',
        icon: CalendarPlus,
        borderColor: 'border-blue-500',
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
      };
    }
    if (stats.safeToShareDataPoints < stats.totalDataPoints * 0.5) {
      return {
        type: 'confidence',
        title: 'Improve your data confidence',
        description: `Only ${stats.safeToShareDataPoints} of ${stats.totalDataPoints} data points are safe to share`,
        action: 'Review Data Quality',
        href: '/data',
        icon: ShieldCheck,
        borderColor: 'border-amber-500',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-50',
      };
    }
    if (openRequests.length > 0) {
      return {
        type: 'requests',
        title: `${openRequests.length} open request${openRequests.length > 1 ? 's' : ''}`,
        description: 'You have customer requests awaiting response',
        action: 'View Requests',
        href: '/requests',
        icon: Inbox,
        borderColor: 'border-purple-500',
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-50',
      };
    }
    return {
      type: 'ready',
      title: 'You\'re response-ready!',
      description: 'Your sustainability data is up to date. Upload a questionnaire to respond.',
      action: 'Upload Questionnaire',
      href: '/respond',
      icon: Upload,
      borderColor: 'border-green-500',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    };
  };

  const primaryCTA = getPrimaryCTA();

  return (
    <div className="space-y-6">
      {/* Welcome + Primary CTA */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {company?.tradingName || company?.legalName || 'Welcome'}
            </h1>
            <p className="text-slate-500 text-sm">Your sustainability data, always ready</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200" />
                <circle cx="50%" cy="50%" r="45%" stroke="#4F46E5" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${readinessScore * 1.76} 176`} className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{readinessScore}%</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-900">Response Ready</p>
              <p className="text-slate-500">{stats.safeToShareDataPoints}/{stats.totalDataPoints} metrics</p>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className={cn('mt-6 p-4 rounded-none border-l-4 bg-slate-50 border border-slate-200', primaryCTA.borderColor)}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', primaryCTA.iconBg)}>
              <primaryCTA.icon className={cn('w-5 h-5', primaryCTA.iconColor)} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">{primaryCTA.title}</h2>
              <p className="text-slate-500 text-sm">{primaryCTA.description}</p>
            </div>
            <Link to={primaryCTA.href}>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto">
                {primaryCTA.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/data" className="bg-white border border-slate-200 rounded-none p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-slate-400" />
            {!hasCurrentMonthData && <span className="w-2 h-2 rounded-full bg-amber-500" title="Current month missing" />}
          </div>
          <p className="text-2xl font-bold text-slate-900">{monthsTracked}</p>
          <p className="text-sm text-slate-500">Months tracked</p>
        </Link>

        <Link to="/data" className="bg-white border border-slate-200 rounded-none p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.safeToShareDataPoints}/{stats.totalDataPoints}</p>
          <p className="text-sm text-slate-500">Safe to share</p>
        </Link>

        <Link to="/settings" className="bg-white border border-slate-200 rounded-none p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.approvedPolicies}/{stats.totalPolicies}</p>
          <p className="text-sm text-slate-500">Policies approved</p>
        </Link>

        <Link to="/requests" className="bg-white border border-slate-200 rounded-none p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Inbox className="w-5 h-5 text-slate-400" />
            {openRequests.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">{openRequests.length}</span>}
          </div>
          <p className="text-2xl font-bold text-slate-900">{openRequests.length}</p>
          <p className="text-sm text-slate-500">Open requests</p>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-none p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-1">
            <Link to="/data" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Database className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">Enter Monthly Data</p>
                <p className="text-xs text-slate-500">
                  {hasCurrentMonthData ? 'Update or review entries' : `Add ${MONTHS.find(m => m.value === String(currentMonth).padStart(2, '0'))?.label} data`}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link to="/respond" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">Upload Questionnaire</p>
                <p className="text-xs text-slate-500">Generate answers from your data</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link to="/requests" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">Log Customer Request</p>
                <p className="text-xs text-slate-500">Track a new questionnaire</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Deadlines / Requests */}
        <div className="bg-white border border-slate-200 rounded-none p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            {upcomingDeadlines.length > 0 ? 'Upcoming Deadlines' : 'Recent Requests'}
          </h2>

          {requests.length > 0 ? (
            <div className="space-y-3">
              {(upcomingDeadlines.length > 0 ? upcomingDeadlines : requests.slice(0, 3)).map((request) => {
                const daysUntil = request.deadline
                  ? Math.ceil((new Date(request.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;
                const isUrgent = daysUntil !== null && daysUntil <= 7;

                return (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="block p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{request.customerName}</p>
                        <p className="text-xs text-slate-500">{request.platform || 'Custom request'}</p>
                      </div>
                      {daysUntil !== null && (
                        <div className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
                          daysUntil < 0 ? 'bg-red-50 text-red-700' :
                          isUrgent ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {daysUntil < 0 ? 'Overdue' : `${daysUntil}d`}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {requests.length > 3 && (
                <Link to="/requests" className="block text-center text-sm text-slate-500 hover:text-slate-700 py-2">
                  View all {requests.length} requests
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No requests yet</p>
              <Link to="/requests">
                <Button variant="link" className="text-indigo-600 mt-2 text-sm">Log your first request</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics — only show if there's actual data with values */}
      {hasAnyData && annualTotals.totalEnergyKwh > 0 && (
        <div className="bg-white border border-slate-200 rounded-none p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            {currentYear} Key Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <Zap className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-lg font-bold text-slate-900">{formatNumber(annualTotals.totalEnergyKwh)}</p>
              <p className="text-xs text-slate-500">kWh Energy</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <div className="w-4 h-4 text-slate-400 mb-2 font-bold text-[10px] flex items-center">CO2</div>
              <p className="text-lg font-bold text-slate-900">{formatNumber((annualTotals.scope1Tco2e || 0) + (annualTotals.scope2Tco2e || 0), 1)}</p>
              <p className="text-xs text-slate-500">tCO2e Scope 1+2</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <Droplets className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-lg font-bold text-slate-900">{formatNumber(annualTotals.waterM3)}</p>
              <p className="text-xs text-slate-500">m3 Water</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <Trash2 className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-lg font-bold text-slate-900">{formatNumber((annualTotals.totalWasteKg || 0) / 1000, 1)}</p>
              <p className="text-xs text-slate-500">t Waste</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <Users className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-lg font-bold text-slate-900">{formatNumber(annualTotals.totalEmployees) || '-'}</p>
              <p className="text-xs text-slate-500">Employees</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <ShieldCheck className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-lg font-bold text-slate-900">{formatNumber(annualTotals.workAccidents ?? 0)}</p>
              <p className="text-xs text-slate-500">Accidents</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
