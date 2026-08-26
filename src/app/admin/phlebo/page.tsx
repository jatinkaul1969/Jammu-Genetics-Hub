import { redirect } from "next/navigation";

export default function PhleboHomePage() {
  redirect("/admin/phlebo/pickups");
}
