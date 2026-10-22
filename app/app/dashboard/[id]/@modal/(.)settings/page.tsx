import SiteModal from "@/app/components/dashboard/SiteModal";
import SettingsView from "../../settings/view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Modal({ params }: PageProps) {
  const { id } = await params;
  return (
    <SiteModal active="settings">
      <SettingsView siteId={id} />
    </SiteModal>
  );
}
