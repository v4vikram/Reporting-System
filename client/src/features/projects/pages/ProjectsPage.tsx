import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce.ts';
import Modal from '../../../components/Modal.tsx';
import ProjectForm from '../components/ProjectForm.tsx';
import { Project } from '../../../types/index.ts';
import { useProjects, useDeleteProject } from '../../../hooks/useProjects.ts';

export default function Projects() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const { data, isLoading } = useProjects({ page, search: debouncedSearch, limit: 8 });
  const deleteMutation = useDeleteProject();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary">Manage and track your client projects.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
          className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-accent/10"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input 
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg outline-none focus:ring-1 focus:ring-accent transition-all text-text-primary placeholder:text-text-secondary/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-bg transition-colors text-text-secondary">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-text-secondary text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Project Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created By</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                  </td>
                </tr>
              ) : data?.projects.map((project: Project) => (
                <tr key={project._id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{project.title}</p>
                      <p className="text-xs text-text-secondary truncate max-w-xs">{project.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">{project.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{project.time || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'completed' ? 'bg-success/10 text-success' :
                      project.status === 'active' ? 'bg-accent/10 text-accent' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-border rounded-full flex items-center justify-center text-[10px] font-bold text-text-secondary">
                        {project.createdBy?.name[0]}
                      </div>
                      <span className="text-sm text-text-secondary">{project.createdBy?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(project.createdAt!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(project)}
                        className="p-2 hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(project._id)}
                        className="p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between bg-white/2">
          <p className="text-xs text-text-secondary">
            Showing <span className="font-medium text-text-primary">{(page - 1) * 8 + 1}</span> to <span className="font-medium text-text-primary">{Math.min(page * 8, data?.total || 0)}</span> of <span className="font-medium text-text-primary">{data?.total || 0}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-border rounded-lg hover:bg-bg disabled:opacity-30 transition-colors text-text-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page === data?.pages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-border rounded-lg hover:bg-bg disabled:opacity-30 transition-colors text-text-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <ProjectForm 
            project={editingProject} 
            onClose={() => setIsFormOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to delete this project? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (projectToDelete) {
                  deleteMutation.mutate(projectToDelete, {
                    onSuccess: () => {
                      setIsDeleteModalOpen(false);
                      setProjectToDelete(null);
                    }
                  });
                }
              }}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
