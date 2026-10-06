import {ProjectWorkspaceSkeleton} from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return <main className="dashboard-main" aria-busy="true" aria-label="Loading"><div className="dashboard-main-inner dashboard-container project-page-shell"><ProjectWorkspaceSkeleton/></div></main>;
}
