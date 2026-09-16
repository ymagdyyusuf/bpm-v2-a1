-- تصحيح D-50: الربط بالمعرّف لا بالاسم (معيار الكود #٤)
-- استُبدلت مقارنتان بنص label بعلم ثابت لا يتأثر بإعادة تسمية القيمة من ش-١٠

alter table public.actions add column is_terminal boolean not null default false;
update public.actions set is_terminal = true where label = 'تم الانتهاء';

alter table public.component_categories add column is_gift boolean not null default false;
update public.component_categories set is_gift = true where label = 'هدية';

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
  select c.is_gift into is_gift
  from public.component_categories c
  where c.id = new.category_id;

  if is_gift then
    new.page_width_cm := null;
    new.page_height_cm := null;
    new.page_count := null;
    new.colors := null;
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
