import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal.tsx';
import { Project } from '../../../types/index.ts';
import { useCreateProject, useUpdateProject } from '../../../hooks/useProjects.ts';

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
}

export default function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'active' | 'completed'>('pending');
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      // Normalize old `on_hold` records to `pending` for compatibility.
      setStatus(project.status === 'on_hold' ? 'pending' : (project.status as 'pending' | 'active' | 'completed'));
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      updateMutation.mutate({ id: project._id, data: { title, description, status } }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate({ title, description, status }, {
        onSuccess: () => onClose()
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={project ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none min-h-[100px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'pending' | 'active' | 'completed')}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
