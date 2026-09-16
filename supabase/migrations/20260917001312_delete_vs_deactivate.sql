-- D-47: حذف نهائي فقط للكيان الفارغ من تبعيات؛ غير كده تعطيل بدل الحذف.
-- الحارس هنا دفاع أخير على مستوى القاعدة — المسار الطبيعي عبر التطبيق
-- بيفحص التبعية الأول ويحوّل لـUPDATE is_active بدل DELETE من غير ما
-- يوصل للحارس أصلاً؛ الحارس بس بيمنع تجاوزه من مسار تاني.

alter table public.components add column is_active boolean not null default true;
