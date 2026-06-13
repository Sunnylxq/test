export function fmtMoney(value: number, unit = 'M'): string {
  return `¥${Math.round(value).toLocaleString()}${unit}`
}

export function fmtPct(value: number, showSign = false): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function fmtNum(value: number): string {
  return Math.round(value).toLocaleString()
}

export function fmtChange(value: number): string {
  return `${value >= 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(1)}%`
}

export function getChangeColor(value: number, inverse = false): string {
  if (inverse) return value > 0 ? 'text-danger' : 'text-success'
  return value >= 0 ? 'text-success' : 'text-danger'
}

export function getAchieveColor(rate: number): string {
  if (rate >= 110) return 'text-success'
  if (rate >= 100) return 'text-info'
  if (rate >= 90)  return 'text-warning'
  return 'text-danger'
}

export function getAchieveBadgeClass(rate: number): string {
  if (rate >= 110) return 'badge-green'
  if (rate >= 100) return 'badge-blue'
  if (rate >= 90)  return 'badge-yellow'
  return 'badge-red'
}
