-- ==============================================================================
-- FAMILY EXPENSE TRACKER - SUPABASE SQL DATABASE SCHEMA & POLICIES
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a profile when a new user signs up in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. GROUPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text) from 1 for 6)),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. GROUP MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Helper function to check if current authenticated user belongs to a group (prevents recursion in RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.group_members 
        WHERE group_id = check_group_id 
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. PURCHASES TABLE (General Expenses/Purchases)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. INSTALLMENT PLANS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    split_ratio_buyer NUMERIC(5,2) DEFAULT 50.00 CHECK (split_ratio_buyer >= 0 AND split_ratio_buyer <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. INSTALLMENTS TABLE (Monthly dues per user)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    due_date DATE NOT NULL,
    amount_per_member NUMERIC(12,2) NOT NULL CHECK (amount_per_member >= 0),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying monthly active installments quickly
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON public.installments(group_id, due_date, assigned_to);

-- ------------------------------------------------------------------------------
-- 7. EXPENSES TABLE (Direct single payment expenses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category TEXT DEFAULT 'Supermercado',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. SETTLEMENTS TABLE (Settlement payments between members)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view any profile (needed for member names), edit own profile
CREATE POLICY "Public profiles are readable by authenticated users" 
    ON public.profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (id = auth.uid());

-- 2. Groups: Users can view/lookup groups. Any user can create a group.
CREATE POLICY "Users can view groups" 
    ON public.groups FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can create groups" 
    ON public.groups FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators or admins can update groups" 
    ON public.groups FOR UPDATE 
    TO authenticated 
    USING (public.is_group_member(id));

-- 3. Group Members: Members can view members of their group. Authenticated users can insert (join group).
CREATE POLICY "Members can view co-members" 
    ON public.group_members FOR SELECT 
    TO authenticated 
    USING (public.is_group_member(group_id) OR user_id = auth.uid());

CREATE POLICY "Users can join groups" 
    ON public.group_members FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave or admins remove members" 
    ON public.group_members FOR DELETE 
    TO authenticated 
    USING (user_id = auth.uid() OR public.is_group_member(group_id));

-- 4. Purchases, Installment Plans, Installments, Expenses, Settlements: Members can CRUD
CREATE POLICY "Group members can view purchases" 
    ON public.purchases FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can insert purchases" 
    ON public.purchases FOR INSERT TO authenticated 
    WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Group members can view installment plans" 
    ON public.installment_plans FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can insert installment plans" 
    ON public.installment_plans FOR INSERT TO authenticated 
    WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Group members can update installment plans" 
    ON public.installment_plans FOR UPDATE TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can delete installment plans" 
    ON public.installment_plans FOR DELETE TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can view installments" 
    ON public.installments FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can insert installments" 
    ON public.installments FOR INSERT TO authenticated 
    WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Group members can update installments" 
    ON public.installments FOR UPDATE TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can delete installments" 
    ON public.installments FOR DELETE TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can view expenses" 
    ON public.expenses FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can insert expenses" 
    ON public.expenses FOR INSERT TO authenticated 
    WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Group members can delete expenses" 
    ON public.expenses FOR DELETE TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can view settlements" 
    ON public.settlements FOR SELECT TO authenticated 
    USING (public.is_group_member(group_id));

CREATE POLICY "Group members can insert settlements" 
    ON public.settlements FOR INSERT TO authenticated 
    WITH CHECK (public.is_group_member(group_id));

-- Enable Supabase Realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.installments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
