/**
 * MCQ Container - Main container for MCQ application
 * Handles view switching between Import, Generate, Answer Sheet, and Settings
 */

import { useMcqStore } from '@/store/mcq-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportView } from './ImportView'
import { GenerateView } from './GenerateView'
import { AnswerSheetView } from './AnswerSheetView'
import { SettingsView } from './SettingsView'
import { FileInput, Shuffle, FileCheck, Settings } from 'lucide-react'

export function McqContainer() {
  const currentView = useMcqStore(state => state.currentView)
  const setCurrentView = useMcqStore(state => state.setCurrentView)

  return (
    <div className="flex h-full w-full flex-col">
      <Tabs
        value={currentView}
        onValueChange={value => setCurrentView(value as typeof currentView)}
        className="flex h-full flex-col"
      >
        <TabsList className="mx-6 mt-6 grid w-auto grid-cols-4">
          <TabsTrigger value="import" className="gap-2">
            <FileInput className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Shuffle className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="answer-sheet" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Answer Sheet
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="flex-1 overflow-hidden">
          <ImportView />
        </TabsContent>

        <TabsContent value="generate" className="flex-1 overflow-hidden">
          <GenerateView />
        </TabsContent>

        <TabsContent value="answer-sheet" className="flex-1 overflow-hidden">
          <AnswerSheetView />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-hidden">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
