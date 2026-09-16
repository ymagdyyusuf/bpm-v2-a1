-- شريحة ٤: المكوّنات
-- مصدر: UNDERSTANDING.md §٢ · §٦ · D-04 (كتاب/ملحق/هدية فئة واحدة) · D-39 · D-41 (بلا form_count) · D-42 (الهدية باسم فقط)

create table public.component_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.component_kinds (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.component_categories enable row level security;
alter table public.component_kinds enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['component_categories', 'component_kinds']
  loop
    execute format('create policy "%s_select_activated" on public.%I for select using (public.is_activated(auth.uid()));', t, t);
    execute format('create policy "%s_insert_activated" on public.%I for insert with check (public.is_activated(auth.uid()));', t, t);
    execute format('create policy "%s_update_activated" on public.%I for update using (public.is_activated(auth.uid())) with check (public.is_activated(auth.uid()));', t, t);
    execute format('create trigger %I before insert on public.%I for each row execute function public.assign_next_display_order();', t || '_assign_display_order', t);
  end loop;
end $$;

insert into public.component_categories (label, display_order) values
  ('كتاب', 1), ('ملحق', 2), ('هدية', 3);

insert into public.component_kinds (label, display_order) values
  ('شرح', 1), ('أسئلة', 2), ('مفكرة', 3), ('امتحانات', 4), ('إجابات', 5),
  ('مراجعة', 6), ('تقييمات', 7), ('أطلس', 8), ('بوستر', 9);

-- ========== components ==========

create table public.components (
  id uuid primary key default gen_random_uuid(),
  pob_id uuid not null references public.pobs (id),
  category_id uuid not null references public.component_categories (id),
  kind_id uuid not null references public.component_kinds (id),
  name text null,
  page_width_cm numeric(6, 2) null,
  page_height_cm numeric(6, 2) null,
  page_count integer null,
  sheet_count integer null,
  color_count integer null,
  display_order integer not null default 0,
  created_by uuid null references auth.users (id) default auth.uid(),
  updated_by uuid null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.components enable row level security;

create policy "components_select_activated"
on public.components for select
using (public.is_activated(auth.uid()));

create policy "components_insert_activated"
on public.components for insert
with check (public.is_activated(auth.uid()));

create policy "components_update_activated"
on public.components for update
using (public.is_activated(auth.uid()))
with check (public.is_activated(auth.uid()));

-- D-42: فئة "هدية" باسم فقط — أي مواصفات مُرسَلة تُهمَل على مستوى القاعدة، دايماً
create or replace function public.guard_component_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_gift boolean;
  next_order integer;
begin
  select (c.label = 'هدية') into is_gift
  from public.component_categories c
  where c.id = new.category_id;

  if is_gift then
    new.page_width_cm := null;
    new.page_height_cm := null;
    new.page_count := null;
    new.sheet_count := null;
    new.color_count := null;
  end if;

  if tg_op = 'INSERT' then
    if new.display_order is null or new.display_order = 0 then
      select coalesce(max(display_order), 0) + 1 into next_order
      from public.components
      where pob_id = new.pob_id and category_id = new.category_id;
      new.display_order := next_order;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_by := auth.uid();
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.pob_id := old.pob_id;
  end if;

  return new;
end;
$$;

create trigger components_before_write
before insert or update on public.components
for each row execute function public.guard_component_before_write();
