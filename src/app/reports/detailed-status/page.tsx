import { redirect } from "next/navigation";

/** شريحة ٦ (إعادة البناء): اندمجت في /reports — بلا منطق خاص. */
export default function DetailedStatusRedirect() {
  redirect("/reports");
}
