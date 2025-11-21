/**
 * MCQ Shuffle - Type Definitions
 * Data models for multiple choice questions, answers, and exam configuration
 */

/**
 * Answer option for a question (A, B, C, D, or E)
 */
export interface Answer {
  /** Answer letter (A-E) */
  letter: 'A' | 'B' | 'C' | 'D' | 'E'
  /** Answer text content */
  text: string
  /** Whether this answer is correct */
  isCorrect: boolean
  /** Whether this answer is locked from shuffling */
  locked: boolean
}

/**
 * Multiple choice question
 */
export interface Question {
  /** Question number */
  number: number
  /** Question text content */
  text: string
  /** Array of answer options */
  answers: Answer[]
  /** Whether this question is locked from shuffling */
  locked: boolean
  /** Original question number (for tracking after shuffle) */
  originalNumber?: number
}

/**
 * Section header for organizing questions
 */
export interface Section {
  /** Section title/text */
  text: string
  /** Whether this section is locked from shuffling */
  locked: boolean
}

/**
 * Format settings for parsing and output
 */
export interface FormatSettings {
  /** Question label prefix options (e.g., ["(", ""] for "(1)" or "1)") */
  questionPrefix: string[]
  /** Question label postfix options (e.g., [")", "). "] for "(1)" or "1). ") */
  questionPostfix: string[]
  /** Answer label prefix options (e.g., ["(", ""] for "(A)" or "A)") */
  answerPrefix: string[]
  /** Answer label postfix options (e.g., [")", "). "] for "(A)" or "A). ") */
  answerPostfix: string[]
  /** Whether to use lowercase letters for answers */
  answerLowercase: boolean
  /** Prefix indicating a correct answer (e.g., ["*"]) */
  correctPrefix: string[]
}

/**
 * Exam generation configuration
 */
export interface ExamConfig {
  /** Whether to shuffle sections */
  shuffleSections: boolean
  /** Whether to shuffle questions within sections */
  shuffleQuestions: boolean
  /** Whether to shuffle answer options */
  shuffleAnswers: boolean
  /** Starting number for question renumbering */
  startNumber: number
  /** Format settings for output */
  format: FormatSettings
}

/**
 * Parsed MCQ row type (for internal table representation)
 */
export type ParsedRowType =
  | 'section'
  | 'question'
  | 'answer'
  | 'empty'
  | 'error'

/**
 * Parsed MCQ row (internal representation during parsing)
 */
export interface ParsedRow {
  /** Row ID */
  id: number
  /** Row type */
  type: ParsedRowType
  /** Label (S for section, number for question, letter for answer) */
  label: string
  /** Text content */
  text: string
  /** Whether marked as correct (for answers) */
  isKey?: boolean
  /** Whether locked from shuffling */
  locked: boolean
  /** Original number (for questions, tracking after shuffle) */
  originalNumber?: number
}

/**
 * Complete MCQ dataset (questions organized by sections)
 */
export interface McqData {
  /** Array of sections, each containing questions */
  sections: {
    /** Section header (optional) */
    header?: Section
    /** Questions in this section */
    questions: Question[]
  }[]
}

/**
 * Answer key entry (question number → correct answer letters)
 */
export interface AnswerKeyEntry {
  /** Question number */
  questionNumber: number
  /** Correct answer letters (e.g., ["A"], ["A", "C", "D"] for multiple correct) */
  correctAnswers: string[]
}

/**
 * Default format settings
 */
export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  questionPrefix: ['(', ''],
  questionPostfix: [')', '). '],
  answerPrefix: ['(', ''],
  answerPostfix: [')', '). '],
  answerLowercase: false,
  correctPrefix: ['*'],
}

/**
 * Default exam configuration
 */
export const DEFAULT_EXAM_CONFIG: ExamConfig = {
  shuffleSections: false,
  shuffleQuestions: false,
  shuffleAnswers: false,
  startNumber: 1,
  format: DEFAULT_FORMAT_SETTINGS,
}
