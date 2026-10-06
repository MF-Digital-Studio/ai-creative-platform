import {ProjectCardSkeleton, Skeleton} from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <main className="dashboard-main" aria-busy="true">
      <div className="dashboard-main-inner dashboard-container dashboard-project-index projects-loading" aria-hidden="true">
        <header className="projects-index-header">
          <div className="projects-loading-heading">
            <Skeleton />
            <Skeleton />
          </div>
          <Skeleton className="projects-loading-button" />
        </header>
        <Skeleton className="projects-loading-toolbar" />
        <Skeleton className="projects-loading-count" />
        <div className="projects-gallery-grid">
          {Array.from({length: 8}, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
