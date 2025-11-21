import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type { AppPreferences } from '@/types/preferences'
import { isTauri } from '@/lib/tauri'

// Query keys for preferences
export const preferencesQueryKeys = {
  all: ['preferences'] as const,
  preferences: () => [...preferencesQueryKeys.all] as const,
}

// TanStack Query hooks following the architectural patterns
export function usePreferences() {
  return useQuery({
    queryKey: preferencesQueryKeys.preferences(),
    queryFn: async (): Promise<AppPreferences> => {
      try {
        logger.debug('Loading preferences from backend')
        
        if (isTauri()) {
          const preferences = await invoke<AppPreferences>('load_preferences')
          logger.info('Preferences loaded successfully', { preferences })
          return preferences
        } else {
          // Web fallback
          const item = localStorage.getItem('preferences')
          if (!item) throw new Error('No preferences found')
          const preferences = JSON.parse(item) as AppPreferences
          logger.info('Preferences loaded from localStorage', { preferences })
          return preferences
        }
      } catch (error) {
        // Return defaults if preferences file doesn't exist yet
        logger.warn('Failed to load preferences, using defaults', { error })
        return { theme: 'system' }
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      try {
        logger.debug('Saving preferences to backend', { preferences })
        
        if (isTauri()) {
          await invoke('save_preferences', { preferences })
        } else {
          // Web fallback
          localStorage.setItem('preferences', JSON.stringify(preferences))
        }
        
        logger.info('Preferences saved successfully')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred'
        logger.error('Failed to save preferences', { error, preferences })
        toast.error('Failed to save preferences', { description: message })
        throw error
      }
    },
    onSuccess: (_, preferences) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(preferencesQueryKeys.preferences(), preferences)
      logger.info('Preferences cache updated')
      toast.success('Preferences saved')
    },
  })
}
