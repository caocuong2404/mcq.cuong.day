/**
 * MCQ Store - Zustand state management for MCQ data
 * Following State Management Onion: Zustand for session-only state (no persistence yet)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamConfig, FormatSettings, ParsedRow } from '../types/mcq'

interface McqState {
  // === Data ===
  /** Parsed MCQ rows (internal representation) */
  parsedRows: ParsedRow[]
  /** Current format settings */
  formatSettings: FormatSettings
  /** Current exam configuration */
  examConfig: ExamConfig
  /** Generated exam output text */
  examOutput: string
  /** Answer key for generated exam */
  answerKey: string[]
  /** Raw input text for questions */
  importInput: string
  /** Raw input text for answer key */
  importAnswerKeyInput: string

  // === UI State ===
  /** Current active view */
  currentView: 'import' | 'generate' | 'answer-sheet' | 'settings'

  // === Actions ===
  setParsedRows: (rows: ParsedRow[]) => void
  setFormatSettings: (settings: Partial<FormatSettings>) => void
  setExamConfig: (config: Partial<ExamConfig>) => void
  setExamOutput: (output: string) => void
  setAnswerKey: (key: string[]) => void
  setImportInput: (input: string) => void
  setImportAnswerKeyInput: (input: string) => void
  setCurrentView: (view: McqState['currentView']) => void
  resetAll: () => void
}

/**
 * Initial state
 */
const initialState = {
  parsedRows: [],
  formatSettings: {
    questionPrefix: ['', ''],
    questionPostfix: ['. ', '). '],
    answerPrefix: ['', ''],
    answerPostfix: ['. ', '). '],
    answerLowercase: false,
    correctPrefix: ['*'],
  } as FormatSettings,
  examConfig: {
    shuffleSections: false,
    shuffleQuestions: false,
    shuffleAnswers: false,
    startNumber: 1,
    format: {
      questionPrefix: ['', ''],
      questionPostfix: ['. ', '). '],
      answerPrefix: ['', ''],
      answerPostfix: ['. ', '). '],
      answerLowercase: false,
    },
  } as ExamConfig,
  examOutput: '',
  answerKey: [],
  importInput: '',
  importAnswerKeyInput: '',
  currentView: 'import' as const,
}

/**
 * MCQ Zustand Store
 *
 * Usage following CRITICAL performance pattern:
 * ```tsx
 * // ✅ GOOD: Use getState() to avoid render cascades
 * const handleAction = useCallback(() => {
 *   const { parsedRows, setParsedRows } = useMcqStore.getState()
 *   setParsedRows(newRows)
 * }, []) // Empty deps = stable
 *
 * // ❌ BAD: Store subscriptions cause cascades
 * const { parsedRows, setParsedRows } = useMcqStore()
 * const handleAction = useCallback(() => {
 *   setParsedRows(newRows)
 * }, [parsedRows, setParsedRows]) // Re-creates constantly
 * ```
 */
export const useMcqStore = create<McqState>()(
  persist(
    set => ({
      ...initialState,

      setParsedRows: rows => set({ parsedRows: rows }),

      setFormatSettings: settings =>
        set(state => {
          const newSettings = { ...state.formatSettings, ...settings }
          // Also update examConfig.format to keep them in sync
          return {
            formatSettings: newSettings,
            examConfig: {
              ...state.examConfig,
              format: newSettings,
            },
          }
        }),

      setExamConfig: config =>
        set(state => ({
          examConfig: { ...state.examConfig, ...config },
        })),

      setExamOutput: output => set({ examOutput: output }),

      setAnswerKey: key => set({ answerKey: key }),

      setImportInput: input => set({ importInput: input }),

      setImportAnswerKeyInput: input => set({ importAnswerKeyInput: input }),

      setCurrentView: view => set({ currentView: view }),

      resetAll: () => set(initialState),
    }),
    {
      name: 'mcq-storage',
      partialize: state => ({
        formatSettings: state.formatSettings,
        examConfig: state.examConfig,
        importInput: state.importInput,
        importAnswerKeyInput: state.importAnswerKeyInput,
      }),
    }
  )
)
