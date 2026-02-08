import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { ModelSelector } from './components/tts/ModelSelector'
import { LanguageSelector } from './components/tts/LanguageSelector'
import { TextInput } from './components/tts/TextInput'
import { VoiceUpload } from './components/tts/VoiceUpload'
import { ParameterPanel } from './components/tts/ParameterPanel'
import { GenerateButton } from './components/tts/GenerateButton'
import { GenerationStatus } from './components/tts/GenerationStatus'
import { AudioPlayer } from './components/audio/AudioPlayer'
import { HistoryPanel } from './components/history/HistoryPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { useModels } from './hooks/useModels'
import { useHistory } from './hooks/useHistory'
import { useAppStore } from './stores/appStore'

type Tab = 'generate' | 'history'

export default function App() {
  useWebSocket()
  useModels()
  useHistory()

  const [activeTab, setActiveTab] = useState<Tab>('generate')
  const historyTotal = useAppStore((s) => s.historyTotal)

  return (
    <AppShell>
      <Header />

      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Tabs */}
          <nav className="flex gap-6 mb-8 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('generate')}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === 'generate' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              History
              {historyTotal > 0 && (
                <span className="ml-1.5 text-xs text-stone-400 font-mono">{historyTotal}</span>
              )}
            </button>
          </nav>

          {activeTab === 'generate' ? (
            <div className="space-y-5">
              <div className="card p-5 space-y-5">
                <ModelSelector />
                <LanguageSelector />
                <TextInput />
                <VoiceUpload />
                <ParameterPanel />
                <GenerateButton />
                <GenerationStatus />
              </div>

              <AudioPlayer />
            </div>
          ) : (
            <HistoryPanel />
          )}
        </div>
      </div>

      <Footer />
    </AppShell>
  )
}
