/**
 * Import View - MCQ question import screen
 * Allows pasting/importing questions and answer keys with format settings
 */

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMcqStore } from '@/store/mcq-store'
import { parseMcq, parseAnswerKey, applyAnswerKey } from '@/services/parser'
import { validateParsedMcq } from '@/services/validator'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'

export function ImportView() {
  const formatSettings = useMcqStore(state => state.formatSettings)
  const setFormatSettings = useMcqStore(state => state.setFormatSettings)
  
  // Use store state instead of local state for persistence
  const input = useMcqStore(state => state.importInput)
  const setInput = useMcqStore(state => state.setImportInput)
  const answerKeyInput = useMcqStore(state => state.importAnswerKeyInput)
  const setAnswerKeyInput = useMcqStore(state => state.setImportAnswerKeyInput)
  const parsedRows = useMcqStore(state => state.parsedRows)
  const setParsedRows = useMcqStore(state => state.setParsedRows)
  const setCurrentView = useMcqStore(state => state.setCurrentView)

  const [showSettings, setShowSettings] = useState(false)

  // Derived validation state
  const validationResult = useMemo(() => validateParsedMcq(parsedRows), [parsedRows])

  // Handle parse questions
  const handleParse = useCallback(() => {
    if (!input.trim()) {
      toast.error('Please enter some questions to parse')
      return
    }

    try {
      const parsed = parseMcq(input, formatSettings)
      const validation = validateParsedMcq(parsed)

      setParsedRows(validation.validatedRows)

      if (validation.isValid) {
        toast.success(
          `Parsed ${parsed.filter(r => r.type === 'question').length} questions`
        )
      } else {
        toast.warning('Parsed with errors - please review the table')
      }
    } catch (error) {
      toast.error(
        `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }, [input, formatSettings, setParsedRows])

  // Handle parse answer key
  const handleParseAnswerKey = useCallback(() => {
    if (!answerKeyInput.trim()) {
      toast.error('Please enter an answer key')
      return
    }

    if (parsedRows.length === 0) {
      toast.error('Please parse questions first')
      return
    }

    try {
      const answerKeyMap = parseAnswerKey(answerKeyInput)
      const updatedRows = applyAnswerKey([...parsedRows], answerKeyMap)

      setParsedRows(updatedRows)
      toast.success(`Applied answer key for ${answerKeyMap.size} questions`)
    } catch (error) {
      toast.error(
        `Answer key parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }, [answerKeyInput, parsedRows, setParsedRows])

  // Handle accept and move to generate
  const handleAccept = useCallback(() => {
    if (parsedRows.length === 0) {
      toast.error('Please parse questions first')
      return
    }

    if (!validationResult?.isValid) {
      toast.error('Please fix errors before continuing')
      return
    }

    setCurrentView('generate')
    toast.success('Questions imported successfully')
  }, [parsedRows, validationResult, setCurrentView])

  // Toggle answer key checkbox
  const handleToggleKey = useCallback((rowId: number) => {
    const updatedRows = parsedRows.map(row =>
      row.id === rowId ? { ...row, isKey: !row.isKey } : row
    )
    setParsedRows(updatedRows)
  }, [parsedRows, setParsedRows])

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Questions</h2>
          <p className="text-sm text-muted-foreground">
            Paste your MCQ questions and configure parsing settings
          </p>
        </div>
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="icon"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Format Settings */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle>Format Settings</CardTitle>
              <CardDescription>
                Configure how questions and answers are formatted in your input
                text
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Prefix</Label>
                  <Input
                    value={formatSettings.questionPrefix[0]}
                    onChange={e =>
                      setFormatSettings({
                        questionPrefix: [e.target.value, ''],
                      })
                    }
                    placeholder="e.g., ( or empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question Postfix</Label>
                  <Input
                    value={formatSettings.questionPostfix[0]}
                    onChange={e =>
                      setFormatSettings({
                        questionPostfix: [e.target.value, '). '],
                      })
                    }
                    placeholder="e.g., ) or ). "
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer Prefix</Label>
                  <Input
                    value={formatSettings.answerPrefix[0]}
                    onChange={e =>
                      setFormatSettings({ answerPrefix: [e.target.value, ''] })
                    }
                    placeholder="e.g., ( or empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer Postfix</Label>
                  <Input
                    value={formatSettings.answerPostfix[0]}
                    onChange={e =>
                      setFormatSettings({
                        answerPostfix: [e.target.value, '). '],
                      })
                    }
                    placeholder="e.g., ) or ). "
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        {/* Left Panel: Input */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle>1. Paste Questions</CardTitle>
            <CardDescription>
              Format example: 1. Question text? A. Answer 1 B. Answer 2 C.
              Answer 3 D. Answer 4
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 min-h-0">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste your MCQ questions here..."
              className="flex-1 resize-none font-mono text-sm"
            />
            <div className="pt-2">
              <Button onClick={handleParse} className="w-full shrink-0">
                Parse Questions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Parsed Results */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle>2. Review Parsed Questions</CardTitle>
            <CardDescription>
              {validationResult?.isValid
                ? `${parsedRows.filter(r => r.type === 'question').length} questions parsed successfully`
                : validationResult
                  ? 'Errors found - please review'
                  : 'Not yet parsed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex-1 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Label</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead className="w-12">Key</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map(row => (
                    <TableRow
                      key={row.id}
                      className={
                        row.type === 'error' ? 'bg-destructive/10' : ''
                      }
                    >
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="max-w-md text-sm">
                        {row.text}
                      </TableCell>
                      <TableCell>
                        {row.type === 'answer' && (
                          <Checkbox
                            checked={row.isKey}
                            onCheckedChange={() => handleToggleKey(row.id)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Answer Key Input */}
            <div className="space-y-2">
              <Label>Or Paste Answer Key</Label>
              <div className="flex gap-2">
                <Textarea
                  value={answerKeyInput}
                  onChange={e => setAnswerKeyInput(e.target.value)}
                  placeholder="1. B&#10;2. A&#10;3. C, D"
                  className="resize-none font-mono text-sm"
                  rows={3}
                />
                <Button onClick={handleParseAnswerKey} variant="outline">
                  Apply Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Alert */}
      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            Validation errors found. Please check the highlighted rows in the
            table.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleAccept} disabled={!validationResult?.isValid}>
          Accept & Continue to Generator
        </Button>
      </div>
    </div>
  )
}
