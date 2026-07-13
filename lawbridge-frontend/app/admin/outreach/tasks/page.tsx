'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getTasks, saveTask, getFirms, generateId, syncTasksFromApi, syncFirmsFromApi, Task, OutreachFirm } from '../../../../lib/outreachStore'

function fmtDate(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) } catch { return iso }
}

function isToday(iso?: string): boolean {
  if (!iso) return false
  const today = new Date().toISOString().slice(0, 10)
  return iso <= today
}

function isThisWeek(iso?: string): boolean {
  if (!iso) return false
  const now = new Date()
  const d = new Date(iso)
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff > 0 && diff <= 7
}

function AddTaskModal({ firms, onClose, onSave }: { firms: OutreachFirm[]; onClose: () => void; onSave: (t: Task) => void }) {
  const [form, setForm] = useState<Partial<Task>>({ priority: 'medium', status: 'pending' })
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title?.trim()) return
    const firm = firms.find(f => f.id === form.firmId)
    onSave({
      id: generateId(),
      title: form.title!.trim(),
      assignedTo: form.assignedTo,
      firmId: form.firmId,
      firmName: firm?.firmName,
      dueDate: form.dueDate,
      status: form.status ?? 'pending',
      priority: form.priority ?? 'medium',
      notes: form.notes,
      createdAt: new Date().toISOString(),
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-50">Add Task</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-200"><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="space-y-3">
          <div><label className="label-xs">Task Title *</label><input required className="field mt-1 w-full" value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Follow up with…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Priority</label>
              <select className="field mt-1 w-full" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task['priority'] }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label-xs">Due Date</label>
              <input type="date" className="field mt-1 w-full" value={form.dueDate ?? ''} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label-xs">Assigned To</label>
            <input className="field mt-1 w-full" value={form.assignedTo ?? ''} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} placeholder="Team member name" />
          </div>
          <div>
            <label className="label-xs">Related Firm</label>
            <select className="field mt-1 w-full" value={form.firmId ?? ''} onChange={e => setForm(p => ({ ...p, firmId: e.target.value || undefined }))}>
              <option value="">None</option>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Notes</label>
            <textarea className="field mt-1 w-full resize-none" rows={2} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
          <button type="submit" className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Add Task</button>
        </div>
      </form>
    </div>
  )
}

type Col = { key: string; label: string; filter: (t: Task) => boolean }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'table'>('kanban')

  useEffect(() => {
    setTasks(getTasks()); setFirms(getFirms())
    Promise.all([syncTasksFromApi(), syncFirmsFromApi()]).then(([t, f]) => {
      if (t) setTasks(t); if (f) setFirms(f)
    })
  }, [])

  const pending = tasks.filter(t => t.status !== 'done')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(t => !q || t.title.toLowerCase().includes(q) || (t.firmName ?? '').toLowerCase().includes(q) || (t.assignedTo ?? '').toLowerCase().includes(q))
  }, [tasks, search])

  function toggle(id: string) {
    const t = tasks.find(t => t.id === id)
    if (!t) return
    saveTask({ ...t, status: t.status === 'done' ? 'pending' : 'done' })
    setTasks(getTasks())
  }

  function handleSave(t: Task) {
    saveTask(t)
    setTasks(getTasks())
    setShowModal(false)
  }

  const COLS: Col[] = [
    { key: 'today', label: 'Follow Up Today', filter: t => t.status !== 'done' && isToday(t.dueDate) },
    { key: 'week', label: 'This Week', filter: t => t.status !== 'done' && !isToday(t.dueDate) && isThisWeek(t.dueDate) },
    { key: 'upcoming', label: 'Upcoming', filter: t => t.status !== 'done' && !isToday(t.dueDate) && !isThisWeek(t.dueDate) },
    { key: 'done', label: 'Done', filter: t => t.status === 'done' },
  ]

  function TaskCard({ t }: { t: Task }) {
    const prioColor = t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-neutral-600'
    return (
      <div className="rounded-xl border border-white/8 bg-primary-800/40 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <button onClick={() => toggle(t.id)} className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}>
            {t.status === 'done' && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          <p className={`text-sm leading-snug ${t.status === 'done' ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>{t.title}</p>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${prioColor}`} />
          {t.firmName && <Link href={`/admin/outreach/firms/${t.firmId}`} className="text-[11px] text-neutral-500 hover:text-neutral-300 truncate">{t.firmName}</Link>}
          {t.dueDate && <span className="text-[11px] text-neutral-600 ml-auto">{fmtDate(t.dueDate)}</span>}
        </div>
        {t.assignedTo && <p className="text-[11px] text-neutral-600 pl-6">{t.assignedTo}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Tasks</div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Tasks & Follow-ups</h1>
          <p className="text-sm text-neutral-500 mt-1">{pending.length} open tasks</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white/10 text-neutral-100' : 'text-neutral-500 hover:text-neutral-200'}`}>Kanban</button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'table' ? 'bg-white/10 text-neutral-100' : 'text-neutral-500 hover:text-neutral-200'}`}>Table</button>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map(col => {
            const colTasks = tasks.filter(col.filter)
            return (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{col.label}</h3>
                  <span className="text-xs text-neutral-600">{colTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {colTasks.length === 0
                    ? <div className="rounded-xl border border-dashed border-white/8 py-6 text-center text-xs text-neutral-700">Empty</div>
                    : colTasks.map(t => <TaskCard key={t.id} t={t} />)
                  }
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40" />
          </div>
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/8 bg-primary-900/40">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Task</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Firm</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Priority</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Assigned</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500 text-sm">No tasks</td></tr>
                  : filtered.map(t => (
                    <tr key={t.id} className={`hover:bg-white/3 transition-colors ${t.status === 'done' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(t.id)} className={`h-4 w-4 rounded border flex items-center justify-center ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}>
                          {t.status === 'done' && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-200">{t.title}</td>
                      <td className="px-4 py-3 text-sm text-neutral-400 hidden sm:table-cell">{t.firmName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex h-2 w-2 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400 hidden md:table-cell">{t.assignedTo ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(t.dueDate) || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <AddTaskModal firms={firms} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
