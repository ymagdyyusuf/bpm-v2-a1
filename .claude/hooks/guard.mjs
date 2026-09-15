#!/usr/bin/env node
/**
 * PreToolUse guard — Write | Edit
 *
 * بيفرض قاعدتين ما ينفعش نسيبهم للنية:
 *   R-6  الوثائق الدائمة أربعة، لا خامس.
 *   R-2  ممنوع ادعاء حالة التنفيذ داخل أي markdown.
 *
 * exit 0 = عدّي · exit 2 = امنع، والسبب على stderr
 */

import { readFileSync } from "node:fs";

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // مدخل غير مفهوم = ما نعطّلش الشغل
}

const input = event.tool_input ?? {};
const filePath = String(input.file_path ?? "").replace(/\\/g, "/");
if (!filePath.toLowerCase().endsWith(".md")) process.exit(0);

const body = [input.content, input.new_string].filter(Boolean).join("\n");

const block = (msg) => {
  console.error(msg);
  process.exit(2);
};

/* ── R-6: الوثائق الدائمة المسموحة ───────────────────────────── */

const PERMANENT = [
  "README.md",
  "CLAUDE.md",
  "UNDERSTANDING.md",
  "DECISIONS.md",
  "OPEN.md",
  "APPENDIX.md",
];
const name = filePath.split("/").pop();

const isDraft = filePath.includes("/docs/draft/");
const isClaudeConfig = filePath.includes("/.claude/");
const isNodeModules = filePath.includes("/node_modules/");

if (!PERMANENT.includes(name) && !isDraft && !isClaudeConfig && !isNodeModules) {
  block(
`[R-6] ممنوع إنشاء مستند دائم جديد: ${name}

الوثائق الدائمة أربعة فقط:
  ${PERMANENT.join(" · ")}

لو ده مستند تصميم مؤقت (مواصفة، تحليل، خطة) → حطه في:
  docs/draft/${name}
وهو مفهوم إنه يتشال بعد ما اللي فيه يتنفّذ.

السبب (R-6): عدد المستندات لما يكبر، مفيش مستند بيتقرا.`
  );
}

/* ── R-2: ممنوع ادعاء الحالة ─────────────────────────────────── */

// شيل التشكيل والتطويل عشان المطابقة ما تتهربش بـ"مُنفَّذ" مقابل "منفذ"
const flat = body.replace(/[ً-ْـ]/g, "");

const claims = [
  { re: /✅|✔️|☑️/, what: "علامة ✅" },
  { re: /منفذ\s*فعلي/, what: '"مُنفَّذ فعلياً"' },
  { re: /تم\s*التنفيذ/, what: '"تم التنفيذ"' },
  { re: /اتنفذ\s*بالكامل/, what: '"اتنفّذ بالكامل"' },
  { re: /\bمكتمل\s*تقني/, what: '"مكتمل تقنياً"' },
];

const hit = claims.find((c) => c.re.test(flat));
if (hit) {
  block(
`[R-2] ممنوع كتابة ادعاء حالة داخل markdown — وجدت: ${hit.what}
الملف: ${name}

الحالة تُقرأ بأمر فعلي، مش من وثيقة:
  git log --oneline -10        ← إيه اللي اتعمل فعلاً
  supabase migration list      ← إيه اللي اتطبّق على القاعدة فعلاً
  الموقع الحي                   ← إيه اللي منشور فعلاً

السبب (R-2): الوثيقة ما بتعرفش الواقع — بتعرف اللي اتكتب فيها وقت ما اتكتب.
"مهاجرة مُنفَّذة" ممكن تعني "الملف اتكتب" لا "اتطبّق على القاعدة".
الأمر هو اللي بيعرف الفرق.

لو عايز تسجّل قرار: سطر في DECISIONS.md، بلا أي علامة حالة.`
  );
}

process.exit(0);
