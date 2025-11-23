/**
 * MCQ Shuffle Service
 * Migrated from script.js - handles shuffling of sections, questions, and answers
 */

import type { ParsedRow } from '../types/mcq'

/**
 * Fisher-Yates shuffle algorithm with locked indices support
 * Shuffles array in place, preserving locked elements at their original positions
 * @param array Array to shuffle
 * @param lockedIndexes Indexes that should not be shuffled
 */
function shuffleArray<T>(array: T[], lockedIndexes: number[]): void {
  const sorted = [...lockedIndexes].sort((a, b) => a - b)
  const lockedElements: T[] = []

  // Extract locked elements
  for (const idx of sorted) {
    const element = array[idx]
    if (element !== undefined) {
      lockedElements.push(element)
    }
  }

  // Remove locked elements from array (reverse order to preserve indexes)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const idx = sorted[i]
    if (idx !== undefined) {
      array.splice(idx, 1)
    }
  }

  // Shuffle remaining unlocked elements (Fisher-Yates)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    const swap = array[j]
    if (temp !== undefined && swap !== undefined) {
      array[i] = swap
      array[j] = temp
    }
  }

  // Restore locked elements to their original positions
  sorted.forEach((originalIndex, i) => {
    const element = lockedElements[i]
    if (element !== undefined && originalIndex !== undefined) {
      array.splice(originalIndex, 0, element)
    }
  })
}

/**
 * Split parsed rows into sections
 * Structure: [[S],[S],[S]...]  where [S]=[row,row,row,row...]
 * @param rows Parsed rows
 * @returns Array of sections
 */
function splitIntoSections(rows: ParsedRow[]): ParsedRow[][] {
  const sections: ParsedRow[][] = []

  rows.forEach(row => {
    if (row.type === 'section') {
      // Create new section
      sections.push([row])
    } else {
      // Add to current section
      if (sections.length === 0) {
        // Create implicit section if first row is not a section
        sections.push([])
      }
      const currentSection = sections[sections.length - 1]
      if (currentSection) {
        currentSection.push(row)
      }
    }
  })

  return sections
}

/**
 * Split a section into questions
 * Structure: [S]=[[header],[Q],[Q]...]  where [Q]=[row,row,row,row...]
 * @param section Section rows
 * @returns Array of question blocks (first element is section header if exists)
 */
function splitSectionIntoQuestions(section: ParsedRow[]): ParsedRow[][] {
  const questions: ParsedRow[][] = []

  // Extract section header if exists
  if (section.length > 0 && section[0]?.type === 'section') {
    const header = section.slice(0, 2) // [section header, empty row]
    questions.push(header)

    // Process remaining rows
    section.slice(2).forEach(row => {
      if (row.type === 'question') {
        // Start new question block
        questions.push([row])
      } else {
        // Add to current question block
        if (questions.length > 1) {
          const currentQuestion = questions[questions.length - 1]
          if (currentQuestion) {
            currentQuestion.push(row)
          }
        }
      }
    })
  } else {
    // No section header, process all rows
    section.forEach(row => {
      if (row.type === 'question') {
        questions.push([row])
      } else if (questions.length > 0) {
        const currentQuestion = questions[questions.length - 1]
        if (currentQuestion) {
          currentQuestion.push(row)
        }
      }
    })
  }

  return questions
}

/**
 * Split all sections into questions
 * Structure: [[S],[S],[S]...]  where [S]=[[header],[Q],[Q]...]  where [Q]=[row,row,row,row...]
 * @param rows Parsed rows
 * @returns Nested array structure
 */
function splitIntoSectionsAndQuestions(rows: ParsedRow[]): ParsedRow[][][] {
  const sections = splitIntoSections(rows)
  return sections.map(section => splitSectionIntoQuestions(section))
}

/**
 * Reletter answers to A, B, C, D, E after shuffling
 * @param rows Parsed rows
 * @returns Updated rows with correct answer letters
 */
function reletterAnswers(rows: ParsedRow[]): ParsedRow[] {
  const letters = ['A', 'B', 'C', 'D', 'E']
  let letterIndex = 0

  const result = rows.map(row => {
    if (row.type === 'question') {
      letterIndex = 0 // Reset for new question
      return row
    } else if (row.type === 'answer') {
      const letter = letters[letterIndex]
      const newRow = { ...row, label: letter || 'A' }
      letterIndex++
      return newRow
    }
    return row
  })

  return result
}

/**
 * Shuffle sections
 * Keeps question order within each section intact
 * @param rows Parsed rows
 * @returns Shuffled rows
 */
export function shuffleSections(rows: ParsedRow[]): ParsedRow[] {
  const sections = splitIntoSections(rows)

  // Find locked section indexes
  const lockedIndexes: number[] = []
  sections.forEach((section, index) => {
    if (section[0]?.locked) {
      lockedIndexes.push(index)
    }
  })

  // Shuffle sections
  shuffleArray(sections, lockedIndexes)

  // Flatten back to rows
  return sections.flat()
}

/**
 * Shuffle questions within each section
 * Keeps section order and answer order intact
 * @param rows Parsed rows
 * @returns Shuffled rows
 */
export function shuffleQuestions(rows: ParsedRow[]): ParsedRow[] {
  const sectionsByQuestion = splitIntoSectionsAndQuestions(rows)

  // Shuffle questions within each section
  sectionsByQuestion.forEach(section => {
    const lockedIndexes: number[] = []

    section.forEach((questionBlock, index) => {
      // Check if first block is a section header
      if (index === 0 && questionBlock[0]?.type === 'section') {
        lockedIndexes.push(0)
        return
      }

      // Check if question is locked
      if (questionBlock[0]?.locked) {
        lockedIndexes.push(index)
      }
    })

    shuffleArray(section, lockedIndexes)
  })

  // Flatten back to rows
  return sectionsByQuestion.flat(2)
}

/**
 * Shuffle answers within each question
 * Keeps section and question order intact
 * @param rows Parsed rows
 * @returns Shuffled rows with relettered answers
 */
export function shuffleAnswers(rows: ParsedRow[]): ParsedRow[] {
  const sectionsByQuestion = splitIntoSectionsAndQuestions(rows)
  const allQuestions = sectionsByQuestion.flat()

  // Shuffle answers within each question
  allQuestions.forEach(questionBlock => {
    if (questionBlock[0]?.type === 'section') return // Skip section headers

    const questionRow = 0
    const emptyRow = questionBlock.length - 1
    const lockedIndexes = [questionRow, emptyRow]

    // Find locked answers
    questionBlock.forEach((row, index) => {
      if (index !== questionRow && index !== emptyRow && row.locked) {
        lockedIndexes.push(index)
      }
    })

    shuffleArray(questionBlock, lockedIndexes)
  })

  // Flatten and reletter
  const flattened = sectionsByQuestion.flat(2)
  return reletterAnswers(flattened)
}

/**
 * Main shuffle function
 * @param rows Parsed rows
 * @param mode Shuffle mode
 * @returns Shuffled rows
 */
export function shuffle(
  rows: ParsedRow[],
  mode: 'sections' | 'questions' | 'answers'
): ParsedRow[] {
  let result = [...rows]

  switch (mode) {
    case 'sections':
      result = shuffleSections(result)
      break
    case 'questions':
      result = shuffleQuestions(result)
      break
    case 'answers':
      result = shuffleAnswers(result)
      break
  }

  return result
}
