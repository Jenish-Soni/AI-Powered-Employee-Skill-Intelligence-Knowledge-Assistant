-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');

-- Create employees table
CREATE TABLE public.employees (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role DEFAULT 'employee'::user_role NOT NULL,
    first_name TEXT,
    last_name TEXT,
    planned_leaves INTEGER DEFAULT 0 NOT NULL,
    unplanned_leaves INTEGER DEFAULT 0 NOT NULL,
    joining_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Employees can view their own profile
CREATE POLICY "Employees can view own profile" 
    ON public.employees 
    FOR SELECT 
    USING (auth.uid() = id);

-- 2. HR can view all profiles
CREATE POLICY "HR can view all profiles" 
    ON public.employees 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() AND role IN ('hr', 'admin')
        )
    );

-- 3. HR can insert/update employees
CREATE POLICY "HR can insert profiles" 
    ON public.employees 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() AND role IN ('hr', 'admin')
        )
    );

CREATE POLICY "HR can update profiles" 
    ON public.employees 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() AND role IN ('hr', 'admin')
        )
    );

-- 4. Admin can do everything
CREATE POLICY "Admin can do everything" 
    ON public.employees 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.employees (id, email, first_name, last_name, role)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'first_name', 
        new.raw_user_meta_data->>'last_name',
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'employee'::user_role)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add user to employees table on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
