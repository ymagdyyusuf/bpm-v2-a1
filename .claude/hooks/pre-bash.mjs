#!/usr/bin/env node
/**
 * PreToolUse — Bash
 *
 *  ١) يمنع النشر اليدوي  (النشر تلقائي من GitHub؛ اليدوي هو اللي جمّد الموقع القديم)
 *  ٢) يمنع الـcommit لو فحص الأنواع بيفشل  (CLAUDE.md: ممنوع commit فوق كود مكسور)
 *
 * exit 0 = عدّي · exit 2 = امنع، والسبب على stderr
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const cmd = String(event.tool_input?.command ?? "");
if (!cmd.trim()) process.exit(0);

const block = (msg) => {
  console.error(msg);
  process.exit(2);
};

/* ── ١) النشر اليدوي ممنوع ───────────────────────────────────── */

// ملاحظة: ممنوع \b قبل "--prod" — الشرطة مش حرف، فالحد ما بيتحققش والمانع بيعدّي.
if (/\bvercel\b[^|;&]*(--prod|\bdeploy\b)/.test(cmd) || /\bnetlify\b[^|;&]*\bdeploy\b/.test(cmd)) {
  block(
`[نشر] ممنوع النشر اليدوي.

النشر تلقائي: أي push على main = نشر جديد.
  git push

السبب: الأمر اليدوي بيتنسي، فالمنشور بيفضل واقف على نسخة قديمة
والشغل كله يعيش على الجهاز. الربط التلقائي بيشيل الخطوة من دماغك خالص.

لو الربط التلقائي لسه ما اتعملش، اعمله الأول — ما تتحايلش عليه.`
  );
}

/* ── ٢) ممنوع commit فوق كود مكسور ───────────────────────────── */

const isCommit = /\bgit\s+commit\b/.test(cmd);
const canTypecheck = existsSync("tsconfig.json") && existsSync("node_modules");

if (isCommit && canTypecheck) {
  try {
    execSync("npx tsc --noEmit", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 180000 });
  } catch (err) {
    const detail = ((err.stdout ?? "") + (err.stderr ?? "")).trim().split("\n").slice(0, 25).join("\n");
    block(
`[بناء] فحص الأنواع فشل — ممنوع commit.

${detail}

أصلح الأخطاء دي الأول، وبعدين اعمل commit.
(القاعدة في CLAUDE.md: \`npx tsc --noEmit && npm run build\` لازم ينجحوا قبل أي commit.)`
    );
  }
}

process.exit(0);
