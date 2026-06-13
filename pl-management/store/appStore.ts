'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Business } from '@/types'
import { getCurrentFiscalYear, getCurrentFiscalMonthIndex } from '@/lib/utils/fiscal'

interface AppStore {
  // 事業
  selectedBusinessId: string | null
  businesses: Business[]
  setSelectedBusiness: (id: string | null) => void
  setBusinesses: (businesses: Business[]) => void

  // 年度
  fiscalYear: number
  setFiscalYear: (year: number) => void

  // 現在月インデックス (0-based, デモ用)
  currentMonthIdx: number
  setCurrentMonthIdx: (idx: number) => void

  // UI
  sidebarOpen: boolean
  inputMode: 'actual' | 'plan' | 'prev'
  toggleSidebar: () => void
  setInputMode: (mode: 'actual' | 'plan' | 'prev') => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedBusinessId: null,
      businesses: [],
      setSelectedBusiness: (id) => set({ selectedBusinessId: id }),
      setBusinesses: (businesses) => set({ businesses }),

      fiscalYear: getCurrentFiscalYear(),
      setFiscalYear: (year) => set({ fiscalYear: year }),

      currentMonthIdx: 5, // デモ: 9月 (インデックス5)
      setCurrentMonthIdx: (idx) => set({ currentMonthIdx: idx }),

      sidebarOpen: true,
      inputMode: 'actual',
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setInputMode: (mode) => set({ inputMode: mode }),
    }),
    {
      name: 'pl-app-store',
      partialize: (s) => ({
        selectedBusinessId: s.selectedBusinessId,
        fiscalYear: s.fiscalYear,
        currentMonthIdx: s.currentMonthIdx,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
)
