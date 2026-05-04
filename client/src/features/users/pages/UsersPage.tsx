import React, { useState } from 'react';
import { Plus, Loader2, User as UserIcon, Edit, Trash2, Eye, EyeOff, Shield, Briefcase, Users as UsersIcon, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from '../../../components/Modal.tsx';
import { useAuthStore } from '../../auth/store/authStore.ts';
import { User } from '../../../types/index.ts';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../../hooks/useUsers.ts';

/* ─── Design tokens ──────────────────────────────────────── */
const baseInput =
  'w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-150 appearance-none';

/* ─── Role config ────────────────────────────────────────── */
const roleConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  super_admin: { label: 'Super Admin', icon: Shield,    cls: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  employee:    { label: 'Employee',    icon: Briefcase, cls: 'bg-blue-500/10   text-blue-500   border-blue-500/20'   },
  client:      { label: 'Client',      icon: UserIcon,  cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
};

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors: Record<string, string> = {
    super_admin: 'bg-violet-500/15 text-violet-600',
    employee:    'bg-blue-500/15   text-blue-600',
    client:      'bg-emerald-500/15 text-emerald-600',
  };
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${colors[role] ?? 'bg-accent/10 text-accent'}`}>
      {initials || <UserIcon className="w-4 h-4" />}
    </div>
  );
}

/* ─── Role badge ─────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const cfg = roleConfig[role] ?? { label: role, icon: UserIcon, cls: 'bg-border/40 text-text-secondary border-border' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
      active
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        : 'bg-red-500/10 text-red-500 border-red-500/20'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ─── Field wrapper ──────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-[11px] font-semibold text-text-secondary uppercase tracking-widest select-none">
        <span>{label}</span>
        {hint && <span className="normal-case font-normal text-text-secondary/50 tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────── */
function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${baseInput} pr-9 cursor-pointer`} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/40" />
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4">
      <p className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
      <p className="text-xs text-text-secondary/50 mt-0.5">{sub}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [editingUser, setEditingUser]       = useState<string | null>(null);
  const [userToDelete, setUserToDelete]     = useState<User | null>(null);
  const [search, setSearch]                 = useState('');
  const [roleFilter, setRoleFilter]         = useState('all');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee', clientId: 'system', isActive: true,
  });

  const { data: users, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'employee', clientId: 'system', isActive: true });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user._id);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, clientId: user.clientId, isActive: user.isActive });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData, clientId: formData.role === 'client' ? formData.clientId : 'system' };
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser, data: submitData }, { onSuccess: closeModal });
    } else {
      createUserMutation.mutate(submitData, { onSuccess: closeModal });
    }
  };

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-text-secondary">
        <Shield className="w-10 h-10 opacity-20" />
        <p className="text-sm font-medium">Unauthorized access</p>
      </div>
    );
  }

  /* Filtered users */
  const filtered = (users ?? []).filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalActive   = (users ?? []).filter(u => u.isActive).length;
  const totalEmployees = (users ?? []).filter(u => u.role === 'employee').length;
  const totalClients   = (users ?? []).filter(u => u.role === 'client').length;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">Users</h1>
            <p className="text-sm text-text-secondary/60 mt-0.5">Manage team members and client accounts</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 active:bg-accent/80 text-white text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:-translate-y-px active:translate-y-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* ── Stats ── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users"  value={users?.length ?? 0} sub="all accounts" />
          <StatCard label="Active"       value={totalActive}        sub="currently active" />
          <StatCard label="Employees"    value={totalEmployees}     sub="team members" />
          <StatCard label="Clients"      value={totalClients}       sub="client accounts" />
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-5 py-4 border-b border-border/60">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className={`${baseInput} pl-9`}
            />
          </div>
          {/* Role filter */}
          <div className="relative sm:w-44">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className={`${baseInput} pr-9 cursor-pointer`}
            >
              <option value="all">All roles</option>
              <option value="employee">Employee</option>
              <option value="client">Client</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/40" />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-secondary">
            <div className="relative w-10 h-10">
              <div className="w-10 h-10 border-2 border-border rounded-full" />
              <div className="absolute inset-0 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
            <UsersIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm font-semibold text-text-primary">No users found</p>
            <p className="text-xs text-text-secondary/50">
              {search || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Add a user to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg/50 border-b border-border/60">
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/60 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/60 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/60 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/60 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-text-secondary/60 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence initial={false}>
                    {filtered.map((user, i) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
                        className="hover:bg-bg/40 transition-colors duration-100 group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} role={user.role} />
                            <div>
                              <p className="text-sm font-semibold text-text-primary leading-tight">
                                {user.name}
                                {user._id === currentUser?.id && (
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">You</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-text-secondary">{user.email}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge active={user.isActive} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-all duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                              title="Edit user"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                              className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:pointer-events-none"
                              title="Delete user"
                              disabled={user._id === currentUser?.id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border/50">
              {filtered.map((user) => (
                <div key={user._id} className="px-4 py-3.5 hover:bg-bg/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} role={user.role} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                          {user.name}
                          {user._id === currentUser?.id && (
                            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">You</span>
                          )}
                        </p>
                        <p className="text-xs text-text-secondary/60 truncate mt-0.5">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <RoleBadge role={user.role} />
                          <StatusBadge active={user.isActive} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-all duration-150"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                        className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
                        disabled={user._id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer row count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40 bg-bg/30">
            <p className="text-xs text-text-secondary/50">
              {filtered.length === users?.length
                ? `${users?.length} user${users?.length !== 1 ? 's' : ''}`
                : `Showing ${filtered.length} of ${users?.length} users`}
            </p>
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <Field label="Full Name">
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={baseInput}
              placeholder="Jane Smith"
              autoFocus
            />
          </Field>

          <Field label="Email Address">
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={baseInput}
              placeholder="jane@company.com"
            />
          </Field>

          <Field
            label="Password"
            hint={editingUser ? 'Leave blank to keep current' : undefined}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingUser}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className={`${baseInput} pr-11`}
                placeholder={editingUser ? '••••••••' : 'Min. 8 characters'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-secondary hover:text-text-primary transition-all ${formData.password.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Field label="Role">
            <SelectField
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="employee">Employee</option>
              <option value="client">Client</option>
              <option value="super_admin">Super Admin</option>
            </SelectField>
          </Field>

          {editingUser && (
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border bg-bg/50 cursor-pointer" onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}>
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${formData.isActive ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${formData.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-tight">Account Active</p>
                <p className="text-xs text-text-secondary/50">{formData.isActive ? 'User can log in' : 'Login is disabled'}</p>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {(createUserMutation.isError || updateUserMutation.isError) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/8 border border-red-500/20"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-500">
                  {((createUserMutation.error || updateUserMutation.error) as any)?.response?.data?.message || 'Operation failed. Please try again.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t border-border/40 pt-1" />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 rounded-xl transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent/90 text-white rounded-xl transition-all duration-150 disabled:opacity-60 shadow-sm shadow-accent/20 hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm modal ── */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User">
        <div className="space-y-5">
          {/* Warning block */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">This action cannot be undone</p>
              {userToDelete && (
                <p className="text-xs text-text-secondary/70 mt-1">
                  You are about to permanently delete <span className="font-semibold text-text-primary">{userToDelete.name}</span> ({userToDelete.email}).
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border/40" />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 rounded-xl transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete._id, {
                    onSuccess: () => { setIsDeleteModalOpen(false); setUserToDelete(null); },
                  });
                }
              }}
              disabled={deleteUserMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-150 disabled:opacity-60 shadow-sm shadow-red-500/20 hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              {deleteUserMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                : <><Trash2 className="w-4 h-4" />Delete User</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}