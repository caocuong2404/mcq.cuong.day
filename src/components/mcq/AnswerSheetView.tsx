/**
 * Answer Sheet View - Generate bubble answer sheets
 * 4-column layout with filled circles for correct answers
 */

import React, { useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMcqStore } from '@/store/mcq-store'
import { Copy, Download } from 'lucide-react'
import { toast } from 'sonner'

interface AnswerSheetProps {
  questions: { number: number; correctAnswers: string[] }[]
  maxAnswers?: number
  questionsPerColumn: number
  showColumnHeaders: boolean
}

const AnswerSheetBubbles = React.forwardRef<HTMLDivElement, AnswerSheetProps>(
  ({ questions, maxAnswers = 5, questionsPerColumn, showColumnHeaders }, ref) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, maxAnswers)
    const numColumnPairs = 4 // Fixed: 4 pairs = 8 visual columns

    // Split questions into 4 groups
    const questionGroups: typeof questions[] = []
    for (let i = 0; i < numColumnPairs; i++) {
      const start = i * questionsPerColumn
      const end = start + questionsPerColumn
      questionGroups.push(questions.slice(start, end))
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Header - Visible in UI, NOT captured */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">ANSWER SHEET</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the circle(s) for the correct answer(s)
          </p>
        </div>

        {/* Capture Target - Only the table */}
        <div
          ref={ref}
          id="answer-sheet-grid"
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '1rem',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000',
            }}
          >
            {/* Optional Header Row */}
            {showColumnHeaders && (
              <thead>
                <tr>
                  {Array.from({ length: numColumnPairs }).map((_, i) => (
                    <React.Fragment key={i}>
                      <th
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        Q#
                      </th>
                      <th
                        style={{
                          border: '1px solid #000',
                          padding: '0.5rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        Answers
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
            )}

            <tbody>
              {/* Rows calculated from questionsPerColumn */}
              {Array.from({ length: questionsPerColumn }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {/* 4 column pairs */}
                  {questionGroups.map((group, groupIdx) => {
                    const question = group[rowIdx]
                    if (!question) {
                      return (
                        <React.Fragment key={groupIdx}>
                          <td style={{ border: '1px solid #000' }}></td>
                          <td style={{ border: '1px solid #000' }}></td>
                        </React.Fragment>
                      )
                    }

                    return (
                      <React.Fragment key={groupIdx}>
                        {/* Question number cell - NO DOT */}
                        <td
                          style={{
                            border: '1px solid #000',
                            padding: '0.5rem',
                            textAlign: 'center',
                            fontWeight: 500,
                            color: '#000000',
                          }}
                        >
                          {question.number}
                        </td>

                        {/* Answer bubbles cell */}
                        <td
                          style={{
                            border: '1px solid #000',
                            padding: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.25rem',
                              justifyContent: 'space-evenly',
                            }}
                          >
                            {letters.map(letter => {
                              const isCorrect = question.correctAnswers.includes(letter)
                              return (
                                <svg key={letter} width="20" height="20" viewBox="0 0 24 24">
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    fill={isCorrect ? '#000000' : '#ffffff'}
                                    stroke="#000000"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x="12"
                                    y="16"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill={isCorrect ? '#ffffff' : '#000000'}
                                    style={{ fontFamily: 'sans-serif' }}
                                  >
                                    {letter}
                                  </text>
                                </svg>
                              )
                            })}
                          </div>
                        </td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer - Visible in UI, NOT captured */}
        <div className="border-t pt-4">
          <div className="flex gap-8 text-xs text-muted-foreground">
            <div>Name: _______________________________</div>
            <div>Date: _______________________________</div>
          </div>
        </div>
      </div>
    )
  }
)
AnswerSheetBubbles.displayName = 'AnswerSheetBubbles'

export function AnswerSheetView() {
  const parsedRows = useMcqStore(state => state.parsedRows)
  const examConfig = useMcqStore(state => state.examConfig)
  const setCurrentView = useMcqStore(state => state.setCurrentView)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Extract questions and their correct answers
  const questions: { number: number; correctAnswers: string[] }[] = []
  let currentQuestionNum = examConfig.startNumber
  let currentAnswers: string[] = []
  let maxAnswers = 0
  let currentQuestionAnswerCount = 0

  for (const row of parsedRows) {
    if (row.type === 'question') {
      if (currentAnswers.length > 0 || currentQuestionAnswerCount > 0) {
        questions.push({
          number: currentQuestionNum - 1,
          correctAnswers: currentAnswers,
        })
        maxAnswers = Math.max(maxAnswers, currentQuestionAnswerCount)
        currentAnswers = []
        currentQuestionAnswerCount = 0
      }
      currentQuestionNum++
    } else if (row.type === 'answer') {
      currentQuestionAnswerCount++
      if (row.isKey) {
        currentAnswers.push(row.label)
      }
    }
  }

  // Don't forget last question
  if (currentAnswers.length > 0 || currentQuestionAnswerCount > 0) {
    questions.push({
      number: currentQuestionNum - 1,
      correctAnswers: currentAnswers,
    })
    maxAnswers = Math.max(maxAnswers, currentQuestionAnswerCount)
  }

  // Default to 5 if no answers found (edge case) or cap at reasonable number
  maxAnswers = maxAnswers > 0 ? maxAnswers : 5

  const handleSaveAsImage = useCallback(async () => {
    if (!sheetRef.current) return

    try {
      const { toPng } = await import('html-to-image')

      // Generate blob directly
      const dataUrl = await toPng(sheetRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher quality
        cacheBust: true,
      })

      // Check if running in Tauri
      const isTauri = '__TAURI_INTERNALS__' in window

      if (isTauri) {
        try {
          const { save } = await import('@tauri-apps/plugin-dialog')
          const { writeFile } = await import('@tauri-apps/plugin-fs')

          const path = await save({
            filters: [
              {
                name: 'Image',
                extensions: ['png'],
              },
            ],
            defaultPath: 'answer-sheet.png',
          })

          if (path) {
            // Convert data URL to Uint8Array
            const response = await fetch(dataUrl)
            const blob = await response.blob()
            const buffer = await blob.arrayBuffer()
            await writeFile(path, new Uint8Array(buffer))
            toast.success('Answer sheet saved successfully')
          }
        } catch (error) {
          console.error('Tauri save error:', error)
          toast.error('Failed to save file via Tauri')
        }
      } else {
        // Browser download
        const link = document.createElement('a')
        link.download = 'answer-sheet.png'
        link.href = dataUrl
        link.click()
        toast.success('Answer sheet downloaded')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error('Failed to generate image')
    }
  }, [])

  const handleCopyAsImage = useCallback(async () => {
    if (!sheetRef.current) return

    try {
      const { toBlob } = await import('html-to-image')

      const blob = await toBlob(sheetRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      })

      if (!blob) {
        toast.error('Failed to create image blob')
        return
      }

      try {
        // Try Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ])
        toast.success('Copied to clipboard')
      } catch (error) {
        console.error('Clipboard error:', error)
        toast.error('Failed to copy to clipboard')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error('Failed to generate image')
    }
  }, [])

  if (parsedRows.length === 0 || questions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No exam generated yet</p>
          <Button
            onClick={() => setCurrentView('generate')}
            variant="outline"
            className="mt-4"
          >
            Go to Generate
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Answer Sheet</h2>
          <p className="text-sm text-muted-foreground">
            Generate printable answer sheet with bubble circles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCopyAsImage}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy as Image
          </Button>
          <Button onClick={handleSaveAsImage} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Save as Image
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-auto">
        <CardContent className="p-6">
          <AnswerSheetBubbles
            questions={questions}
            maxAnswers={maxAnswers}
            questionsPerColumn={examConfig.questionsPerColumn}
            showColumnHeaders={examConfig.showColumnHeaders}
            ref={sheetRef}
          />
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <p>
          {questions.length} questions with filled circles for correct answers
        </p>
      </div>
    </div>
  )
}
