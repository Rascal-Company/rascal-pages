import SiteModal from "@/app/components/dashboard/SiteModal";
import PostsView from "../../posts/view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Modal({ params }: PageProps) {
  const { id } = await params;
  return (
    <SiteModal active="posts">
      <PostsView siteId={id} />
    </SiteModal>
  );
}
