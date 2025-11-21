/**
 * MCQ Validator Service
 * Validates parsed MCQ rows to ensure they follow the expected pattern
 * Pattern: ' S #ABCD #ABCD S #ABCDE #AB #ABC S #ABCD '
 * Where: S = section, # = question number, ABCDE = answers,  = empty line
 */

import type { ParsedRow } from '../types/mcq'

/**
 * Check if a label is a number
 */
function isNum(label: string): boolean {
  return /^\d+$/.test(label)
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the rows are valid */
  isValid: boolean
  /** ID of first error row (if any) */
  firstErrorRowId?: number
  /** Rows with error flags set */
  validatedRows: ParsedRow[]
}

/**
 * Validate parsed MCQ rows
 * @param rows Parsed rows to validate
 * @returns Validation result with error flags
 */
export function validateParsedMcq(rows: ParsedRow[]): ValidationResult {
  if (rows.length === 0) {
    return { isValid: true, validatedRows: [] }
  }

  const validatedRows = rows.map(row => ({ ...row }))
  let firstErrorRowId: number | undefined

  validatedRows.forEach((row, index) => {
    // Reset error state
    const wasError = row.type === 'error'
    if (!wasError) {
      row.type =
        row.type === 'section'
          ? 'section'
          : row.type === 'question'
            ? 'question'
            : row.type === 'answer'
              ? 'answer'
              : 'empty'
    }

    const label = row.label
    const previousLabel = index > 0 ? validatedRows[index - 1]?.label || '' : ''
    const nextLabel =
      index < validatedRows.length - 1
        ? validatedRows[index + 1]?.label || ''
        : ''
    const nextNextLabel =
      index < validatedRows.length - 2
        ? validatedRows[index + 2]?.label || ''
        : ''

    let hasError = false

    // Section validation: ' S #' pattern
    if (label === 'S') {
      if (previousLabel !== '' || nextLabel !== '' || !isNum(nextNextLabel)) {
        hasError = true
      }
    }

    // Empty line validation: should not be in middle of '#ABCD' pattern
    if (label === '') {
      if (
        previousLabel === 'A' ||
        isNum(previousLabel) ||
        ['A', 'B', 'C', 'D', 'E'].includes(nextLabel)
      ) {
        hasError = true
      }
    }

    // Question validation: ' #A' pattern
    if (isNum(label)) {
      if (previousLabel !== '' || nextLabel !== 'A') {
        hasError = true
      }
    }

    // Answer A validation: '#AB' pattern
    if (label === 'A') {
      if (!isNum(previousLabel) || nextLabel !== 'B') {
        hasError = true
      }
    }

    // Answer B validation: 'ABC' or 'AB ' patterns
    if (label === 'B') {
      if (previousLabel !== 'A' || (nextLabel !== 'C' && nextLabel !== '')) {
        hasError = true
      }
    }

    // Answer C validation: 'BCD' or 'BC ' patterns
    if (label === 'C') {
      if (previousLabel !== 'B' || (nextLabel !== 'D' && nextLabel !== '')) {
        hasError = true
      }
    }

    // Answer D validation: 'CDE' or 'CD ' patterns
    if (label === 'D') {
      if (previousLabel !== 'C' || (nextLabel !== 'E' && nextLabel !== '')) {
        hasError = true
      }
    }

    // Answer E validation: 'DE ' pattern
    if (label === 'E') {
      if (previousLabel !== 'D' || nextLabel !== '') {
        hasError = true
      }
    }

    // Mark error rows
    if (wasError || hasError) {
      row.type = 'error'
      if (!firstErrorRowId) {
        firstErrorRowId = row.id
      }
    }
  })

  const isValid = firstErrorRowId === undefined

  return {
    isValid,
    firstErrorRowId,
    validatedRows,
  }
}

/**
 * Check if all questions have at least one correct answer marked
 * @param rows Validated parsed rows
 * @returns Array of question numbers missing answer keys
 */
export function findQuestionsWithoutKeys(rows: ParsedRow[]): number[] {
  const questionsWithoutKeys: number[] = []
  let currentQuestionNum: number | null = null
  let currentQuestionHasKey = false

  for (const row of rows) {
    if (row.type === 'question') {
      // Check previous question
      if (currentQuestionNum !== null && !currentQuestionHasKey) {
        questionsWithoutKeys.push(currentQuestionNum)
      }

      // Start new question
      currentQuestionNum = parseInt(row.label)
      currentQuestionHasKey = false
    } else if (row.type === 'answer' && row.isKey) {
      currentQuestionHasKey = true
    }
  }

  // Check last question
  if (currentQuestionNum !== null && !currentQuestionHasKey) {
    questionsWithoutKeys.push(currentQuestionNum)
  }

  return questionsWithoutKeys
}
