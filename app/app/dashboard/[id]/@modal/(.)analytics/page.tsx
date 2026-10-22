import SiteModal from "@/app/components/dashboard/SiteModal";
import AnalyticsView from "../../analytics/view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Modal({ params }: PageProps) {
  const { id } = await params;
  return (
    <SiteModal active="analytics">
      <AnalyticsView siteId={id} />
    </SiteModal>
  );
}
