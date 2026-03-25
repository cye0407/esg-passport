import React from 'react';
import { FolderOpen } from 'lucide-react';
import DocumentsSection from '@/components/settings/DocumentsSection';

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Documents
        </h1>
        <p className="text-slate-500 text-sm mt-1">Register certificates, audit reports, and evidence</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-none p-6">
        <DocumentsSection />
      </div>
    </div>
  );
}
