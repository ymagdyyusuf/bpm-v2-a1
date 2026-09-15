#!/usr/bin/env node
/**
 * SessionStart — يحقن الحالة الحقيقية في أول الجلسة.
 *
 * الغرض: Claude يبدأ من الواقع، مش من آخر رسالة في المحادثة ولا من وثيقة.
 * ده العلاج المباشر لعطل "المعرفة موجودة بس مش قابلة للاكتشاف".
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

const out = [];
out.push("## الحالة الحقيقية عند بداية الجلسة (مقروءة بأوامر، لا من وثيقة)");
out.push("");

/* git */
if (existsSync(".git")) {
  const branch = sh("git rev-parse --abbrev-ref HEAD") || "?";
  const last = sh('git log -1 --pretty=format:"%h — %s (%cr)"') || "(لا يوجد commit بعد)";
  const dirty = sh("git status --porcelain");
  const ahead = sh("git rev-list --count @{u}..HEAD 2>/dev/null");

  out.push(`- **الفرع:** ${branch}`);
  out.push(`- **آخر commit:** ${last}`);
  out.push(
    dirty
      ? `- **تغييرات غير محفوظة:** ${dirty.split("\n").length} ملف — لسه ما اتعملهاش commit`
      : `- **شجرة العمل نظيفة** — كل حاجة محفوظة`
  );
  if (ahead && ahead !== "0") {
    out.push(`- **تنبيه:** ${ahead} commit محلي لسه ما اترفعش — يعني المنشور على الإنترنت أقدم من اللي عندك`);
  }
} else {
  out.push("- **تحذير: مفيش git في المجلد ده.** بلا git مفيش تاريخ ولا رجوع ولا معرفة بإيه اللي اتغيّر.");
  out.push("  - `git init` قبل أي كود (المرحلة ٠).");
}

/* migrations */
const migDir = "supabase/migrations";
if (existsSync(migDir)) {
  const files = sh(`node -e "console.log(require('fs').readdirSync('${migDir}').filter(f=>f.endsWith('.sql')).length)"`);
  out.push(`- **ملفات المهاجرات على القرص:** ${files || "?"}`);
  out.push("  - ⚠ عدد الملفات **ليس** دليلاً على اللي اتطبّق. للتأكد: `supabase migration list`");
}

/* live URL from CLAUDE.md */
if (existsSync("CLAUDE.md")) {
  const md = readFileSync("CLAUDE.md", "utf8");
  const url = md.match(/https?:\/\/[^\s|)<>`]+/);
  if (url) out.push(`- **الموقع الحي:** ${url[0]}`);
}

/* open questions */
if (existsSync("OPEN.md")) {
  const open = readFileSync("OPEN.md", "utf8");
  const items = [...open.matchAll(/^###\s+(O-\d+[^\n]*)/gm)].map((m) => m[1]);
  if (items.length) {
    out.push("");
    out.push(`**أسئلة مفتوحة (${items.length}) — أي شغل يعتمد عليها يقف:**`);
    items.forEach((i) => out.push(`- ${i}`));
  }
}

out.push("");
out.push("> لو حاجة من دي مش واضحة، شغّل `/status` قبل ما تقول لـيوسف أي حاجة عن \"فين وصلنا\".");

console.log(out.join("\n"));
