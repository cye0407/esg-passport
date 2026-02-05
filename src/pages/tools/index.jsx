import { Link } from 'react-router-dom';
import { Calculator, Leaf, Zap, Droplets, Trash2, Clock, Award } from 'lucide-react';

const tools = [
  {
    id: 'carbon',
    name: 'Carbon Footprint Calculator',
    description: 'Calculate your Scope 1 and Scope 2 emissions from energy, gas, and fuel consumption.',
    icon: Leaf,
    path: '/tools/carbon-calculator',
    color: 'bg-emerald-500',
  },
  {
    id: 'ecovadis',
    name: 'EcoVadis Readiness Assessment',
    description: 'Take a quick quiz to estimate your EcoVadis medal level and identify gaps.',
    icon: Award,
    path: '/tools/ecovadis-readiness',
    color: 'bg-amber-500',
  },
  {
    id: 'scope2',
    name: 'Scope 2 Emissions Calculator',
    description: 'Calculate location-based and market-based Scope 2 emissions from electricity.',
    icon: Zap,
    path: '/tools/scope2-calculator',
    color: 'bg-blue-500',
  },
  {
    id: 'water',
    name: 'Water Intensity Calculator',
    description: 'Calculate water consumption per employee and compare to industry benchmarks.',
    icon: Droplets,
    path: '/tools/water-calculator',
    color: 'bg-cyan-500',
  },
  {
    id: 'waste',
    name: 'Waste Diversion Calculator',
    description: 'Calculate your recycling and diversion rate with visual breakdown.',
    icon: Trash2,
    path: '/tools/waste-calculator',
    color: 'bg-orange-500',
  },
  {
    id: 'time',
    name: 'Questionnaire Time Estimator',
    description: 'Estimate how long it will take to complete ESG questionnaires based on your readiness.',
    icon: Clock,
    path: '/tools/time-estimator',
    color: 'bg-purple-500',
  },
];

export default function ToolsIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#2D5016] font-semibold text-lg">
            <Leaf className="w-6 h-6" />
            ESG Passport
          </Link>
          <Link
            to="/onboarding"
            className="px-4 py-2 bg-[#2D5016] text-white rounded-lg text-sm font-medium hover:bg-[#3d6b1e] transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full text-sm text-gray-600 mb-4">
            <Calculator className="w-4 h-4" />
            Free ESG Tools
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ESG Calculators for Suppliers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Free tools to help you calculate emissions, benchmark your performance,
            and prepare for ESG questionnaires. No signup required.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-[#7CB342] transition-all duration-200"
            >
              <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#2D5016]">
                {tool.name}
              </h2>
              <p className="text-gray-600 text-sm">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#2D5016] to-[#4a7c28] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Want to save your calculations?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Create your free ESG Passport to track your data over time,
            generate questionnaire answers, and export professional reports.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2D5016] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Your ESG Passport
            <Leaf className="w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Free ESG calculators for suppliers. Built by{' '}
            <Link to="/" className="text-[#2D5016] hover:underline">
              ESG Passport
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
