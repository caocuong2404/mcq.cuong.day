/**
 * MCQ Parser Service
 * Migrated from script.js - handles parsing of MCQ text input
 */

import type { ParsedRow, FormatSettings } from '../types/mcq'

/**
 * Parse MCQ text input into structured rows
 * Handles multiple formats:
 * - Simple: "1. Question? A. answer B. answer"
 * - With points: "1. (0.2 Point)\nQuestion text\na. answer\nb. answer"
 * - Mixed case: supports both "A." and "a."
 *
 * @param input Raw text input from user
 * @param formatSettings Format settings for parsing
 * @returns Array of parsed rows
 */
export function parseMcq(
  input: string,
  _formatSettings: FormatSettings
): ParsedRow[] {
  // Normalize line endings
  const normalized = input
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[\u000a\u000b\u000c\u000d\u0085\u2028\u2029]/g, '\n')

  if (!normalized) return []

  const rows: ParsedRow[] = []
  let rowId = 0

  // Match "1." or "1)" for questions, OR "### Header" for sections
  const blockStartPattern = /^\s*(?:(\d{1,3})[.)]|(###.*))/gm

  // Split by blocks
  const blocks: { text: string; type: 'question' | 'section'; match: RegExpExecArray }[] = []
  let match: RegExpExecArray | null

  while ((match = blockStartPattern.exec(normalized)) !== null) {
    if (blocks.length === 0 && match.index > 0) {
      // Text before first block = implicit first section header
      const headerText = normalized.substring(0, match.index).trim()
      if (headerText) {
        rows.push(createRow(++rowId, 'section', 'S', headerText))
        rows.push(createRow(++rowId, 'empty', '', ''))
      }
    }

    const nextMatch = blockStartPattern.exec(normalized)
    const end = nextMatch ? nextMatch.index : normalized.length
    
    // Reset lastIndex so we find the next match correctly in the next iteration
    if (nextMatch) {
      blockStartPattern.lastIndex = nextMatch.index
    }

    const blockText = normalized.substring(match.index, end)
    const isSection = !!match[2] // Group 2 is the ### section
    
    blocks.push({
      text: blockText,
      type: isSection ? 'section' : 'question',
      match
    })
    
    if (!nextMatch) break
  }

  // If no blocks found, treat entire input as section
  if (blocks.length === 0) {
    // Check if there's any text at all
    if (normalized.trim()) {
      rows.push(createRow(++rowId, 'section', 'S', normalized))
      rows.push(createRow(++rowId, 'empty', '', ''))
    }
    return rows
  }

  // Process blocks
  blocks.forEach(block => {
    if (block.type === 'section') {
      // Strip the ### prefix
      const sectionTitle = block.match[2]?.replace(/^###\s*/, '').trim() || ''
      rows.push(createRow(++rowId, 'section', 'S', sectionTitle))
      rows.push(createRow(++rowId, 'empty', '', ''))
    } else {
      // Question block
      try {
        const questionRows = parseQuestionBlockFlexible(block.text, rowId)
        questionRows.forEach(row => {
          rowId++
          row.id = rowId
          rows.push(row)
        })
        rows.push(createRow(++rowId, 'empty', '', ''))
      } catch {
        rows.push(createRow(++rowId, 'error', 'error', block.text))
        rows.push(createRow(++rowId, 'empty', '', ''))
      }
    }
  })

  return rows
}

/**
 * Parse a question block with flexible format support
 * Handles:
 * - "1. Question? A. ans B. ans" (inline)
 * - "1. (0.2 Point)\nQuestion\na. ans\nb. ans" (multiline with points)
 * - Mixed uppercase/lowercase answer letters
 */
function parseQuestionBlockFlexible(
  block: string,
  startId: number
): ParsedRow[] {
  const rows: ParsedRow[] = []

  // Extract question number - matches "1." or "1)" with optional (points)
  const questionMatch = block.match(/^\s*(\d{1,3})[.)]\s*(\([^)]*\))?\s*/)
  if (!questionMatch?.[1] || !questionMatch[0])
    throw new Error('Invalid question format')

  const questionNumber = questionMatch[1]
  const remainingText = block.substring(questionMatch[0].length)

  // Find where answers start - look for "A." or "a." pattern
  const answerStartPattern = /\s*[*]?\s*[Aa][.)]\s+/
  const answerStartMatch = remainingText.match(answerStartPattern)

  let questionText: string
  let answersText: string

  if (answerStartMatch?.index !== undefined) {
    questionText = remainingText.substring(0, answerStartMatch.index).trim()
    answersText = remainingText.substring(answerStartMatch.index)
  } else {
    // No answers found, entire text is question
    questionText = remainingText.trim()
    answersText = ''
  }

  // Add question row
  rows.push(
    createRow(
      startId + rows.length + 1,
      'question',
      questionNumber,
      questionText,
      parseInt(questionNumber)
    )
  )

  // Parse answers - flexible pattern matching both "A." and "a."
  if (answersText) {
    // Pattern matches optional * prefix, then letter, then separator, then content
    // Uses negative lookahead to stop at next answer marker
    const answerPattern =
      /([*])?\s*([A-Ea-e])[.)]\s+((?:(?!\s[*]?\s*[A-Ea-e][.)]).)+)/g
    let answerMatch: RegExpExecArray | null

    while ((answerMatch = answerPattern.exec(answersText)) !== null) {
      if (!answerMatch[2] || !answerMatch[3]) continue

      const isCorrect = !!answerMatch[1] // Check if * group exists
      const answerLetter = answerMatch[2].toUpperCase()
      const answerText = answerMatch[3].trim()

      const row = createRow(
        startId + rows.length + 1,
        'answer',
        answerLetter,
        answerText
      )
      if (isCorrect) {
        row.isKey = true
      }
      rows.push(row)
    }
  }

  return rows
}

/**
 * Create a parsed row object
 */
function createRow(
  id: number,
  type: ParsedRow['type'],
  label: string,
  text: string,
  originalNumber?: number
): ParsedRow {
  return {
    id,
    type,
    label,
    text,
    isKey: false,
    locked: false,
    originalNumber,
  }
}

/**
 * Parse answer key text into question-answer mappings
 * Format: "1. B" or "1) B" or "1 B" etc.
 * @param input Answer key text
 * @returns Map of question number to correct answer letters
 */
export function parseAnswerKey(input: string): Map<number, string[]> {
  const answerKey = new Map<number, string[]>()

  if (!input.trim()) return answerKey

  const lines = input.split('\n').filter(line => line.trim())

  for (const line of lines) {
    // Match patterns like: "1. B", "1) B", "1 B", "1. A, C", "1) ABC", etc.
    const match = line.match(/(\d+)[.):\s]+([A-Ea-e,\s]+)/)
    if (!match?.[1] || !match[2]) continue

    const questionNum = parseInt(match[1])
    const answersStr = match[2].toUpperCase().replace(/[^A-E]/g, '') // Remove everything except A-E

    if (answersStr.length === 0) continue

    // Split into individual letters
    const answers = answersStr.split('').filter(c => /[A-E]/.test(c))

    answerKey.set(questionNum, answers)
  }

  return answerKey
}

/**
 * Apply answer key to parsed rows
 * @param rows Parsed rows
 * @param answerKey Answer key mapping
 * @returns Updated rows with isKey set correctly
 */
export function applyAnswerKey(
  rows: ParsedRow[],
  answerKey: Map<number, string[]>
): ParsedRow[] {
  // First, reset all keys
  rows.forEach(row => {
    if (row.type === 'answer') {
      row.isKey = false
    }
  })

  // Find current question number for each answer row
  let currentQuestionNum: number | null = null

  for (const row of rows) {
    if (row.type === 'question') {
      currentQuestionNum = parseInt(row.label)
    } else if (row.type === 'answer' && currentQuestionNum !== null) {
      const correctAnswers = answerKey.get(currentQuestionNum) || []
      if (correctAnswers.includes(row.label)) {
        row.isKey = true
      }
    }
  }

  return rows
}
