/**
 * Exam Generator Service
 * Generates formatted exam output from parsed MCQ rows
 */

import type { ParsedRow, ExamConfig } from '../types/mcq'

/**
 * Generate exam output text from parsed rows
 * @param rows Parsed and potentially shuffled rows
 * @param config Exam configuration
 * @returns Formatted exam text
 */
export function generateExamOutput(
  rows: ParsedRow[],
  config: ExamConfig
): string {
  let output = ''
  let currentQuestionNum = config.startNumber

  for (const row of rows) {
    if (row.type === 'section') {
      output += `\n${row.text}\n\n`
    } else if (row.type === 'question') {
      const prefix = config.format.questionPrefix[0] || ''
      const postfix = config.format.questionPostfix[0] || ') '
      output += `${prefix}${currentQuestionNum}${postfix}${row.text}\n`
      currentQuestionNum++
    } else if (row.type === 'answer') {
      const letter = config.format.answerLowercase
        ? row.label.toLowerCase()
        : row.label
      const prefix = config.format.answerPrefix[0] || ''
      const postfix = config.format.answerPostfix[0] || ') '
      output += `   ${prefix}${letter}${postfix}${row.text}\n`
    } else if (row.type === 'empty') {
      output += '\n'
    }
  }

  return output.trim()
}

/**
 * Generate answer key from parsed rows
 * @param rows Parsed rows
 * @param startNumber Starting question number
 * @returns Array of answer key entries (e.g., ["1. B", "2. A, C", "3. D"])
 */
export function generateAnswerKey(
  rows: ParsedRow[],
  startNumber = 1
): string[] {
  const answerKey: string[] = []
  let currentQuestionNum = startNumber
  let currentAnswers: string[] = []

  for (const row of rows) {
    if (row.type === 'question') {
      // Save previous question's answers
      if (currentAnswers.length > 0) {
        answerKey.push(
          `${currentQuestionNum - 1}. ${currentAnswers.join(', ')}`
        )
        currentAnswers = []
      }
      currentQuestionNum++
    } else if (row.type === 'answer' && row.isKey) {
      currentAnswers.push(row.label)
    }
  }

  // Don't forget the last question
  if (currentAnswers.length > 0) {
    answerKey.push(`${currentQuestionNum - 1}. ${currentAnswers.join(', ')}`)
  }

  return answerKey
}

/**
 * Renumber questions starting from a specific number
 * @param rows Parsed rows
 * @param startNumber Starting number
 * @returns Updated rows
 */
export function renumberQuestions(
  rows: ParsedRow[],
  startNumber: number
): ParsedRow[] {
  let questionNum = startNumber

  return rows.map(row => {
    if (row.type === 'question') {
      const newLabel = questionNum.toString()
      questionNum++
      return {
        ...row,
        label: newLabel,
      }
    }
    return row
  })
}
