import { useNavigate } from 'react-router-dom'
import FloatingHelp from './FloatingHelp'
import type { HelpHowTo } from './FloatingHelp'

const HELP_HOWTOS: HelpHowTo[] = [
  { title: 'Identify a plant', body: 'Open Identify, take or upload a photo of the plant, and the app recognizes it with AI. You need a Gemini API key in Settings for AI features.' },
  { title: 'Diagnose a sick plant', body: 'Open Health, photograph the affected leaves and the app analyzes the disease and suggests treatment.' },
  { title: 'Plant knowledge', body: 'Open Knowledge to browse plant care information — watering, light and soil preferences.' },
  { title: 'Watering calendar', body: 'Open Calendar to track watering schedules for your plants.' },
  { title: 'API key setup', body: 'Open Settings and paste your Gemini API key — it is stored only in your browser. Get a free key from Google AI Studio.' },
]

export default function HelpWidget() {
  const navigate = useNavigate()
  return (
    <FloatingHelp
      color="#2e7d32"
      functions={[
        { label: 'Home', description: 'Your plants overview', action: () => navigate('/') },
        { label: 'Identify a plant', description: 'Recognize a plant from a photo with AI', action: () => navigate('/identify') },
        { label: 'Plant health', description: 'Diagnose diseases from leaf photos', action: () => navigate('/health') },
        { label: 'Knowledge', description: 'Browse plant care information', action: () => navigate('/knowledge') },
        { label: 'Calendar', description: 'Track watering schedules', action: () => navigate('/calendar') },
        { label: 'Settings', description: 'API key and app preferences', action: () => navigate('/settings') },
      ]}
      howtos={HELP_HOWTOS}
    />
  )
}
