export default function DiseaseTag({ name, color = '#ef4444' }) {
  if (!name) return null
  const display = name.replace('Tomato_', '').replace(/_/g, ' ')
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: `${color}20`,
      color,
    }}>
      {display}
    </span>
  )
}
