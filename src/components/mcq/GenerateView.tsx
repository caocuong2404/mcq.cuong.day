/**
 * Generate View - Exam generation screen with shuffle settings
 */

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMcqStore } from '@/store/mcq-store'
import { shuffle } from '@/services/shuffle'
import { generateExamOutput, generateAnswerKey } from '@/services/generator'
import { Shuffle as ShuffleIcon, Copy, FileDown } from 'lucide-react'
import { toast } from 'sonner'

export function GenerateView() {
  const parsedRows = useMcqStore(state => state.parsedRows)
  const examConfig = useMcqStore(state => state.examConfig)

  const [shuffledRows, setShuffledRows] = useState(parsedRows)
  const [previewOutput, setPreviewOutput] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewKey, setPreviewKey] = useState<string[]>([])

  // Update preview when rows or config changes
  useEffect(() => {
    if (shuffledRows.length > 0) {
      const output = generateExamOutput(shuffledRows, examConfig)
      const html = generateExamHtml(shuffledRows, examConfig)
      const key = generateAnswerKey(shuffledRows, examConfig.startNumber)
      setPreviewOutput(output)
      setPreviewHtml(html)
      setPreviewKey(key)
    }
  }, [shuffledRows, examConfig])

  // Initialize with parsed rows
  useEffect(() => {
    setShuffledRows(parsedRows)
  }, [parsedRows])

  const handleShuffleSections = useCallback(() => {
    const result = shuffle(shuffledRows, 'sections')
    setShuffledRows(result)
    toast.success('Sections shuffled')
  }, [shuffledRows])

  const handleShuffleQuestions = useCallback(() => {
    const result = shuffle(shuffledRows, 'questions')
    setShuffledRows(result)
    toast.success('Questions shuffled')
  }, [shuffledRows])

  const handleShuffleAnswers = useCallback(() => {
    const result = shuffle(shuffledRows, 'answers')
    setShuffledRows(result)
    toast.success('Answers shuffled')
  }, [shuffledRows])

  const handleCopyExam = useCallback(async () => {
    try {
      const htmlOutput = generateExamHtml(shuffledRows, examConfig)
      const textOutput = previewOutput

      const textBlob = new Blob([textOutput], { type: 'text/plain' })
      const htmlBlob = new Blob([htmlOutput], { type: 'text/html' })

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        }),
      ])
      toast.success('Exam copied to clipboard with formatting')
    } catch (err) {
      console.error(err)
      toast.error('Failed to copy to clipboard')
    }
  }, [previewOutput, shuffledRows, examConfig])

  const handleCopyAnswerKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewKey.join('\n'))
      toast.success('Answer key copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [previewKey])

  const handleGenerateAnswerSheet = useCallback(() => {
    const { setExamOutput, setAnswerKey, setCurrentView } =
      useMcqStore.getState()
    setExamOutput(previewOutput)
    setAnswerKey(previewKey)
    setCurrentView('answer-sheet')
    toast.success('Ready to generate answer sheet')
  }, [previewOutput, previewKey])

  if (parsedRows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No questions imported yet</p>
          <Button
            onClick={() => useMcqStore.getState().setCurrentView('import')}
            variant="outline"
            className="mt-4"
          >
            Go to Import
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generate Exam</h2>
          <p className="text-sm text-muted-foreground">
            Configure shuffle settings and preview your exam
          </p>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Left Panel: Shuffle Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Shuffle Options</CardTitle>
            <CardDescription>
              Configure how to shuffle your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Shuffle Sections</Label>
                <p className="text-xs text-muted-foreground">
                  Randomize section order
                </p>
              </div>
              <Button
                onClick={handleShuffleSections}
                variant="outline"
                className="w-full gap-2"
              >
                <ShuffleIcon className="h-4 w-4" />
                Shuffle Sections
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Shuffle Questions</Label>
                <p className="text-xs text-muted-foreground">
                  Randomize question order within sections
                </p>
              </div>
              <Button
                onClick={handleShuffleQuestions}
                variant="outline"
                className="w-full gap-2"
              >
                <ShuffleIcon className="h-4 w-4" />
                Shuffle Questions
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Shuffle Answers</Label>
                <p className="text-xs text-muted-foreground">
                  Randomize answer order (auto-reletter)
                </p>
              </div>
              <Button
                onClick={handleShuffleAnswers}
                variant="outline"
                className="w-full gap-2"
              >
                <ShuffleIcon className="h-4 w-4" />
                Shuffle Answers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Middle Panel: Exam Preview */}
        <Card className="col-span-2 flex flex-col h-full overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exam Preview</CardTitle>
                <CardDescription>Preview your generated exam</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyExam}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Exam
                </Button>
                <Button
                  onClick={handleGenerateAnswerSheet}
                  size="sm"
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Answer Sheet
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
            <ScrollArea className="flex-1 rounded-md border p-4 overflow-y-auto">
              <div
                className="font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </ScrollArea>

            {previewKey.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer Key</Label>
                  <Button
                    onClick={handleCopyAnswerKey}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-mono text-sm">{previewKey.join('   ')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function generateExamHtml(rows: any[], config: any): string {
  let output = ''
  let currentQuestionNum = config.startNumber

  for (const row of rows) {
    if (row.type === 'section') {
      output += `<b>${row.text}</b><br><br>`
    } else if (row.type === 'question') {
      const prefix = config.format.questionPrefix[0] ?? ''
      const postfix = config.format.questionPostfix[0] ?? ') '
      output += `<b>${prefix}${currentQuestionNum}${postfix}${row.text}</b><br>`
      currentQuestionNum++
    } else if (row.type === 'answer') {
      const letter = config.format.answerLowercase
        ? row.label.toLowerCase()
        : row.label
      const prefix = config.format.answerPrefix[0] ?? ''
      const postfix = config.format.answerPostfix[0] ?? ') '
      // Use non-breaking spaces for indentation
      output += `&nbsp;&nbsp;&nbsp;${prefix}${letter}${postfix}${row.text}<br>`
    } else if (row.type === 'empty') {
      output += '<br>'
    }
  }

  return output
}
