'use client'

import { useState, useCallback } from 'react'
import { upsertPlActual, upsertPlPlan } from '@/actions/pl'
import { computeMonthValues } from '@/lib/calc/pl'
import { FISCAL_MONTHS, FISCAL_MONTH_NUMBERS } from '@/lib/utils/fiscal'
import { fmtPct } from '@/lib/utils/format'
import clsx from 'clsx'
import type { Business, PlActual, PlPlan } from '@/types'

interface Props {
  business: Business
  fiscalYear: number
  actuals: PlActual[]
  plans: PlPlan[]
  canEdit: boolean
}

type InputMode = 'actual' | 'plan'

const FILLED_IDX = 5

export default function PlInputTable({ business, fiscalYear, actuals, plans, canEdit }: Props) {
  const [mode, setMode] = useState<InputMode>('actual')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // ローカル入力バッファ (month -> fields)
  const [actualBuf, setActualBuf] = useState<Record<number, Partial<PlActual>>>(() => {
    const buf: Record<number, Partial<PlActual>> = {}
    actuals.forEach(a => { buf[a.month] = { ...a } })
    return buf
  })
  const [planBuf, setPlanBuf] = useState<Record<number, Partial<PlPlan>>>(() => {
    const buf: Record<number, Partial<PlPlan>> = {}
    plans.forEach(p => { buf[p.month] = { ...p } })
    return buf
  })

  function getActual(month: number): Partial<PlActual> {
    return actualBuf[month] ?? { sales:0, cogs:0, sg_personnel:0, sg_marketing:0, sg_other:0 }
  }
  function getPlan(month: number): Partial<PlPlan> {
    return planBuf[month] ?? { sales:0, cogs:0, sg_personnel:0, sg_marketing:0, sg_other:0 }
  }

  function updateActual(month: number, field: string, value: number) {
    setActualBuf(prev => ({ ...prev, [month]: { ...getActual(month), [field]: value } }))
    setSaved(false)
  }
  function updatePlan(month: number, field: string, value: number) {
    setPlanBuf(prev => ({ ...prev, [month]: { ...getPlan(month), [field]: value } }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setErrors([])
    try {
      if (mode === 'actual') {
        await Promise.all(
          FISCAL_MONTH_NUMBERS.map(month => {
            const d = getActual(month)
            return upsertPlActual({
              business_id: business.id, fiscal_year: fiscalYear, month,
              sales: d.sales ?? 0, cogs: d.cogs ?? 0,
              sg_personnel: d.sg_personnel ?? 0, sg_marketing: d.sg_marketing ?? 0, sg_other: d.sg_other ?? 0,
            })
          })
        )
      } else {
        await Promise.all(
          FISCAL_MONTH_NUMBERS.map(month => {
            const d = getPlan(month)
            return upsertPlPlan({
              business_id: business.id, fiscal_year: fiscalYear, month, version: 1,
              sales: d.sales ?? 0, cogs: d.cogs ?? 0,
              sg_personnel: d.sg_personnel ?? 0, sg_marketing: d.sg_marketing ?? 0, sg_other: d.sg_other ?? 0,
            })
          })
        )
      }
      setSaved(true)
    } catch (e: any) {
      setErrors([e.message])
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { key: 'sales',        label: '売上高',   bold: true },
    { key: 'cogs',         label: '売上原価', bold: false },
    { key: 'sg_personnel', label: '人件費',   bold: false },
    { key: 'sg_marketing', label: '広告費',   bold: false },
    { key: 'sg_other',     label: 'その他販管費', bold: false },
  ] as const

  return (
    <div className="space-y-4">
      {/* モード切替 + 保存 */}
      <div className="card flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-bg3 p-1 rounded-lg">
          {(['actual', 'plan'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                'px-4 py-1.5 rounded-md text-xs font-semibold transition-all',
                mode === m ? 'bg-card text-white shadow' : 'text-muted hover:text-white'
              )}
            >
              {m === 'actual' ? '実績入力' : '計画入力'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-success">✅ 保存済み</span>}
          {errors.map((e, i) => <span key={i} className="text-xs text-danger">⚠️ {e}</span>)}
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {saving ? '保存中...' : '💾 保存'}
            </button>
          )}
          {!canEdit && (
            <span className="badge-yellow text-xs">閲覧のみ</span>
          )}
        </div>
      </div>

      {/* 入力テーブル */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-bg3 border-b border-border">
              <th className="text-left py-3 px-4 text-muted font-semibold w-36">項目</th>
              {FISCAL_MONTHS.map((m, i) => (
                <th key={m} className={clsx(
                  'text-center py-3 px-1 text-muted font-semibold min-w-[72px]',
                  i <= FILLED_IDX ? 'text-white' : 'opacity-50'
                )}>
                  {m}
                  {i === FILLED_IDX && <div className="text-[9px] text-accent">←最新</div>}
                </th>
              ))}
              <th className="text-right py-3 px-4 text-muted font-semibold">年計</th>
            </tr>
          </thead>
          <tbody>
            {/* 入力行 */}
            {rows.map(row => {
              const yearTotal = FISCAL_MONTH_NUMBERS.reduce((sum, month) => {
                const d = mode === 'actual' ? getActual(month) : getPlan(month)
                return sum + ((d as any)[row.key] ?? 0)
              }, 0)

              return (
                <tr key={row.key} className="border-b border-border/50 hover:bg-bg3/30">
                  <td className={clsx('py-2 px-4 text-muted', row.bold && 'font-bold text-white')}>
                    {row.label}
                  </td>
                  {FISCAL_MONTH_NUMBERS.map((month, i) => {
                    const d = mode === 'actual' ? getActual(month) : getPlan(month)
                    const val = (d as any)[row.key] ?? 0
                    return (
                      <td key={month} className="py-1 px-1">
                        {canEdit ? (
                          <input
                            type="number"
                            value={val || ''}
                            placeholder="0"
                            onChange={e => {
                              const v = parseFloat(e.target.value) || 0
                              if (mode === 'actual') updateActual(month, row.key, v)
                              else updatePlan(month, row.key, v)
                            }}
                            className={clsx(
                              'w-full bg-bg3 border border-border rounded px-2 py-1 text-right text-white',
                              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors',
                              i > FILLED_IDX && 'opacity-50'
                            )}
                          />
                        ) : (
                          <div className="text-right px-2 py-1 text-white">{val || '—'}</div>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-right py-2 px-4 font-bold text-white">
                    {yearTotal > 0 ? yearTotal.toLocaleString() : '—'}
                  </td>
                </tr>
              )
            })}

            {/* 区切り */}
            <tr><td colSpan={15} className="h-px bg-border" /></tr>

            {/* 自動計算行 */}
            {FISCAL_MONTH_NUMBERS.length > 0 && (() => {
              const autoRows = [
                { label: '粗利益 🔒',   cls: 'text-white font-bold', fn: (m: number) => { const d = mode==='actual'?getActual(m):getPlan(m); return (d.sales??0)-(d.cogs??0) } },
                { label: '販管費合計 🔒',cls: 'text-muted',           fn: (m: number) => { const d = mode==='actual'?getActual(m):getPlan(m); return (d.sg_personnel??0)+(d.sg_marketing??0)+(d.sg_other??0) } },
                { label: '営業利益 🔒',  cls: 'text-success font-bold',fn: (m: number) => { const d = mode==='actual'?getActual(m):getPlan(m); return (d.sales??0)-(d.cogs??0)-(d.sg_personnel??0)-(d.sg_marketing??0)-(d.sg_other??0) } },
                { label: '利益率% 🔒',  cls: 'text-accent',           fn: (m: number) => { const d = mode==='actual'?getActual(m):getPlan(m); const s=d.sales??0; const op=(s)-(d.cogs??0)-(d.sg_personnel??0)-(d.sg_marketing??0)-(d.sg_other??0); return s>0?op/s*100:0 }, isPct: true },
              ]
              return autoRows.map(row => {
                const values = FISCAL_MONTH_NUMBERS.map(m => row.fn(m))
                const yearTotal = values.reduce((a, b) => a + b, 0)
                return (
                  <tr key={row.label} className="border-b border-border/50 bg-bg2/40">
                    <td className={clsx('py-2 px-4', row.cls)}>{row.label}</td>
                    {values.map((v, i) => (
                      <td key={i} className={clsx('text-right py-2 px-2', row.cls)}>
                        {row.isPct ? `${v.toFixed(1)}%` : v !== 0 ? v.toLocaleString() : '—'}
                      </td>
                    ))}
                    <td className={clsx('text-right py-2 px-4 font-bold', row.cls)}>
                      {row.isPct
                        ? (() => { const s = FISCAL_MONTH_NUMBERS.reduce((a, m)=>a+(getActual(m).sales??0),0); const op = FISCAL_MONTH_NUMBERS.reduce((a,m)=>{const d=mode==='actual'?getActual(m):getPlan(m);return a+(d.sales??0)-(d.cogs??0)-(d.sg_personnel??0)-(d.sg_marketing??0)-(d.sg_other??0)},0); return s>0?(op/s*100).toFixed(1)+'%':'—' })()
                        : yearTotal > 0 ? yearTotal.toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted">🔒 = 自動計算項目（編集不可）　単位: 百万円</div>
    </div>
  )
}
