import {GenerationCardSkeleton, Skeleton} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <main className="dashboard-main" aria-busy="true" aria-label="Loading"><div className="dashboard-main-inner dashboard-container dashboard-loading" aria-hidden="true">
    <section className="dashboard-loading-composer"><Skeleton className="dashboard-loading-kicker"/><Skeleton className="dashboard-loading-title"/><Skeleton className="dashboard-loading-upload"/><div className="dashboard-loading-form"><Skeleton/><Skeleton/><Skeleton/></div></section>
    <section><Skeleton className="dashboard-loading-section-title"/><div className="dashboard-loading-presets">{[0,1,2,3].map((item) => <Skeleton key={item}/>)}</div></section>
    <section><Skeleton className="dashboard-loading-section-title"/><div className="dashboard-generation-grid">{[0,1,2].map((item) => <GenerationCardSkeleton key={item}/>)}</div></section>
    <section><Skeleton className="dashboard-loading-section-title"/><div className="dashboard-overview-grid">{[0,1,2].map((item) => <Skeleton className="dashboard-loading-stat" key={item}/>)}</div></section>
  </div></main>;
}
