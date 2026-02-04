import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '@/api/db';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FolderOpen,
  Leaf,
  Trash2,
  Search,
  File,
  X,
  Filter
} from 'lucide-react';

export default function DocumentHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [materialTopics, setMaterialTopics] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [selectedTopic, searchQuery, documents]);

  const loadData = async () => {
    try {
      const user = await db.auth.me();
      
      if (!user?.company_id) {
        navigate('/setup');
        return;
      }

      setCompanyId(user.company_id);

      const docs = await db.entities.Document.filter({ 
        company_id: user.company_id 
      });
      setDocuments(docs);

      const topics = await db.entities.MaterialTopic.filter({ 
        company_id: user.company_id,
        is_material: true
      });
      setMaterialTopics(topics);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(doc => doc.topic_id === selectedTopic);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.filename.toLowerCase().includes(query)
      );
    }

    setFilteredDocs(filtered);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await db.entities.Document.delete(docId);
      const updatedDocs = documents.filter(d => d.id !== docId);
      setDocuments(updatedDocs);
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

  const getTopicName = (topicId) => {
    const topic = materialTopics.find(t => t.id === topicId);
    return topic ? `${topic.topic_code}: ${topic.topic_name}` : 'Unknown Topic';
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2D5016] flex items-center gap-3">
          <FolderOpen className="w-8 h-8" />
          Document Hub
        </h1>
        <p className="text-[#2D5016]/70 mt-2">
          All evidence and documentation for your ESG compliance
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D5016]/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-10 h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#2D5016]/40" />
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {materialTopics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.topic_code}: {topic.topic_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents */}
      {filteredDocs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <File className="w-16 h-16 text-[#2D5016]/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#2D5016] mb-2">
            {documents.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}
          </h3>
          <p className="text-[#2D5016]/60">
            {documents.length === 0 
              ? 'Upload evidence files from the Gap Analysis screen for each material topic.'
              : 'Try adjusting your filters or search query.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-[#2D5016]">
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
              >
                <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D5016] truncate mb-1">
                    {doc.filename}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#2D5016]/60">
                    <span>{getTopicName(doc.topic_id)}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {deleteConfirm === doc.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
