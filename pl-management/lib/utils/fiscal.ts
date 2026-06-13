export const FISCAL_MONTHS = ['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月']
export const FISCAL_MONTH_NUMBERS = [4,5,6,7,8,9,10,11,12,1,2,3]

// 表示月インデックス → 実カレンダー月
export function fiscalIndexToMonth(index: number): number {
  return FISCAL_MONTH_NUMBERS[index]
}

// 実カレンダー月 → 表示月インデックス
export function monthToFiscalIndex(month: number): number {
  return FISCAL_MONTH_NUMBERS.indexOf(month)
}

export function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1
}

export function getCurrentFiscalMonthIndex(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  return monthToFiscalIndex(month)
}

export function getFiscalYears(count = 3): number[] {
  const current = getCurrentFiscalYear()
  return Array.from({ length: count }, (_, i) => current - count + i + 2)
}
