/**
 * Reusable skeleton loading components.
 * Usage:
 *   <Skeleton width="100%" height={20} />
 *   <SkeletonCard />
 *   <SkeletonStatRow />
 */

const pulse = {
  animation: 'skeletonPulse 1.6s ease-in-out infinite',
  background: 'linear-gradient(90deg, #1e293b 25%, #273548 50%, #1e293b 75%)',
  backgroundSize: '200% 100%',
  borderRadius: 6,
}

// Inject keyframes once
if (typeof document !== 'undefined') {
  const id = 'skeleton-keyframes'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes skeletonPulse {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `
    document.head.appendChild(style)
  }
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style = {} }) {
  return (
    <div style={{ width, height, borderRadius, ...pulse, ...style }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="40%" height={12} />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <Skeleton width={48} height={48} borderRadius={10} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="50%" height={28} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
      <Skeleton width={44} height={44} borderRadius={10} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </div>
      <Skeleton width={48} height={14} />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Skeleton width={260} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={180} height={14} />
      </div>

      {/* Alert bar */}
      <Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 24 }} />

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <Skeleton width="40%" height={18} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={160} borderRadius={8} />
        </div>
        <div className="card">
          <Skeleton width="50%" height={18} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={160} borderRadius={8} />
        </div>
      </div>

      {/* Recent */}
      <div className="card">
        <Skeleton width="35%" height={18} style={{ marginBottom: 16 }} />
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}

export function SkeletonPrediction() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <Skeleton width="50%" height={20} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={36} borderRadius={10} />
      </div>
      <div className="card">
        <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={8} borderRadius={4} />
      </div>
    </div>
  )
}
