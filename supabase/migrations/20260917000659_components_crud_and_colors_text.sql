-- تصحيح ما بعد شريحة ٤: [قاله يوسف]
-- - sheet_count يُلغى (نفس معنى page_count عملياً — كان يخالف روح D-41)
-- - color_count يتحول لنص حر "colors" (مش رقم دايماً)
-- - إضافة CRUD كامل: تعديل وحذف للحزمة والمكوّن، بحارس يمنع حذف حزمة بها مكوّنات

alter table public.components drop column sheet_count;
alter table public.components rename column color_count to colors;
alter table public.components alter column colors type text using colors::text;

-- التريجر القديم كان بيشير لـsheet_count/color_count بأسمائهم القدامى — يتحدّث ليطابق العمودين الجدد
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

create policy "components_delete_activated"
on public.components for delete
using (public.is_activated(auth.uid()));

create policy "pobs_delete_activated"
on public.pobs for delete
using (public.is_activated(auth.uid()));

-- حذف حزمة ممنوع لو بها مكوّنات — عطّلها بدلاً من ذلك (is_active).
-- ملاحظة لما تُبنى الأحداث لاحقاً: هذا الحارس لازم يتوسّع ليمنع الحذف
-- أيضاً لو للحزمة أحداث مسجَّلة (نفس منطق D-26)، مش المكوّنات بس.
create or replace function public.guard_pob_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  component_count integer;
begin
  select count(*) into component_count from public.components where pob_id = old.id;
  if component_count > 0 then
    raise exception 'لا يمكن حذف حزمة بها مكوّنات — عطّلها بدلاً من ذلك';
  end if;
  return old;
end;
$$;

create trigger pobs_before_delete
before delete on public.pobs
for each row execute function public.guard_pob_delete();
