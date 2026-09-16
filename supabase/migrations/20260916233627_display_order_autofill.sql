-- display_order: ترقيم تلقائي على كل القوائم المرجعية (لا publishers وحده)
-- + ترتيب أبجدي رجعي للصفوف اللي اتضافت بـ0 قبل التريجر ده

-- publishers هي الجدول الوحيد اللي كان فيه صفوف بـ0 فعلاً (اتأكد بالفحص، مش افتراضاً)
update public.publishers set display_order = 1 where label = 'الامتحان';
update public.publishers set display_order = 2 where label = 'المعاصر';
update public.publishers set display_order = 3 where label = 'وزارة';

create or replace function public.assign_next_display_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_order integer;
begin
  if new.display_order is null or new.display_order = 0 then
    execute format('select coalesce(max(display_order), 0) + 1 from public.%I', tg_table_name)
      into next_order;
    new.display_order := next_order;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['academic_years', 'terms', 'stages', 'types', 'languages', 'subjects', 'publishers']
  loop
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.assign_next_display_order();',
      t || '_assign_display_order', t
    );
  end loop;
end $$;
