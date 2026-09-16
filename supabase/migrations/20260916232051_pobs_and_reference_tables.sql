-- شريحة ٣: الحزم (pobs) + القوائم المرجعية اللازمة لها
-- مصدر: UNDERSTANDING.md §٢ · §٦ · D-38 (بوابة تفعيل لا فلترة دور) · D-39 (created_by/updated_by)

-- ========== قوائم مرجعية بنفس الشكل: id · label · display_order · is_active ==========

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  group_id uuid null references public.subjects (id),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.academic_years enable row level security;
alter table public.terms enable row level security;
alter table public.stages enable row level security;
alter table public.types enable row level security;
alter table public.languages enable row level security;
alter table public.subjects enable row level security;

-- D-38: أي حساب مفعّل يقرأ ويكتب (إضافة/تعديل) بالكامل، بلا تمييز أدوار. لا حذف.
do $$
declare
  t text;
begin
  foreach t in array array['academic_years', 'terms', 'stages', 'types', 'languages', 'subjects']
  loop
    execute format('create policy "%s_select_activated" on public.%I for select using (public.is_activated(auth.uid()));', t, t);
    execute format('create policy "%s_insert_activated" on public.%I for insert with check (public.is_activated(auth.uid()));', t, t);
    execute format('create policy "%s_update_activated" on public.%I for update using (public.is_activated(auth.uid())) with check (public.is_activated(auth.uid()));', t, t);
  end loop;
end $$;

-- ========== بذور القوائم المرجعية — [قاله يوسف] UNDERSTANDING.md §٢ ==========

insert into public.terms (label, display_order) values
  ('الأول', 1), ('الثاني', 2), ('الممتد', 3);

insert into public.stages (label, display_order) values
  ('KG1', 1), ('KG2', 2),
  ('١ ابتدائي', 3), ('٢ ابتدائي', 4), ('٣ ابتدائي', 5),
  ('٤ ابتدائي', 6), ('٥ ابتدائي', 7), ('٦ ابتدائي', 8),
  ('١ إعدادي', 9), ('٢ إعدادي', 10), ('٣ إعدادي', 11),
  ('١ ثانوي', 12), ('٢ ثانوي', 13), ('٣ ثانوي', 14);

insert into public.types (label, display_order) values
  ('عام', 1), ('أزهري', 2), ('تجريبي', 3), ('لغات', 4);

insert into public.languages (label, display_order) values
  ('عربي', 1), ('إنجليزي', 2), ('فرنساوي', 3);

-- academic_years: "تُملأ بالاستخدام" — تُزرع سنتان للبدء فقط، الباقي يُضاف من الشاشة
insert into public.academic_years (label, display_order) values
  ('2026', 1), ('2027', 2);

insert into public.subjects (label, display_order) values
  ('English Plus', 1), ('Mathématiques', 2), ('English', 3), ('les sciences', 4),
  ('Biology And Science Of Earth', 5), ('Integrated Sciences', 6),
  ('الاحياء وعلوم الارض', 7), ('الكمبيوتر وتكنولوجيا المعلومات', 8),
  ('العلوم المتكاملة', 9), ('( ICT ) Information Communication Technology', 10),
  ('عام', 11), ('Chemistry', 12), ('Sciences', 13), ('Biology', 14), ('Physics', 15),
  ('Statistics', 16), ('Mathematics Applications', 17), ('General Mathematics', 18),
  ('Pure Mathematics', 19), ('Maths', 20), ('كيمياء', 21), ('فيزياء', 22),
  ('فلسفة', 23), ('علوم', 24), ('علم النفس', 25), ('عربي', 26),
  ('الرياضيات العامة', 27), ('الرياضيات', 28), ('الدراسات الاجتماعية', 29),
  ('الجغرافيا', 30), ('Discover', 31), ('تطبيقات الرياضيات', 32),
  ('التاريخ', 33), ('الرياضيات البحتة', 34), ('أحياء', 35),
  ('الإحصاء', 36), ('French', 37);

-- ========== pobs ==========

create table public.pobs (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id),
  term_id uuid not null references public.terms (id),
  publisher_id uuid not null references public.publishers (id),
  stage_id uuid not null references public.stages (id),
  type_id uuid not null references public.types (id),
  language_id uuid not null references public.languages (id),
  subject_id uuid not null references public.subjects (id),
  price numeric(10, 2) null,
  is_active boolean not null default true,
  created_by uuid null references auth.users (id) default auth.uid(),
  updated_by uuid null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (academic_year_id, term_id, publisher_id, stage_id, type_id, language_id, subject_id)
);

alter table public.pobs enable row level security;

create policy "pobs_select_activated"
on public.pobs for select
using (public.is_activated(auth.uid()));

create policy "pobs_insert_activated"
on public.pobs for insert
with check (public.is_activated(auth.uid()));

create policy "pobs_update_activated"
on public.pobs for update
using (public.is_activated(auth.uid()))
with check (public.is_activated(auth.uid()));

-- updated_by يتحدّث تلقائياً مع أي تعديل — لا يُترك لالتزام العميل
create or replace function public.set_pobs_updated_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger pobs_before_update
before update on public.pobs
for each row execute function public.set_pobs_updated_by();
