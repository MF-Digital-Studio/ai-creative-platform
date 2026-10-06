import type {HTMLAttributes} from "react";
import {cn} from "@/lib/cn";

export function Skeleton({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("app-skeleton", className)} aria-hidden="true" {...props} />;
}

export function ProjectCardSkeleton() {
  return <article className="project-card-skeleton" aria-hidden="true"><Skeleton className="project-card-skeleton-media"/><div><Skeleton className="skeleton-title"/><Skeleton className="skeleton-meta"/><Skeleton className="skeleton-status"/></div></article>;
}

export function GenerationCardSkeleton() {
  return <article className="generation-card-skeleton" aria-hidden="true"><Skeleton className="generation-card-skeleton-media"/><Skeleton className="skeleton-title"/><Skeleton className="skeleton-meta"/></article>;
}

export function ProjectWorkspaceSkeleton() {
  return <div className="project-workspace-skeleton" aria-hidden="true"><div className="project-workspace-skeleton-header"><Skeleton/><Skeleton/></div><div className="project-workspace-skeleton-grid"><Skeleton className="project-workspace-skeleton-canvas"/><Skeleton className="project-workspace-skeleton-inspector"/></div><div className="project-workspace-skeleton-filmstrip">{[0,1,2,3].map((item) => <Skeleton key={item}/>)}</div></div>;
}
