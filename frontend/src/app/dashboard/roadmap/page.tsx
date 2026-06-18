'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

// ─── Types ────────────────────────────────────────────────────────
interface RoadmapItem {
  order: number
  skill_id: string
  name: string
  category: string
  complexity: number
  complexity_label: string
  icon: string
  estimated_weeks: number
  phase: number
  status: 'not_started' | 'in_progress' | 'completed'
  progress_pct: number
  started_at?: string
  reason: string
}

interface InProgressItem extends RoadmapItem {
  last_active_at?: string
}

interface CompletedItem {
  skill_id: string
  name: string
  category: string
  complexity: number
  icon: string
  completed_at?: string
}

interface Suggestion {
  skill_id: string
  name: string
  category: string
  complexity: number
  complexity_label: string
  icon: string
  score: number
  reason: string
}

interface Roadmap {
  in_progress: InProgressItem[]
  up_next: RoadmapItem[]
  completed: CompletedItem[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Programming Languages': '#3b82f6',
  'Data Science & ML':     '#8b5cf6',
  'Web Backend':           '#10b981',
  'Web Frontend':          '#f59e0b',
  'DevOps & Cloud':        '#ef4444',
  'System Design':         '#ec4899',
  'Soft Skills':           '#06b6d4',
}

const PHASE_CONFIG = {
  1: { label: 'Foundation',    color: '#10b981', bg: '#10b98115', icon: 'foundation' },
  2: { label: 'Intermediate',  color: '#f59e0b', bg: '#f59e0b15', icon: 'trending_up' },
  3: { label: 'Advanced',      color: '#8b5cf6', bg: '#8b5cf615', icon: 'rocket_launch' },
}

const BACKEND = 'http://localhost:8000'

// ─── Component ────────────────────────────────────────────────────
export default function RoadmapPage() {
  const [roadmap, setRoadmap]           = useState<Roadmap | null>(null)
  const [userId, setUserId]             = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)
  const [completedModal, setCompletedModal] = useState<{ name: string; suggestions: Suggestion[] } | null>(null)
  const [updatingId, setUpdatingId]     = useState<string | null>(null)
  const [progressEdit, setProgressEdit] = useState<Record<string, number>>({})
  const [toast, setToast]               = useState<string | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const loadRoadmap = useCallback(async (uid: string) => {
    const resp = await fetch(`${BACKEND}/api/skills/employee/${uid}/roadmap`)
    if (resp.ok) {
      const data = await resp.json()
      setRoadmap(data)
      // Initialise progress sliders for in-progress items
      const init: Record<string, number> = {}
      ;(data.in_progress || []).forEach((s: InProgressItem) => {
        init[s.skill_id] = s.progress_pct || 0
      })
      setProgressEdit(init)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await loadRoadmap(user.id)
      setLoading(false)
    }
    init()
  }, [loadRoadmap])

  const handleStart = async (skillId: string, skillName: string) => {
    if (!userId) return
    setUpdatingId(skillId)
    await fetch(`${BACKEND}/api/skills/employee/${userId}/roadmap/${skillId}/start`, { method: 'POST' })
    await loadRoadmap(userId)
    showToast(`▶ Started learning "${skillName}"`)
    setUpdatingId(null)
  }

  const handleComplete = async (skillId: string, skillName: string) => {
    if (!userId) return
    setUpdatingId(skillId)
    const resp = await fetch(`${BACKEND}/api/skills/employee/${userId}/roadmap/${skillId}/complete`, { method: 'POST' })
    if (resp.ok) {
      const data = await resp.json()
      await loadRoadmap(userId)
      setCompletedModal({ name: skillName, suggestions: data.next_suggestions || [] })
    }
    setUpdatingId(null)
  }

  const handleProgressUpdate = async (skillId: string, pct: number) => {
    if (!userId) return
    await fetch(`${BACKEND}/api/skills/employee/${userId}/roadmap/${skillId}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress_pct: pct }),
    })
    showToast(`Progress updated to ${pct}%`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Building your personalised roadmap…</p>
        <style>{`.spinner{width:40px;height:40px;border:4px solid var(--color-surface-container);border-top-color:var(--color-secondary);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const hasNoData = !roadmap || (
    roadmap.in_progress.length === 0 &&
    roadmap.up_next.length === 0 &&
    roadmap.completed.length === 0
  )

  if (hasNoData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-outline)' }}>route</span>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: 'var(--color-primary)', margin: 0 }}>No roadmap yet</h2>
        <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: 380, lineHeight: 1.6 }}>
          First, tell us what you already know. Head over to your skill profile to get started.
        </p>
        <a href="/dashboard/skills" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 50, background: 'var(--color-secondary)', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology</span>
          Set Up My Skills
        </a>
      </div>
    )
  }

  // Group up_next by phase
  const phases: Record<number, RoadmapItem[]> = { 1: [], 2: [], 3: [] }
  ;(roadmap?.up_next || []).forEach(item => {
    const phase = item.phase || 1
    if (phases[phase]) phases[phase].push(item)
  })

  return (
    <div style={{ maxWidth: 900, animation: 'fadeIn .4s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(.95); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
        .skill-row { transition: all .2s ease; }
        .skill-row:hover { transform: translateX(4px); }
        .action-btn { border: none; cursor: pointer; border-radius: 10px; padding: 9px 18px; font-weight: 700; font-size: 13px; transition: all .2s; display: flex; align-items: center; gap: 6px; }
        .action-btn:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
        .action-btn:disabled { opacity: .5; cursor: not-allowed; }
        .progress-bar-track { width: 100%; height: 8px; background: rgba(255,255,255,.15); border-radius: 99px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 99px; transition: width .6s ease; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 12px; font-weight: 600; font-size: 13px; background: var(--color-primary-container); color: var(--color-on-primary); box-shadow: 0 8px 24px rgba(0,0,0,.15); animation: slideUp .3s ease; z-index: 999; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-card { background: var(--color-surface-container-lowest); border-radius: 20px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,.2); animation: slideUp .3s ease; }
        .range-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,.2); outline: none; }
        .range-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
      `}</style>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Completed Skill Modal */}
      {completedModal && (
        <div className="modal-overlay" onClick={() => setCompletedModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-primary)', margin: 0 }}>
                "{completedModal.name}" Completed!
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 8, fontSize: 14 }}>
                Great work! Here's what to explore next based on your profile.
              </p>
            </div>
            {completedModal.suggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completedModal.suggestions.map(s => {
                  const color = CATEGORY_COLORS[s.category] || '#64748b'
                  return (
                    <div key={s.skill_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}30` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{s.icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--color-on-surface)' }}>{s.name}</p>
                        <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--color-on-surface-variant)' }}>{s.reason}</p>
                      </div>
                      <span style={{ background: color, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {s.complexity_label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={() => setCompletedModal(null)}
              style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--color-secondary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Learning Roadmap
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 6, fontSize: 14 }}>
            Your personalised, AI-generated path — resume anytime, learn at your own pace.
          </p>
        </div>
        <a href="/dashboard/skills" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--color-outline-variant)', color: 'var(--color-on-surface-variant)', fontSize: 13, fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Edit Skills
        </a>
      </div>

      {/* ── SECTION 1: Currently Learning (Resume Point) ────────── */}
      {(roadmap?.in_progress?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', animation: 'pulse 2s ease infinite', display: 'inline-block' }} />
            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#3b82f6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Currently Learning
            </h2>
          </div>

          {roadmap!.in_progress.map(item => {
            const color = CATEGORY_COLORS[item.category] || '#3b82f6'
            const pct   = progressEdit[item.skill_id] ?? item.progress_pct ?? 0
            return (
              <div key={item.skill_id} style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, background: `linear-gradient(135deg, ${color}ee, ${color}99)`, padding: 24, color: '#fff', boxShadow: `0 8px 32px ${color}40` }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#fff' }}>{item.icon}</span>
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{item.name}</h3>
                      <p style={{ margin: '4px 0 0', opacity: .85, fontSize: 13 }}>
                        {item.category} · {item.complexity_label} · ~{item.estimated_weeks} weeks
                      </p>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    ▶ In Progress
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, opacity: .9 }}>Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'rgba(255,255,255,.9)' }} />
                  </div>
                </div>

                {/* Slider */}
                <div style={{ marginBottom: 16 }}>
                  <input type="range" min={0} max={100} value={pct} className="range-slider"
                    onChange={e => setProgressEdit(prev => ({ ...prev, [item.skill_id]: +e.target.value }))}
                    onMouseUp={() => handleProgressUpdate(item.skill_id, pct)}
                    onTouchEnd={() => handleProgressUpdate(item.skill_id, pct)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .7, marginTop: 2 }}>
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                {/* Reason + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <p style={{ fontSize: 13, opacity: .85, margin: 0, fontStyle: 'italic' }}>"{item.reason}"</p>
                  <button className="action-btn"
                    disabled={updatingId === item.skill_id}
                    onClick={() => handleComplete(item.skill_id, item.name)}
                    style={{ background: 'rgba(255,255,255,.95)', color }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                    {updatingId === item.skill_id ? 'Saving…' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SECTION 2: Up Next (Phase-grouped Roadmap) ──────────── */}
      {(roadmap?.up_next?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-on-surface-variant)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Up Next
          </h2>

          {([1, 2, 3] as const).map(phase => {
            const items = phases[phase]
            if (!items.length) return null
            const cfg = PHASE_CONFIG[phase]
            return (
              <div key={phase} style={{ marginBottom: 24 }}>
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: cfg.color }}>{cfg.icon}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>Phase {phase}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>— {cfg.label}</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: `${cfg.color}20` }} />
                  <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{items.length} skills</span>
                </div>

                {/* Skills in this phase */}
                <div style={{ paddingLeft: 16, borderLeft: `2px solid ${cfg.color}30`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((item, idx) => {
                    const color = CATEGORY_COLORS[item.category] || '#64748b'
                    const isLoading = updatingId === item.skill_id
                    return (
                      <div key={item.skill_id} className="skill-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', position: 'relative' }}
                      >
                        {/* Order badge */}
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color }}>{item.order + 1}</span>
                        </div>

                        {/* Icon */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{item.icon}</span>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: 'var(--color-on-surface)' }}>{item.name}</p>
                          <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.reason}
                          </p>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}15`, color }}>
                            {item.complexity_label}
                          </span>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                            ~{item.estimated_weeks}w
                          </span>
                        </div>

                        {/* Action */}
                        <button className="action-btn" disabled={isLoading}
                          onClick={() => handleStart(item.skill_id, item.name)}
                          style={{ background: color, color: '#fff', flexShrink: 0, fontSize: 12, padding: '7px 14px' }}
                        >
                          {isLoading
                            ? <span style={{ animation: 'pulse 1s infinite' }}>…</span>
                            : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span>Start</>
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SECTION 3: Completed (Collapsible) ──────────────────── */}
      {(roadmap?.completed?.length ?? 0) > 0 && (
        <div>
          <button onClick={() => setCompletedOpen(prev => !prev)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: 14, border: '1.5px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', cursor: 'pointer', marginBottom: completedOpen ? 12 : 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#10b981' }}>check_circle</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-on-surface)' }}>
                Completed Skills
              </span>
              <span style={{ background: '#10b98120', color: '#10b981', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                {roadmap!.completed.length}
              </span>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface-variant)', transition: 'transform .2s', transform: completedOpen ? 'rotate(180deg)' : 'none' }}>
              expand_more
            </span>
          </button>

          {completedOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roadmap!.completed.map(item => {
                const color = CATEGORY_COLORS[item.category] || '#64748b'
                const date  = item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
                return (
                  <div key={item.skill_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#10b98108', border: '1px solid #10b98125' }}>
                    <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 20, flexShrink: 0 }}>task_alt</span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: 'var(--color-on-surface)' }}>{item.name}</p>
                      <p style={{ fontSize: 12, margin: '1px 0 0', color: 'var(--color-on-surface-variant)' }}>{item.category}</p>
                    </div>
                    {date && (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, flexShrink: 0 }}>✓ {date}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  )
}
