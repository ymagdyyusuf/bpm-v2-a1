-- شريحة ٥: سجل الأحداث
-- مصدر: UNDERSTANDING.md §٢ · §٦ · D-02 · D-25 · D-29 · D-30

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  requires_number boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.actions enable row level security;

create policy "actions_select_activated" on public.actions for select using (public.is_activated(auth.uid()));
create policy "actions_insert_activated" on public.actions for insert with check (public.is_activated(auth.uid()));
create policy "actions_update_activated" on public.actions for update using (public.is_activated(auth.uid())) with check (public.is_activated(auth.uid()));
create trigger actions_assign_display_order before insert on public.actions for each row execute function public.assign_next_display_order();

-- [قاله يوسف] التسع القائمة كافية الآن (O-02 مُجاب)
insert into public.actions (label, requires_number, display_order) values
  ('بروفة', true, 1),
  ('تعديلات', false, 2),
  ('إعادة طبع', false, 3),
  ('دخول', false, 4),
  ('انتهاء', false, 5),
  ('أمر طبع', false, 6),
  ('موافقة نهائية', false, 7),
  ('إرسال مطبعة', false, 8),
  ('تم الانتهاء', false, 9);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  pob_id uuid not null references public.pobs (id),
  component_id uuid null references public.components (id),
  -- node_id بلا FK حالياً — index_nodes لسه مش موجود (يُضاف في شريحة ٧ بلا هدم، زي ما قال يوسف)
  node_id uuid null,
  action_id uuid not null references public.actions (id),
  proof_number integer null,
  date_expected date null,
  date_actual date null,
  is_blocked boolean not null default false,
  block_reason text null,
  note text null,
  created_by uuid null references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  constraint events_at_least_one_date check (date_expected is not null or date_actual is not null)
);

alter table public.events enable row level security;

-- D-02: السجل يُضاف ولا يُعدَّل ولا يُمسح — قراءة وإضافة فقط، صراحة بلا سياسة update أو delete
create policy "events_select_activated" on public.events for select using (public.is_activated(auth.uid()));
create policy "events_insert_activated" on public.events for insert with check (public.is_activated(auth.uid()));

create index events_pob_component_created_idx on public.events (pob_id, component_id, created_at);

-- حارس دفاعي مطابق لتحقق الواجهة: رقم البروفة، سبب التعطيل، وD-29 (تاريخ افتراضي)
create or replace function public.guard_event_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  needs_number boolean;
begin
  select requires_number into needs_number from public.actions where id = new.action_id;

  if needs_number and new.proof_number is null then
    raise exception 'رقم البروفة مطلوب لهذا الإجراء';
  end if;

  if new.is_blocked and (new.block_reason is null or btrim(new.block_reason) = '') then
    raise exception 'سبب التعطيل مطلوب عند التعطيل';
  end if;

  if new.date_expected is null and new.date_actual is null then
    new.date_actual := current_date;
  end if;

  return new;
end;
$$;

create trigger events_before_insert
before insert on public.events
for each row execute function public.guard_event_before_insert();
