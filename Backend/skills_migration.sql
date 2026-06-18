-- ============================================================
-- SKILL INTELLIGENCE MODULE — DB MIGRATION
-- Run this once in the Supabase SQL editor
-- ============================================================

-- Requires pgvector extension (already enabled for hr_policy_chunks)
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------
-- 1. Skills Master Catalogue
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT UNIQUE NOT NULL,
    category    TEXT NOT NULL,
    complexity  INTEGER DEFAULT 3 CHECK (complexity BETWEEN 1 AND 5),
    embedding   VECTOR(384),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- 2. Employee ↔ Skill Proficiency
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_skills (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    skill_id     UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency  INTEGER NOT NULL DEFAULT 1 CHECK (proficiency BETWEEN 1 AND 5),
    acquired_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(employee_id, skill_id)
);

-- ---------------------------------------------------------------
-- 3. Skill Knowledge Graph Edges
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_relationships (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_skill_id     UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    to_skill_id       UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'prerequisite',
    weight            FLOAT DEFAULT 1.0,
    UNIQUE(from_skill_id, to_skill_id)
);

-- ---------------------------------------------------------------
-- 4. Roadmap Progress Tracker (resume-from-where-you-left-off)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    skill_id        UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    status          TEXT DEFAULT 'not_started'
                    CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_pct    INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    last_active_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(employee_id, skill_id)
);

-- ---------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------

-- employee_skills
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_skills_own_select" ON public.employee_skills FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "emp_skills_hr_select" ON public.employee_skills FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role IN ('hr', 'admin'))
);
CREATE POLICY "emp_skills_own_insert" ON public.employee_skills FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "emp_skills_own_update" ON public.employee_skills FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "emp_skills_own_delete" ON public.employee_skills FOR DELETE USING (auth.uid() = employee_id);

-- roadmap_progress
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own_select" ON public.roadmap_progress FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "progress_hr_select"  ON public.roadmap_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role IN ('hr', 'admin'))
);
CREATE POLICY "progress_own_insert" ON public.roadmap_progress FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "progress_own_update" ON public.roadmap_progress FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "progress_own_delete" ON public.roadmap_progress FOR DELETE USING (auth.uid() = employee_id);

-- skills and skill_relationships are public (read-only for all authenticated users)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_public_read" ON public.skills FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.skill_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relationships_public_read" ON public.skill_relationships FOR SELECT USING (auth.role() = 'authenticated');
