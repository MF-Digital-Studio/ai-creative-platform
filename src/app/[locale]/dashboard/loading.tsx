export default function DashboardLoading() {
  return <main className="dashboard-main" aria-busy="true"><div className="dashboard-main-inner dashboard-container dashboard-loading">
    <div className="dashboard-skeleton dashboard-skeleton-heading" />
    <div className="dashboard-skeleton dashboard-skeleton-panel" />
    <div className="dashboard-overview-grid">{[0, 1, 2].map((item) => <div key={item} className="dashboard-skeleton dashboard-skeleton-stat" />)}</div>
    <div className="dashboard-skeleton dashboard-skeleton-heading" />
    <div className="dashboard-recent-grid">{[0, 1, 2].map((item) => <div key={item} className="dashboard-skeleton dashboard-skeleton-card" />)}</div>
    <div className="dashboard-skeleton dashboard-skeleton-heading" />
    <div className="dashboard-generation-grid">{[0, 1, 2].map((item) => <div key={item} className="dashboard-skeleton dashboard-skeleton-card" />)}</div>
  </div></main>;
}
