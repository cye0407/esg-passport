import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Zap, 
  Droplets, 
  Trash2, 
  Users, 
  ShieldCheck, 
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Calculator,
  Building2,
} from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    content: [
      {
        question: 'What is ESG Passport?',
        answer: 'ESG Passport helps you collect, organize, and share your company\'s sustainability data. When customers send you questionnaires about your environmental and social practices, you\'ll have your data ready to respond quickly and confidently.'
      },
      {
        question: 'Who is this for?',
        answer: 'Small and medium businesses (10-250 employees) who receive sustainability questionnaires from their B2B customers. If you\'ve ever scrambled to answer questions about your carbon footprint, waste management, or workplace policies, this tool is for you.'
      },
      {
        question: 'How often should I update my data?',
        answer: 'Monthly is ideal for operational data (energy, water, waste). Workforce numbers can be updated quarterly. Policies should be reviewed annually or when changes occur.'
      },
    ]
  },
  {
    id: 'energy',
    title: 'Energy & Emissions',
    icon: Zap,
    content: [
      {
        question: 'Where do I find my electricity consumption?',
        answer: 'Check your electricity bills or utility provider\'s online portal. Look for kWh (kilowatt-hours) consumed. If you have multiple meters or locations, sum them together.'
      },
      {
        question: 'What about natural gas?',
        answer: 'Gas bills show consumption in kWh or cubic meters (m³). If in m³, multiply by 11.2 to convert to kWh. This covers heating, cooking, and industrial processes.'
      },
      {
        question: 'How do I track vehicle fuel?',
        answer: 'Sum up fuel receipts or use fleet management records. Track liters of diesel or petrol purchased for company vehicles. Don\'t include employee commuting here—that\'s Scope 3.'
      },
      {
        question: 'What\'s the renewable percentage?',
        answer: 'If you have a green energy tariff, check what percentage is certified renewable. If you have solar panels, calculate what portion of your total electricity they provide.'
      },
      {
        question: 'How are emissions calculated?',
        answer: 'ESG Passport automatically calculates your Scope 1 (gas, fuel) and Scope 2 (electricity) emissions using standard emission factors. The grid factor depends on your country—select it in Settings.'
      },
    ]
  },
  {
    id: 'water',
    title: 'Water',
    icon: Droplets,
    content: [
      {
        question: 'Where do I find water consumption?',
        answer: 'Check your water utility bills for cubic meters (m³) consumed. If you have multiple sites, sum them. 1 m³ = 1,000 liters.'
      },
      {
        question: 'What if I don\'t have a water meter?',
        answer: 'Some buildings include water in rent. Ask your landlord for consumption data, or estimate based on employee count (average office use: ~50 liters/person/day × working days).'
      },
    ]
  },
  {
    id: 'waste',
    title: 'Waste',
    icon: Trash2,
    content: [
      {
        question: 'How do I measure total waste?',
        answer: 'Check invoices from your waste collection service—they often include weight (kg) or bin volume. If only volume, use: general waste ~200 kg/m³, paper ~100 kg/m³.'
      },
      {
        question: 'What counts as recycled waste?',
        answer: 'Paper/cardboard, plastics, glass, metals sent for recycling. If your collector provides a breakdown, use that. Your recycling rate = (recycled kg ÷ total kg) × 100.'
      },
      {
        question: 'What\'s hazardous waste?',
        answer: 'Batteries, electronics (WEEE), chemicals, fluorescent tubes, oils. These require special disposal. Check certificates from licensed hazardous waste handlers.'
      },
    ]
  },
  {
    id: 'workforce',
    title: 'Workforce',
    icon: Users,
    content: [
      {
        question: 'What\'s FTE?',
        answer: 'Full-Time Equivalent. One full-time employee = 1 FTE. Part-time workers are proportional (e.g., 20 hrs/week = 0.5 FTE). This standardizes headcount across different work arrangements.'
      },
      {
        question: 'Why track gender breakdown?',
        answer: 'Many frameworks (GRI, CSRD) require gender diversity reporting. It\'s a standard metric for social sustainability and helps demonstrate inclusive hiring practices.'
      },
      {
        question: 'Should I include contractors?',
        answer: 'Generally, report direct employees only. Long-term contractors (6+ months, working on-site) may be included separately. Be consistent in your approach and note it.'
      },
    ]
  },
  {
    id: 'health-safety',
    title: 'Health & Safety',
    icon: ShieldCheck,
    content: [
      {
        question: 'What counts as a work accident?',
        answer: 'Incidents causing injury that require medical attention or time off work. Include accidents on company premises and during work activities. Minor first-aid incidents are typically excluded.'
      },
      {
        question: 'Why track hours worked?',
        answer: 'To calculate accident rates (LTIR = Lost Time Injury Rate). Formula: (accidents × 200,000) ÷ hours worked. This normalizes safety performance across different company sizes.'
      },
    ]
  },
  {
    id: 'policies',
    title: 'Policies & Documents',
    icon: FileText,
    content: [
      {
        question: 'Which policies do I need?',
        answer: 'At minimum: Environmental Policy, Health & Safety Policy, Code of Conduct. Customers often also ask for: Anti-Corruption Policy, Data Privacy Policy, Supplier Code of Conduct, and Diversity & Inclusion Policy.'
      },
      {
        question: 'What if we don\'t have a policy?',
        answer: 'Mark it as "Not Started" and consider it a gap to address. Many customers accept "in development" as a response if you can provide a timeline. We provide templates to help you get started.'
      },
      {
        question: 'What does "Approved" vs "Published" mean?',
        answer: 'Draft = work in progress. Under Review = being checked by management. Approved = signed off by leadership. Published = communicated to employees/public. Most customers want at least "Approved" status.'
      },
    ]
  },
  {
    id: 'confidence',
    title: 'Data Confidence',
    icon: Calculator,
    content: [
      {
        question: 'What is data confidence?',
        answer: 'A self-assessment of how reliable your data is. High = from verified sources (invoices, meters). Medium = from reasonable estimates or partial records. Low = rough guesses or outdated info.'
      },
      {
        question: 'What makes data "Safe to Share"?',
        answer: 'Data marked as Complete AND with High or Medium confidence. This means you\'ve collected the data and trust it enough to share with customers. Low confidence data should be improved before sharing.'
      },
      {
        question: 'How do I improve confidence?',
        answer: 'Get data from primary sources (bills, meters, official records). Document your methodology. Keep records consistent month-to-month. When estimating, note your assumptions.'
      },
    ]
  },
  {
    id: 'frameworks',
    title: 'Common Frameworks',
    icon: Building2,
    content: [
      {
        question: 'What is EcoVadis?',
        answer: 'A sustainability ratings platform used by large companies to assess suppliers. They score you on Environment, Labor & Human Rights, Ethics, and Sustainable Procurement. Your ESG Passport data directly supports EcoVadis responses.'
      },
      {
        question: 'What is CDP?',
        answer: 'The Carbon Disclosure Project—a global system for companies to report environmental impacts. CDP questionnaires focus heavily on climate (emissions, energy, targets) and water. More detailed than typical supplier questionnaires.'
      },
      {
        question: 'What is CSRD/VSME?',
        answer: 'The Corporate Sustainability Reporting Directive (EU) and its Voluntary SME Standard. Large EU companies must report sustainability data—and they\'ll ask suppliers (you) for data too. VSME is the simplified version for SMEs.'
      },
      {
        question: 'What is GRI?',
        answer: 'Global Reporting Initiative—the most widely used sustainability reporting standards. GRI provides detailed metrics for environmental, social, and governance topics. Many customer questionnaires are based on GRI indicators.'
      },
    ]
  },
];

export default function Guide() {
  const [expandedSection, setExpandedSection] = useState('getting-started');
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleQuestion = (sectionId, questionIdx) => {
    const key = `${sectionId}-${questionIdx}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Guide
        </h1>
        <p className="text-[#2D5016]/70 mt-1">Learn what data to collect and why it matters</p>
      </div>

      {/* Quick Tip */}
      <div className="glass-card rounded-xl p-4 bg-amber-50/50 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#2D5016]/80">
          <p className="font-medium text-[#2D5016]">Pro Tip</p>
          <p>Start with what you have. Even partial data is better than none. You can improve data quality over time—the important thing is to begin tracking consistently.</p>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-3">
        {GUIDE_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <div key={section.id} className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#2D5016]/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2D5016]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#2D5016]" />
                  </div>
                  <span className="font-medium text-[#2D5016]">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-[#2D5016]/50" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#2D5016]/50" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {section.content.map((item, idx) => {
                    const qKey = `${section.id}-${idx}`;
                    const isQuestionExpanded = expandedQuestions[qKey];
                    
                    return (
                      <div key={idx} className="border border-[#2D5016]/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(section.id, idx)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-[#2D5016]/5 transition-colors"
                        >
                          <span className="text-sm font-medium text-[#2D5016]">{item.question}</span>
                          {isQuestionExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#2D5016]/50 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#2D5016]/50 flex-shrink-0" />
                          )}
                        </button>
                        {isQuestionExpanded && (
                          <div className="px-3 pb-3">
                            <p className="text-sm text-[#2D5016]/70 leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
