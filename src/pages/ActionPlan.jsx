import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '@/api/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Leaf,
  Loader2,
  ListTodo,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Trash2
} from 'lucide-react';

export default function ActionPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [materialTopics, setMaterialTopics] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    topic_id: '',
    due_date: '',
    status: 'todo',
    priority: 'medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await db.auth.me();
      
      if (!user?.company_id) {
        navigate('/setup');
        return;
      }

      setCompanyId(user.company_id);
      setUserId(user.id);

      const topics = await db.entities.MaterialTopic.filter({ 
        company_id: user.company_id,
        is_material: true
      });
      setMaterialTopics(topics);

      const actionItems = await db.entities.ActionItem.filter({ 
        company_id: user.company_id 
      });
      setTasks(actionItems);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTask) {
        await db.entities.ActionItem.update(editingTask.id, {
          ...formData,
          assignee_user_id: userId
        });
      } else {
        await db.entities.ActionItem.create({
          company_id: companyId,
          ...formData,
          assignee_user_id: userId
        });
      }

      const updatedTasks = await db.entities.ActionItem.filter({ 
        company_id: companyId 
      });
      setTasks(updatedTasks);
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await db.entities.ActionItem.update(taskId, { status: newStatus });
      const updatedTasks = await db.entities.ActionItem.filter({ 
        company_id: companyId 
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await db.entities.ActionItem.delete(taskId);
      const updatedTasks = await db.entities.ActionItem.filter({ 
        company_id: companyId 
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      task_name: '',
      description: '',
      topic_id: '',
      due_date: '',
      status: 'todo',
      priority: 'medium'
    });
    setEditingTask(null);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setFormData({
      task_name: task.task_name,
      description: task.description || '',
      topic_id: task.topic_id || '',
      due_date: task.due_date || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium'
    });
    setDialogOpen(true);
  };

  const getTopicName = (topicId) => {
    const topic = materialTopics.find(t => t.id === topicId);
    return topic ? `${topic.topic_code}: ${topic.topic_name}` : '';
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.due_date && b.due_date) {
      return new Date(a.due_date) - new Date(b.due_date);
    }
    return 0;
  });

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2D5016] flex items-center gap-3">
            <ListTodo className="w-8 h-8" />
            Action Plan
          </h1>
          <p className="text-[#2D5016]/70 mt-2">
            Track tasks and deadlines for your ESG compliance
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl">
              <Plus className="w-5 h-5 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Related Topic</Label>
                  <Select value={formData.topic_id} onValueChange={(value) => setFormData({ ...formData, topic_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTopics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.topic_code}: {topic.topic_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full bg-[#2D5016] hover:bg-[#3d6b1e]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="glass-card rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#2D5016]">Filter:</span>
          <div className="flex gap-2">
            {['all', 'todo', 'in_progress', 'done'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  filterStatus === status
                    ? "bg-[#2D5016] text-white"
                    : "bg-white/50 text-[#2D5016] hover:bg-white"
                )}
              >
                {status === 'all' ? 'All' : status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {sortedTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ListTodo className="w-16 h-16 text-[#2D5016]/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#2D5016] mb-2">No Tasks Yet</h3>
          <p className="text-[#2D5016]/60">Create your first task to start tracking your ESG progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div key={task.id} className="glass-card rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                    className="mt-1"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#7CB342]" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#2D5016]/30 hover:text-[#7CB342] transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={cn("font-medium", task.status === 'done' ? "text-[#2D5016]/50 line-through" : "text-[#2D5016]")}>
                        {task.task_name}
                      </h3>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      )}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-[#2D5016]/60 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#2D5016]/50">
                      {task.topic_id && <span>{getTopicName(task.topic_id)}</span>}
                      {task.due_date && (
                        <span className={cn("flex items-center gap-1", isOverdue && "text-red-600")}>
                          <Clock className="w-3 h-3" />
                          {isOverdue ? 'Overdue: ' : ''}{new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)} className="h-8 px-2">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
