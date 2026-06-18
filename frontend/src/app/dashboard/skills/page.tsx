'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

// ─── Types ────────────────────────────────────────────────────────
interface Skill {
  id: string
  name: string
  complexity: number
  icon: string
}

interface Category {
  category: string
  skills: Skill[]
}

interface SavedSkill {
  skill_id: string
  name: string
  category: string
  complexity: number
  proficiency: number
  icon: string
}

const PROFICIENCY_LABELS = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
const PROFICIENCY_COLORS = ['', '#94a3b8', '#60a5fa', '#34d399', '#f59e0b', '#8b5cf6']

const CATEGORY_COLORS: Record<string, string> = {
  'Programming Languages': '#3b82f6',
  'Data Science & ML':     '#8b5cf6',
  'Web Backend':           '#10b981',
  'Web Frontend':          '#f59e0b',
  'DevOps & Cloud':        '#ef4444',
  'System Design':         '#ec4899',
  'Soft Skills':           '#06b6d4',
}

// ─── Component ────────────────────────────────────────────────────
export default function SkillsPage() {
  const [catalogue, setCatalogue]         = useState<Category[]>([])
  const [savedSkills, setSavedSkills]     = useState<SavedSkill[]>([])
  const [selected, setSelected]           = useState<Record<string, number>>({}) // skill_id → proficiency
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [userId, setUserId]               = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading]             = useState(true)

  const BACKEND = 'http://localhost:8000'

  // ── Load user & data ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [catResp, skillsResp] = await Promise.all([
        fetch(`${BACKEND}/api/skills/catalogue`),
        fetch(`${BACKEND}/api/skills/employee/${user.id}/skills`),
      ])

      if (catResp.ok) {
        const data = await catResp.json()
        setCatalogue(data.catalogue || [])
        if (data.catalogue?.length) setActiveCategory(data.catalogue[0].category)
      }

      if (skillsResp.ok) {
        const data = await skillsResp.json()
        const saved: SavedSkill[] = data.skills || []
        setSavedSkills(saved)
        const sel: Record<string, number> = {}
        saved.forEach((s: SavedSkill) => { sel[s.skill_id] = s.proficiency })
        setSelected(sel)
      }

      setLoading(false)
    }
    init()
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleSkill = (skillId: string) => {
    setSelected(prev => {
      if (prev[skillId]) {
        const next = { ...prev }
        delete next[skillId]
        return next
      }
      return { ...prev, [skillId]: 1 }
    })
  }

  const setProficiency = (skillId: string, level: number) => {
    setSelected(prev => ({ ...prev, [skillId]: level }))
  }

  const handleSave = useCallback(async () => {
    if (!userId) return
    setSaving(true)
    try {
      const skills = Object.entries(selected).map(([skill_id, proficiency]) => ({
        skill_id,
        proficiency,
      }))
      const resp = await fetch(`${BACKEND}/api/skills/employee/${userId}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      })
      if (resp.ok) {
        showToast(`✅ ${skills.length} skills saved successfully!`)
      } else {
        showToast('Failed to save skills', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }, [userId, selected])

  const selectedCount = Object.keys(selected).length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Loading skill catalogue…</span>
        <style>{`.spinner{width:24px;height:24px;border:3px solid var(--color-surface-container);border-top-color:var(--color-secondary);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn .4s ease', maxWidth: 1200 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .skill-card { transition: all .2s ease; cursor: pointer; }
        .skill-card:hover { transform: translateY(-2px); }
        .prof-btn { border: none; cursor: pointer; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; transition: all .15s; }
        .prof-btn:hover { opacity: .85; transform: scale(1.05); }
        .cat-tab { border: none; cursor: pointer; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; transition: all .2s; white-space: nowrap; }
        .cat-tab:hover { opacity: .85; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; z-index: 999; animation: slideUp .3s ease; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
        .save-btn { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 100; border: none; cursor: pointer; padding: 14px 40px; border-radius: 50px; font-weight: 700; font-size: 15px; transition: all .2s; box-shadow: 0 8px 24px rgba(0,88,190,.3); }
        .save-btn:hover:not(:disabled) { transform: translateX(-50%) translateY(-2px); box-shadow: 0 12px 32px rgba(0,88,190,.4); }
        .save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              My Skill Profile
            </h1>
            <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 6, fontSize: 14 }}>
              Select your skills and rate your proficiency. This powers your personalised learning roadmap.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedCount > 0 && (
              <span style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                {selectedCount} selected
              </span>
            )}
            <a href="/dashboard/roadmap" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'var(--color-primary-container)', color: 'var(--color-on-primary)', fontSize: 14, fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>route</span>
              View Roadmap
            </a>
          </div>
        </div>
      </div>

      {/* ── Already Saved Skills Chips ──────────────────────────── */}
      {savedSkills.length > 0 && (
        <div style={{ marginBottom: 28, padding: '16px 20px', background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Current Profile
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {savedSkills.map(s => (
              <span key={s.skill_id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: `${CATEGORY_COLORS[s.category] || '#64748b'}18`,
                color: CATEGORY_COLORS[s.category] || '#64748b',
                border: `1px solid ${CATEGORY_COLORS[s.category] || '#64748b'}30`,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{s.icon}</span>
                {s.name}
                <span style={{ background: PROFICIENCY_COLORS[s.proficiency], color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>
                  {PROFICIENCY_LABELS[s.proficiency]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Tabs ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
        {catalogue.map(cat => {
          const isActive = activeCategory === cat.category
          const color    = CATEGORY_COLORS[cat.category] || '#64748b'
          const catSelected = cat.skills.filter(s => selected[s.id]).length
          return (
            <button key={cat.category} className="cat-tab"
              onClick={() => setActiveCategory(cat.category)}
              style={{
                background: isActive ? color : 'var(--color-surface-container-lowest)',
                color: isActive ? '#fff' : 'var(--color-on-surface-variant)',
                border: `1.5px solid ${isActive ? color : 'var(--color-outline-variant)'}`,
              }}
            >
              {cat.category}
              {catSelected > 0 && (
                <span style={{ marginLeft: 6, background: isActive ? 'rgba(255,255,255,0.25)' : color, color: isActive ? '#fff' : '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                  {catSelected}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Skills Grid ─────────────────────────────────────────── */}
      {catalogue.filter(c => c.category === activeCategory).map(cat => {
        const color = CATEGORY_COLORS[cat.category] || '#64748b'
        return (
          <div key={cat.category} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {cat.skills.map(skill => {
              const isSelected = !!selected[skill.id]
              const prof       = selected[skill.id] || 0
              const complexity = ['', '●', '●●', '●●●', '●●●●', '●●●●●'][skill.complexity]

              return (
                <div key={skill.id} className="skill-card"
                  onClick={() => toggleSkill(skill.id)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: isSelected ? `${color}12` : 'var(--color-surface-container-lowest)',
                    border: `1.5px solid ${isSelected ? color : 'var(--color-outline-variant)'}`,
                    boxShadow: isSelected ? `0 0 0 3px ${color}20` : 'none',
                  }}
                >
                  {/* Skill header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{skill.icon}</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-on-surface)', margin: 0 }}>{skill.name}</p>
                        <p style={{ fontSize: 11, color, margin: '2px 0 0', fontWeight: 600 }}>{complexity}</p>
                      </div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: isSelected ? color : 'var(--color-surface-container)',
                      border: `2px solid ${isSelected ? color : 'var(--color-outline-variant)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>check</span>}
                    </div>
                  </div>

                  {/* Proficiency buttons — only if selected */}
                  {isSelected && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}
                      onClick={e => e.stopPropagation()}
                    >
                      {[1, 2, 3, 4, 5].map(lvl => (
                        <button key={lvl} className="prof-btn"
                          onClick={() => setProficiency(skill.id, lvl)}
                          style={{
                            background: prof === lvl ? PROFICIENCY_COLORS[lvl] : 'var(--color-surface-container)',
                            color: prof === lvl ? '#fff' : 'var(--color-on-surface-variant)',
                          }}
                        >
                          {PROFICIENCY_LABELS[lvl]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* ── Floating Save Button ─────────────────────────────────── */}
      <div style={{ height: 80 }} /> {/* spacer */}
      <button className="save-btn" onClick={handleSave} disabled={saving || selectedCount === 0}
        style={{ background: 'var(--color-secondary)', color: '#fff' }}
      >
        {saving ? '⏳ Saving…' : `💾 Save ${selectedCount > 0 ? selectedCount : ''} Skills`}
      </button>
    </div>
  )
}
