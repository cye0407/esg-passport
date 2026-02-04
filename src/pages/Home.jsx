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
  FileText,
  Inbox,
  Download,
  ArrowRight,
  CheckCircle2,
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
  
  // Check what data we have
  const hasCurrentMonthData = dataRecords.some(r => r.period === currentPeriod);
  const hasLastMonthData = dataRecords.some(r => r.period === lastMonth);
  const hasAnyData = dataRecords.length > 0;
  const monthsTracked = dataRecords.length;
  
  // Determine the "next action" month
  const getNextDataMonth = () => {
    if (!hasCurrentMonthData) return { period: currentPeriod, label: 'this month' };
    if (!hasLastMonthData) return { period: lastMonth, label: 'last month' };
    // Find oldest missing month in current year
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
  
  // Open requests
  const openRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'sent');
  const upcomingDeadlines = openRequests
    .filter(r => r.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  
  const urgentDeadlines = upcomingDeadlines.filter(r => {
    const days = Math.ceil((new Date(r.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  });

  // Calculate overall readiness score
  const readinessScore = Math.round(
    (stats.dataSafePercent * 0.4) + 
    (stats.policyCompletionPercent * 0.4) + 
    ((dataRecords.length > 0 ? 100 : 0) * 0.2)
  );

  const formatNumber = (num, decimals = 0) => {
    if (num == null) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
  };

  // Determine primary CTA based on user state
  const getPrimaryCTA = () => {
    // Priority 1: Urgent deadlines
    if (urgentDeadlines.length > 0) {
      return {
        type: 'urgent',
        title: `${urgentDeadlines.length} urgent deadline${urgentDeadlines.length > 1 ? 's' : ''}`,
        description: `${urgentDeadlines[0].customerName} response due soon`,
        action: 'View Request',
        href: `/requests/${urgentDeadlines[0].id}`,
        icon: AlertTriangle,
        color: 'from-red-500 to-orange-500',
      };
    }
    
    // Priority 2: First time user - no data at all
    if (!hasAnyData) {
      return {
        type: 'first-time',
        title: 'Start tracking your sustainability data',
        description: 'Enter your first month of data to build your response-ready profile',
        action: 'Enter Data for ' + MONTHS.find(m => m.value === currentPeriod.split('-')[1])?.label,
        href: '/data',
        icon: Sparkles,
        color: 'from-[#2D5016] to-[#7CB342]',
      };
    }
    
    // Priority 3: Missing current month data
    if (!hasCurrentMonthData) {
      return {
        type: 'monthly-update',
        title: `Time to enter ${MONTHS.find(m => m.value === String(currentMonth).padStart(2, '0'))?.label} data`,
        description: `Keep your profile current - you have ${monthsTracked} month${monthsTracked !== 1 ? 's' : ''} tracked so far`,
        action: 'Enter This Month\'s Data',
        href: '/data',
        icon: CalendarPlus,
        color: 'from-blue-500 to-cyan-500',
      };
    }
    
    // Priority 4: Low confidence data
    if (stats.safeToShareDataPoints < stats.totalDataPoints * 0.5) {
      return {
        type: 'confidence',
        title: 'Improve your data confidence',
        description: `Only ${stats.safeToShareDataPoints} of ${stats.totalDataPoints} data points are safe to share`,
        action: 'Review Data Quality',
        href: '/confidence',
        icon: ShieldCheck,
        color: 'from-yellow-500 to-amber-500',
      };
    }
    
    // Priority 5: Open requests
    if (openRequests.length > 0) {
      return {
        type: 'requests',
        title: `${openRequests.length} open request${openRequests.length > 1 ? 's' : ''}`,
        description: 'You have customer requests awaiting response',
        action: 'View Requests',
        href: '/requests',
        icon: Inbox,
        color: 'from-purple-500 to-indigo-500',
      };
    }
    
    // Default: Everything looks good
    return {
      type: 'ready',
      title: 'You\'re response-ready!',
      description: 'Your sustainability data is up to date. Generate an export when needed.',
      action: 'Generate Export',
      href: '/export',
      icon: Download,
      color: 'from-green-500 to-emerald-500',
    };
  };

  const primaryCTA = getPrimaryCTA();

  return (
    <div className="space-y-6">
      {/* Welcome + Primary CTA */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Welcome Text */}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2D5016] mb-1">
              {company?.tradingName || company?.legalName || 'Welcome'}
            </h1>
            <p className="text-[#2D5016]/60 text-sm">
              Your sustainability data, always ready
            </p>
          </div>
          
          {/* Readiness Score - compact */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="none" className="text-[#2D5016]/10" />
                <circle cx="50%" cy="50%" r="45%" stroke="url(#progressGradient)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${readinessScore * 1.76} 176`} className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2D5016" />
                    <stop offset="100%" stopColor="#7CB342" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#2D5016]">{readinessScore}%</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-[#2D5016]">Response Ready</p>
              <p className="text-[#2D5016]/60">{stats.safeToShareDataPoints}/{stats.totalDataPoints} metrics</p>
            </div>
          </div>
        </div>

        {/* Primary CTA - The big action card */}
        <div className={cn(
          'mt-6 p-5 rounded-xl bg-gradient-to-r text-white',
          primaryCTA.color
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0',
              primaryCTA.type === 'urgent' && 'animate-pulse'
            )}>
              <primaryCTA.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{primaryCTA.title}</h2>
              <p className="text-white/80 text-sm">{primaryCTA.description}</p>
            </div>
            <Link to={primaryCTA.href}>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-0 w-full sm:w-auto">
                {primaryCTA.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/data" className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-purple-600" />
            {!hasCurrentMonthData && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Current month missing" />}
          </div>
          <p className="text-2xl font-bold text-[#2D5016]">{monthsTracked}</p>
          <p className="text-sm text-[#2D5016]/60">Months tracked</p>
        </Link>

        <Link to="/confidence" className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-[#2D5016]">{stats.safeToShareDataPoints}/{stats.totalDataPoints}</p>
          <p className="text-sm text-[#2D5016]/60">Safe to share</p>
        </Link>

        <Link to="/policies" className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#2D5016]">{stats.approvedPolicies}/{stats.totalPolicies}</p>
          <p className="text-sm text-[#2D5016]/60">Policies approved</p>
        </Link>

        <Link to="/requests" className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <Inbox className="w-5 h-5 text-orange-600" />
            {openRequests.length > 0 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{openRequests.length}</span>}
          </div>
          <p className="text-2xl font-bold text-[#2D5016]">{openRequests.length}</p>
          <p className="text-sm text-[#2D5016]/60">Open requests</p>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#2D5016] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/data" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2D5016]/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2D5016]">Enter Monthly Data</p>
                <p className="text-sm text-[#2D5016]/60">
                  {hasCurrentMonthData ? 'Update or review entries' : `Add ${MONTHS.find(m => m.value === String(currentMonth).padStart(2, '0'))?.label} data`}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2D5016]/30 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/confidence" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2D5016]/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2D5016]">Review Data Quality</p>
                <p className="text-sm text-[#2D5016]/60">{stats.totalDataPoints - stats.safeToShareDataPoints} items need attention</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2D5016]/30 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/requests" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2D5016]/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2D5016]">Log Customer Request</p>
                <p className="text-sm text-[#2D5016]/60">Track a new questionnaire</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2D5016]/30 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2D5016]/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2D5016] to-[#7CB342] flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2D5016]">Upload Questionnaire</p>
                <p className="text-sm text-[#2D5016]/60">Generate answers from your data</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2D5016]/30 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/export" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2D5016]/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2D5016]">Generate Export</p>
                <p className="text-sm text-[#2D5016]/60">Download your data summary</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#2D5016]/30 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Upcoming Deadlines / Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
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
                    className="block p-3 rounded-lg border border-[#2D5016]/10 hover:border-[#2D5016]/30 hover:bg-[#2D5016]/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2D5016] truncate">{request.customerName}</p>
                        <p className="text-sm text-[#2D5016]/60">{request.platform || 'Custom request'}</p>
                      </div>
                      {daysUntil !== null && (
                        <div className={cn(
                          'px-2 py-1 rounded text-xs font-medium flex-shrink-0',
                          daysUntil < 0 ? 'bg-red-100 text-red-700' : 
                          isUrgent ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-600'
                        )}>
                          {daysUntil < 0 ? 'Overdue' : `${daysUntil}d`}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {requests.length > 3 && (
                <Link to="/requests" className="block text-center text-sm text-[#2D5016]/60 hover:text-[#2D5016] py-2">
                  View all {requests.length} requests →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#2D5016]/50">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No requests yet</p>
              <Link to="/requests">
                <Button variant="link" className="text-[#2D5016] mt-2">
                  Log your first request
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics (only show if we have data) */}
      {hasAnyData && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {currentYear} Key Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <Zap className="w-5 h-5 text-yellow-600 mb-2" />
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber(annualTotals.totalEnergyKwh)}</p>
              <p className="text-xs text-[#2D5016]/60">kWh Energy</p>
            </div>
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <div className="w-5 h-5 text-gray-600 mb-2 font-bold text-xs flex items-center">CO₂</div>
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber((annualTotals.scope1Tco2e || 0) + (annualTotals.scope2Tco2e || 0), 1)}</p>
              <p className="text-xs text-[#2D5016]/60">tCO₂e Scope 1+2</p>
            </div>
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <Droplets className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber(annualTotals.waterM3)}</p>
              <p className="text-xs text-[#2D5016]/60">m³ Water</p>
            </div>
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <Trash2 className="w-5 h-5 text-amber-600 mb-2" />
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber((annualTotals.totalWasteKg || 0) / 1000, 1)}</p>
              <p className="text-xs text-[#2D5016]/60">t Waste</p>
            </div>
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <Users className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber(annualTotals.totalEmployees) || '-'}</p>
              <p className="text-xs text-[#2D5016]/60">Employees</p>
            </div>
            <div className="p-4 rounded-xl bg-[#2D5016]/5">
              <ShieldCheck className="w-5 h-5 text-red-600 mb-2" />
              <p className="text-lg font-bold text-[#2D5016]">{formatNumber(annualTotals.workAccidents ?? 0)}</p>
              <p className="text-xs text-[#2D5016]/60">Accidents</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
