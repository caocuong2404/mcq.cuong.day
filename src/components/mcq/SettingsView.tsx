/**
 * Settings View - Configure default format preferences
 */

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useMcqStore } from '@/store/mcq-store'
import { toast } from 'sonner'

export function SettingsView() {
  const formatSettings = useMcqStore(state => state.formatSettings)
  const setFormatSettings = useMcqStore(state => state.setFormatSettings)
  const examConfig = useMcqStore(state => state.examConfig)
  const setExamConfig = useMcqStore(state => state.setExamConfig)

  const handleReset = () => {
    setFormatSettings({
      questionPrefix: ['(', ''],
      questionPostfix: [')', '). '],
      answerPrefix: ['(', ''],
      answerPostfix: [')', '). '],
      answerLowercase: false,
    })
    setExamConfig({
      shuffleSections: false,
      shuffleQuestions: false,
      shuffleAnswers: false,
      startNumber: 1,
      format: formatSettings,
    })
    toast.success('Settings reset to defaults')
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure default format preferences
          </p>
        </div>
        <Button onClick={handleReset} variant="outline">
          Reset to Defaults
        </Button>
      </div>

      <div className="grid gap-6 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Question Format</CardTitle>
            <CardDescription>
              Configure how question numbers are formatted
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
                      questionPrefix: [
                        e.target.value,
                        formatSettings.questionPrefix[1] || '',
                      ],
                    })
                  }
                  placeholder="e.g., ( or empty"
                />
                <p className="text-xs text-muted-foreground">
                  Example: &quot;(&quot; for (1) or empty for 1)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Question Postfix</Label>
                <Input
                  value={formatSettings.questionPostfix[0]}
                  onChange={e =>
                    setFormatSettings({
                      questionPostfix: [
                        e.target.value,
                        formatSettings.questionPostfix[1] || '). ',
                      ],
                    })
                  }
                  placeholder="e.g., ) or ). "
                />
                <p className="text-xs text-muted-foreground">
                  Example: &quot;)&quot; for (1) or &quot;). &quot; for 1).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Answer Format</CardTitle>
            <CardDescription>
              Configure how answer letters are formatted
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Answer Prefix</Label>
                <Input
                  value={formatSettings.answerPrefix[0]}
                  onChange={e =>
                    setFormatSettings({
                      answerPrefix: [
                        e.target.value,
                        formatSettings.answerPrefix[1] || '',
                      ],
                    })
                  }
                  placeholder="e.g., ( or empty"
                />
                <p className="text-xs text-muted-foreground">
                  Example: &quot;(&quot; for (A) or empty for A)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Answer Postfix</Label>
                <Input
                  value={formatSettings.answerPostfix[0]}
                  onChange={e =>
                    setFormatSettings({
                      answerPostfix: [
                        e.target.value,
                        formatSettings.answerPostfix[1] || '). ',
                      ],
                    })
                  }
                  placeholder="e.g., ) or ). "
                />
                <p className="text-xs text-muted-foreground">
                  Example: &quot;)&quot; for (A) or &quot;). &quot; for A).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Use Lowercase Letters</Label>
                <p className="text-sm text-muted-foreground">
                  Display answer letters as a, b, c instead of A, B, C
                </p>
              </div>
              <Switch
                checked={formatSettings.answerLowercase}
                onCheckedChange={checked =>
                  setFormatSettings({ answerLowercase: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Exam Settings</CardTitle>
            <CardDescription>
              Configure default shuffle and numbering options
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Default Start Number</Label>
              <Input
                type="number"
                min={1}
                value={examConfig.startNumber}
                onChange={e =>
                  setExamConfig({ startNumber: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Question numbering will start from this number by default
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Shuffle Sections by Default</Label>
                <Switch
                  checked={examConfig.shuffleSections}
                  onCheckedChange={checked =>
                    setExamConfig({ shuffleSections: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Shuffle Questions by Default</Label>
                <Switch
                  checked={examConfig.shuffleQuestions}
                  onCheckedChange={checked =>
                    setExamConfig({ shuffleQuestions: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Shuffle Answers by Default</Label>
                <Switch
                  checked={examConfig.shuffleAnswers}
                  onCheckedChange={checked =>
                    setExamConfig({ shuffleAnswers: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Answer Sheet Layout</CardTitle>
            <CardDescription>
              Configure the answer sheet table layout
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Questions Per Column</Label>
              <Input
                type="number"
                min={1}
                value={examConfig.questionsPerColumn}
                onChange={e =>
                  setExamConfig({ questionsPerColumn: parseInt(e.target.value) || 5 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of questions displayed in each column of the answer sheet (8-column layout)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Column Headers</Label>
                <p className="text-sm text-muted-foreground">
                  Display &quot;Q#&quot; and &quot;Answers&quot; headers in the answer sheet table
                </p>
              </div>
              <Switch
                checked={examConfig.showColumnHeaders}
                onCheckedChange={checked =>
                  setExamConfig({ showColumnHeaders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About MCQ Shuffle</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium">Tauri + React</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">License</span>
              <span className="text-sm font-medium">MIT</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
