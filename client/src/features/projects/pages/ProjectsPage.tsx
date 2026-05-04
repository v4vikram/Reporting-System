import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Calendar,
  User,
} from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce.ts';
import Modal from '../../../components/Modal.tsx';
import ProjectForm from '../components/ProjectForm.tsx';
import { Project } from '../../../types/index.ts';
import { useProjects, useDeleteProject } from '../../../hooks/useProjects.ts';

/* ─── Helpers ────────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-border/60 ${className}`} />
);

const STATUS_CONFIG: Record<string, { label: string; style: string; dot: string }> = {
  active:    { label: 'Active',    style: 'bg-accent/15 text-accent ring-1 ring-accent/30',         dot: 'bg-accent' },
  completed: { label: 'Completed', style: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30', dot: 'bg-emerald-400' },
  pending:   { label: 'Pending',   style: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',   dot: 'bg-orange-400' },
};
const getStatus = (s: string) =>
  STATUS_CONFIG[s] ?? { label: s, style: 'bg-border/20 text-text-secondary ring-1 ring-border', dot: 'bg-border' };

const PAGE_SIZE = 8;

/* ─── Avatar initial ─────────────────────────────────────── */
function Avatar({ name }: { name?: string }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="w-7 h-7 rounded-full bg-accent/20 ring-1 ring-accent/30 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
      {initial}
    </div>
  );
}

/* ─── Mobile card ────────────────────────────────────────── */
function ProjectCard({
  project,
  index,
  onEdit,
  onDelete,
}: {
  project: Project;
  index: number;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const st = getStatus(project.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all duration-200 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{project.title}</p>
          {project.description && (
            <p className="text-xs text-text-secondary line-clamp-2 mt-0.5 leading-snug">
              {project.description}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${st.style}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-text-secondary/70">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <Avatar name={project.createdBy?.name} />
          {project.createdBy?.name ?? '—'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <button
          onClick={() => onEdit(project)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <div className="w-px h-4 bg-border/60" />
        <button
          onClick={() => onDelete(project._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Projects() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const { data, isLoading } = useProjects({ page, search: debouncedSearch, limit: PAGE_SIZE });
  const deleteMutation = useDeleteProject();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setProjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!projectToDelete) return;
    deleteMutation.mutate(projectToDelete, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
      },
    });
  };

  const projects: Project[] = data?.projects ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.pages ?? 1;
  const isEmpty = !isLoading && projects.length === 0;

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-accent/70 mb-0.5">
            Workspace
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" />
            Projects
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage and track your client projects.
          </p>
        </div>

        <button
          onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-accent/30 hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* ── Container ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">

        {/* Search + filter bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-xl text-text-primary placeholder:text-text-secondary/40 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-bg hover:border-accent/30 transition-all text-text-secondary shrink-0">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* ── Desktop table (md+) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/40">
                {['Project', 'Created', 'Updated', 'Status', 'Owner', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-md" /></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><Skeleton className="w-7 h-7 rounded-full" /><Skeleton className="h-4 w-24" /></div></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="w-8 h-8 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : isEmpty ? null : (
                projects.map((project, i) => {
                  const st = getStatus(project.status);
                  return (
                    <motion.tr
                      key={project._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group hover:bg-accent/5 transition-colors"
                    >
                      {/* Project name */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-sm font-bold text-text-primary truncate">{project.title}</p>
                        {project.description && (
                          <p className="text-xs text-text-secondary truncate mt-0.5">{project.description}</p>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Updated */}
                      <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${st.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={project.createdBy?.name} />
                          <span className="text-sm text-text-secondary truncate max-w-[8rem]">
                            {project.createdBy?.name ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(project._id)}
                            className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>

          {isEmpty && (
            <div className="py-16 flex flex-col items-center gap-3 text-text-secondary">
              <FolderOpen className="w-10 h-10 opacity-20" />
              <p className="text-sm">No projects found{search ? ' for your search' : ''}.</p>
            </div>
          )}
        </div>

        {/* ── Mobile cards (< md) ── */}
        <div className="md:hidden p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between gap-2">
                  <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div>
                  <Skeleton className="h-5 w-20 rounded-md shrink-0" />
                </div>
                <div className="flex gap-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))
          ) : isEmpty ? (
            <div className="py-14 flex flex-col items-center gap-3 text-text-secondary border border-border rounded-xl">
              <FolderOpen className="w-9 h-9 opacity-20" />
              <p className="text-sm">No projects found{search ? ' for your search' : ''}.</p>
            </div>
          ) : (
            projects.map((project, i) => (
              <ProjectCard
                key={project._id}
                project={project}
                index={i}
                onEdit={handleEdit}
                onDelete={confirmDelete}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {!isEmpty && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg/20">
            <p className="text-xs text-text-secondary order-2 sm:order-1">
              {total === 0 ? 'No results' : (
                <>
                  Showing{' '}
                  <span className="font-semibold text-text-primary">{from}</span>–
                  <span className="font-semibold text-text-primary">{to}</span>{' '}
                  of{' '}
                  <span className="font-semibold text-text-primary">{total}</span> projects
                </>
              )}
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-border rounded-lg hover:bg-bg hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-text-secondary/50">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
                          page === p
                            ? 'bg-accent text-white shadow-sm shadow-accent/30'
                            : 'text-text-secondary hover:bg-bg border border-border hover:border-accent/30'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-border rounded-lg hover:bg-bg hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Project form modal ── */}
      <AnimatePresence>
        {isFormOpen && (
          <ProjectForm
            project={editingProject}
            onClose={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Delete confirmation modal ── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary leading-snug">
              Are you sure you want to delete this project? This action{' '}
              <span className="font-semibold text-red-400">cannot be undone</span>.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-red-500/20"
            >
              {deleteMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              ) : (
                <><Trash2 className="w-4 h-4" />Delete Project</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}