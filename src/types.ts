export interface Settings {
  apiKey: string
  model: string
  language: string
}

export interface IrrigationInfo {
  frequency: string
  amount: string
  method: string
  notes: string
}

export interface PlantingInfo {
  season: string
  soil: string
  depth: string
  spacing: string
  sunlight: string
  germination: string
}

export interface CareInfo {
  sunlight: string
  soil: string
  temperature: string
  humidity: string
  fertilizer: string
  pruning: string
}

export interface PlantProfile {
  identified: boolean
  commonName: string
  scientificName: string
  family: string
  genus: string
  description: string
  characteristics: string[]
  uses: string[]
  notes: string[]
  irrigation: IrrigationInfo
  planting: PlantingInfo
  care: CareInfo
  nativeRegion: string
  growthHabit: string
  lifespan: string
  bloomSeason: string
  toxicity: string
  confidence: number
  alternatives: string[]
  relatedPlants: string[]
}

export interface PlantIssue {
  name: string
  type: string
  severity: string
  confidence: number
  symptoms: string[]
  description: string
}

export interface Diagnosis {
  isPlant: boolean
  plantName: string
  overallHealth: string
  summary: string
  issues: PlantIssue[]
  treatment: {
    immediate: string[]
    organic: string[]
    chemical: string[]
  }
  prevention: string[]
  recoveryPlan: string
  urgency: string
}

export interface CapturedPhoto {
  base64: string
  mimeType: string
  dataUrl: string
  thumbnail: string
}

export interface HistoryItem {
  id: string
  kind: 'identify' | 'diagnose' | 'search'
  title: string
  thumbnail?: string
  timestamp: number
  payload: PlantProfile | Diagnosis
}

export interface StoredLocation {
  lat: number
  lon: number
  label: string
}

export interface WeatherNow {
  temperature: number
  windspeed: number
  code: number
  isDay: boolean
}

export type TaskKind =
  | 'water' | 'fertilize' | 'prune' | 'repot' | 'spray' | 'harvest' | 'sow' | 'other'

export interface GardenPlant {
  id: string
  name: string
  species?: string
  thumbnail?: string
  notes?: string
  waterEveryDays?: number
  createdAt: number
}

export interface GardenTask {
  id: string
  plantId?: string
  kind: TaskKind
  title: string
  everyDays?: number
  nextDue: string // ISO yyyy-mm-dd
  lastDone?: string
  done?: boolean
  note?: string
}

export interface PlantingSuggestion {
  name: string
  type: string
  action: string
  note: string
}

export interface SeasonalPlan {
  plantings: PlantingSuggestion[]
  tasks: string[]
  summary: string
}
