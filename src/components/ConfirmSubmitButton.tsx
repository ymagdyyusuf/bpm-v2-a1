"use client";

import type { CSSProperties, ReactNode } from "react";

/** زر إرسال يوقف الفورم لو المستخدم رجع عن التأكيد — للأفعال اللي نتيجتها لا رجعة فيها. */
export function ConfirmSubmitButton({
  confirmText,
  style,
  children,
}: {
  confirmText: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className="heading-font"
      style={style}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
