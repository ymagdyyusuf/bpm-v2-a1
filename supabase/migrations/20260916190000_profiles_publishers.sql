-- شريحة ١: الأساس الحي (دخول + publishers)
-- مصدر: UNDERSTANDING.md §٦ · D-21 · D-22 (مؤجَّل التنفيذ) · D-35 · D-36 · D-37 · D-38

create extension if not exists pgcrypto;

-- ========== profiles ==========

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  "role" text null check ("role" in ('علمي', 'إدخال', 'تقارير')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- دالة SECURITY DEFINER لتفادي infinite recursion على سياسات profiles نفسها
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

-- دالة "الحساب مفعّل؟" = role غير فارغ (D-38: بوابة تفعيل لا فلترة دور)
create or replace function public.is_activated(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p."role" is not null from public.profiles p where p.id = uid), false);
$$;

create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_update_admin_only"
on public.profiles for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- حماية عمودية (D-22 بالمعنى العملي): full_name/email لا تتغيّر من العميل،
-- ومنع الأدمن من تنزيل نفسه
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.full_name := old.full_name;
  new.email := old.email;
  new.created_at := old.created_at;
  new.id := old.id;

  if old.id = auth.uid() and old.is_admin = true and new.is_admin = false then
    raise exception 'لا يمكن للأدمن سحب صلاحيته من نفسه';
  end if;

  return new;
end;
$$;

create trigger profiles_before_update
before update on public.profiles
for each row execute function public.guard_profiles_update();

-- إنشاء صف profiles تلقائياً عند تسجيل مستخدم جديد في auth.users (D-35)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, "role", is_admin)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    null,
    false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== publishers ==========

create table public.publishers (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.publishers enable row level security;

-- D-38: أي حساب مفعّل (role غير فارغ) يقرأ ويكتب بالكامل، بلا تمييز أدوار.
-- لا سياسة حذف على الإطلاق → الحذف ممنوع افتراضياً (يُعطَّل بـis_active فقط).
create policy "publishers_select_activated"
on public.publishers for select
using (public.is_activated(auth.uid()));

create policy "publishers_insert_activated"
on public.publishers for insert
with check (public.is_activated(auth.uid()));

create policy "publishers_update_activated"
on public.publishers for update
using (public.is_activated(auth.uid()))
with check (public.is_activated(auth.uid()));
