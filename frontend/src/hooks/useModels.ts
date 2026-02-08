import { useCallback, useEffect } from 'react'
import { fetchDevice, fetchModels, loadModel } from '../api/models'
import { useAppStore } from '../stores/appStore'
import type { ModelVariant } from '../types'

export function useModels() {
  const { setDevice, setModels, setSelectedVariant, updateModelState } = useAppStore()

  const refresh = useCallback(async () => {
    try {
      const [models, device] = await Promise.all([fetchModels(), fetchDevice()])
      setModels(models)
      setDevice(device)

      // Auto-select the loaded model
      const loaded = models.find((m) => m.status === 'loaded')
      if (loaded) {
        setSelectedVariant(loaded.variant as ModelVariant)
      }
    } catch {
      // Backend not ready yet
    }
  }, [setModels, setDevice, setSelectedVariant])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const selectAndLoad = useCallback(
    async (variant: ModelVariant) => {
      setSelectedVariant(variant)
      updateModelState(variant, { status: 'downloading' })
      try {
        await loadModel(variant)
      } catch {
        // WS will update status
      }
    },
    [setSelectedVariant, updateModelState],
  )

  return { refresh, selectAndLoad }
}
