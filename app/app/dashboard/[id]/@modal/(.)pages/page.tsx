import SiteModal from "@/app/components/dashboard/SiteModal";
import SitePagesView from "../../pages/view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Modal({ params }: PageProps) {
  const { id } = await params;
  return (
    <SiteModal active="pages">
      <SitePagesView siteId={id} />
    </SiteModal>
  );
}
