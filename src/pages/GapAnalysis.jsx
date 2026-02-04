import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '@/api/db';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Leaf,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  FileCheck,
  Upload,
  Trash2,
  X
} from 'lucide-react';

const topicContent = {
  'E1': {
    description: 'Track your energy consumption and carbon emissions from electricity, heating, fuel, and business travel.',
    checklist: [
      '12 months of electricity bills',
      'Natural gas/heating oil usage',
      'Company vehicle fuel records',
      'Business travel data (flights, trains)',
      'Energy efficiency initiatives'
    ]
  },
  'E5': {
    description: 'Track waste generation, recycling rates, and circular economy initiatives in your operations.',
    checklist: [
      'Waste generation records by type',
      'Recycling and recovery rates',
      'Hazardous waste disposal documentation',
      'Product lifecycle assessments',
      'Circular economy initiatives'
    ]
  },
  'S1': {
    description: 'Document employee health, safety, working conditions, training, and diversity.',
    checklist: [
      'Total employee count',
      'Employee turnover rate',
      'Safety incidents and near-misses',
      'Training hours per employee',
      'Diversity metrics (gender, age)'
    ]
  },
  'S2': {
    description: 'Monitor labor practices, working conditions, and human rights in your supply chain.',
    checklist: [
      'Supplier code of conduct',
      'Supplier audit results',
      'Supply chain risk assessments',
      'Labor rights policies',
      'Child labor and forced labor checks'
    ]
  },
  'S3': {
    description: 'Document your impact on local communities, stakeholder engagement, and consumer protection measures.',
    checklist: [
      'Community impact assessments',
      'Stakeholder engagement records',
      'Consumer complaints and resolution',
      'Product safety documentation',
      'Local hiring and procurement data'
    ]
  },
  'G1': {
    description: 'Show how your business maintains ethical practices, anti-corruption policies, and data protection.',
    checklist: [
      'Code of conduct document',
      'Anti-bribery policy',
      'Data privacy policy (GDPR compliance)',
      'Whistleblower mechanism',
      'Conflict of interest procedures'
    ]
  }
};

export default function GapAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [materialTopics, setMaterialTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [gapAnalyses, setGapAnalyses] = useState({});
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTopic && gapAnalyses[selectedTopic.id]) {
      setCurrentAnalysis(gapAnalyses[selectedTopic.id]);
    } else if (selectedTopic) {
      setCurrentAnalysis({
        topic_id: selectedTopic.id,
        company_id: companyId,
        rag_status: null,
        notes: '',
        checklist: {}
      });
    }
    
    if (selectedTopic && companyId) {
      loadDocuments();
    }
  }, [selectedTopic, gapAnalyses]);

  const loadDocuments = async () => {
    try {
      const docs = await db.entities.Document.filter({
        company_id: companyId,
        topic_id: selectedTopic.id
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadData = async () => {
    try {
      const user = await db.auth.me();
      
      if (!user?.company_id) {
        navigate('/setup');
        return;
      }

      setCompanyId(user.company_id);

      const topics = await db.entities.MaterialTopic.filter({ 
        company_id: user.company_id,
        is_material: true
      });
      
      if (topics.length === 0) {
        navigate('/materiality');
        return;
      }

      setMaterialTopics(topics);
      setSelectedTopic(topics[0]);

      const analyses = await db.entities.GapAnalysis.filter({ 
        company_id: user.company_id 
      });
      
      const analysesMap = {};
      analyses.forEach(a => {
        analysesMap[a.topic_id] = a;
      });
      setGapAnalyses(analysesMap);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRagStatusChange = async (status) => {
    const updated = { ...currentAnalysis, rag_status: status };
    setCurrentAnalysis(updated);
    await saveAnalysis(updated);
  };

  const handleNotesChange = (notes) => {
    const updated = { ...currentAnalysis, notes };
    setCurrentAnalysis(updated);
  };

  const handleChecklistToggle = async (item) => {
    const checklist = currentAnalysis.checklist || {};
    const updated = {
      ...currentAnalysis,
      checklist: {
        ...checklist,
        [item]: !checklist[item]
      }
    };
    setCurrentAnalysis(updated);
    await saveAnalysis(updated);
  };

  const saveAnalysis = async (analysis) => {
    setSaving(true);
    try {
      if (analysis.id) {
        await db.entities.GapAnalysis.update(analysis.id, {
          rag_status: analysis.rag_status,
          notes: analysis.notes,
          checklist: analysis.checklist
        });
      } else {
        const created = await db.entities.GapAnalysis.create({
          company_id: analysis.company_id,
          topic_id: analysis.topic_id,
          rag_status: analysis.rag_status,
          notes: analysis.notes,
          checklist: analysis.checklist
        });
        setCurrentAnalysis({ ...analysis, id: created.id });
        setGapAnalyses({ ...gapAnalyses, [analysis.topic_id]: created });
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    await saveAnalysis(currentAnalysis);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name} is not a supported file type.`);
          continue;
        }

        const { file_url } = await db.files.upload(file);
        
        await db.entities.Document.create({
          company_id: companyId,
          topic_id: selectedTopic.id,
          filename: file.name,
          file_url: file_url,
          file_size: file.size,
          file_type: file.type
        });
      }
      
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await db.entities.Document.delete(docId);
      await loadDocuments();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return '📊';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('image')) return '🖼️';
    return '📎';
  };

  const getTopicContent = (topicCode) => {
    return topicContent[topicCode] || {
      description: 'Assess your current practices and data readiness for this sustainability topic.',
      checklist: [
        'Relevant policies and procedures',
        'Historical data records',
        'Responsible personnel identified',
        'Monitoring systems in place',
        'Stakeholder engagement process'
      ]
    };
  };

  const getRagIcon = (status) => {
    switch (status) {
      case 'green': return { icon: CheckCircle2, color: 'text-green-600' };
      case 'amber': return { icon: AlertCircle, color: 'text-amber-500' };
      case 'red': return { icon: AlertCircle, color: 'text-red-600' };
      default: return { icon: CircleDot, color: 'text-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex items-center gap-3">
          <Leaf className="w-8 h-8 text-[#2D5016]" />
          <span className="text-[#2D5016] font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const content = selectedTopic ? getTopicContent(selectedTopic.topic_code) : null;
  const RagIcon = currentAnalysis?.rag_status ? getRagIcon(currentAnalysis.rag_status).icon : null;
  const ragIconColor = currentAnalysis?.rag_status ? getRagIcon(currentAnalysis.rag_status).color : '';

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)]">
      {/* Left Sidebar */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="glass-card rounded-2xl p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-[#2D5016]" />
            <h2 className="font-semibold text-[#2D5016]">Material Topics</h2>
          </div>
          <div className="space-y-2">
            {materialTopics.map((topic) => {
              const analysis = gapAnalyses[topic.id];
              const StatusIcon = analysis?.rag_status ? getRagIcon(analysis.rag_status).icon : CircleDot;
              const statusColor = analysis?.rag_status ? getRagIcon(analysis.rag_status).color : 'text-gray-300';
              
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all duration-200",
                    selectedTopic?.id === topic.id
                      ? "bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white shadow-lg"
                      : "bg-white/50 hover:bg-white/80 text-[#2D5016]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{topic.topic_code}: {topic.topic_name}</div>
                      <div className={cn("text-xs", selectedTopic?.id === topic.id ? "text-white/80" : "text-[#2D5016]/60")}>
                        {analysis?.rag_status ? <span className="capitalize">{analysis.rag_status} status</span> : 'Not assessed'}
                      </div>
                    </div>
                    <StatusIcon className={cn("w-5 h-5 flex-shrink-0", selectedTopic?.id === topic.id ? "text-white" : statusColor)} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Detail View */}
      <div className="flex-1 overflow-y-auto">
        {selectedTopic && content && (
          <div className="space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white text-sm font-medium mb-3">
                    {selectedTopic.topic_code}
                  </div>
                  <h1 className="text-2xl font-bold text-[#2D5016]">{selectedTopic.topic_name}</h1>
                </div>
                {RagIcon && (
                  <div className="flex items-center gap-2">
                    <RagIcon className={cn("w-6 h-6", ragIconColor)} />
                    {saving && <Loader2 className="w-4 h-4 text-[#2D5016]/50 animate-spin" />}
                  </div>
                )}
              </div>

              {/* RAG Status Selector */}
              <div>
                <label className="text-sm font-medium text-[#2D5016] mb-3 block">Readiness Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {['red', 'amber', 'green'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleRagStatusChange(status)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200",
                        currentAnalysis?.rag_status === status
                          ? status === 'red' ? "border-red-500 bg-red-50" 
                            : status === 'amber' ? "border-amber-500 bg-amber-50"
                            : "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      {status === 'green' ? (
                        <CheckCircle2 className={cn("w-6 h-6 mx-auto mb-2", currentAnalysis?.rag_status === status ? "text-green-600" : "text-gray-400")} />
                      ) : (
                        <AlertCircle className={cn("w-6 h-6 mx-auto mb-2", currentAnalysis?.rag_status === status ? (status === 'red' ? "text-red-600" : "text-amber-500") : "text-gray-400")} />
                      )}
                      <div className={cn("text-sm font-medium capitalize", currentAnalysis?.rag_status === status ? (status === 'red' ? "text-red-700" : status === 'amber' ? "text-amber-700" : "text-green-700") : "text-gray-600")}>
                        {status}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {status === 'red' ? 'Not ready' : status === 'amber' ? 'In progress' : 'Ready'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* What This Means */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[#2D5016] mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                What This Means
              </h3>
              <p className="text-[#2D5016]/80 leading-relaxed">{content.description}</p>
            </div>

            {/* Data Checklist */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[#2D5016] mb-4">What Data You'll Need</h3>
              <div className="space-y-3">
                {content.checklist.map((item, index) => (
                  <label key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors cursor-pointer">
                    <Checkbox
                      checked={currentAnalysis?.checklist?.[item] || false}
                      onCheckedChange={() => handleChecklistToggle(item)}
                      className="mt-0.5 border-[#2D5016]/30 data-[state=checked]:bg-[#7CB342] data-[state=checked]:border-[#7CB342]"
                    />
                    <span className="text-[#2D5016]/80">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[#2D5016] mb-3">Notes</h3>
              <Textarea
                value={currentAnalysis?.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add notes about your progress, challenges, or next steps..."
                className="min-h-32 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342] resize-none"
              />
              <p className="text-xs text-[#2D5016]/50 mt-2">Notes are auto-saved when you click away</p>
            </div>

            {/* Upload Evidence */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Evidence
              </h3>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                  dragActive ? "border-[#7CB342] bg-[#7CB342]/10" : "border-[#2D5016]/20 hover:border-[#2D5016]/40 bg-white/50"
                )}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#2D5016] animate-spin" />
                    <p className="text-sm text-[#2D5016]/70">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#2D5016]/40 mx-auto mb-3" />
                    <p className="text-sm text-[#2D5016] mb-2">Drag and drop files here, or</p>
                    <label className="cursor-pointer">
                      <span className="text-sm text-[#7CB342] font-medium hover:underline">browse files</span>
                      <input type="file" multiple accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(Array.from(e.target.files))} className="hidden" />
                    </label>
                    <p className="text-xs text-[#2D5016]/50 mt-2">PDF, Excel, Word, PNG, JPG</p>
                  </>
                )}
              </div>

              {documents.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-[#2D5016] mb-3">Uploaded Files ({documents.length})</p>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">
                      <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D5016] truncate">{doc.filename}</p>
                        <div className="flex items-center gap-3 text-xs text-[#2D5016]/60 mt-1">
                          <span>{new Date(doc.created_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {deleteConfirm === doc.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button onClick={() => handleDeleteDocument(doc.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-gray-200"><X className="w-3 h-3 text-gray-600" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(doc.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
