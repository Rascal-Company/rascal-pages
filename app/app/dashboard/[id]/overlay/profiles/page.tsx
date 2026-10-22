import { redirect } from "next/navigation";

/** Kohderyhmät ovat organisaatiotasoisia: hallinta on dashboardilla. */
export default function OverlayProfilesPage() {
  redirect("/app/dashboard/audiences");
}
