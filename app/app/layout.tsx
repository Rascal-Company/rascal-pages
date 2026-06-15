import type { ReactNode } from "react";
import { DashboardThemeProvider } from "@/app/components/providers/DashboardThemeProvider";

/**
 * Layout for the dashboard app (app.rascalpages.fi → /app/*). Scopes the
 * dark-mode theme to the dashboard only; published user sites are rendered
 * under a different route subtree and stay on their own per-site theme.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <DashboardThemeProvider>{children}</DashboardThemeProvider>;
}
