import type { CapturedPhoto, Diagnosis, PlantProfile, SeasonalPlan, Settings } from '../types'
import { builtinApiKey, builtinQuotaLeft, consumeBuiltin } from './builtinKey'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiError extends Error {}

const STR = { type: 'STRING' }
const STR_ARR = { type: 'ARRAY', items: { type: 'STRING' } }

const plantSchema = {
  type: 'OBJECT',
  properties: {
    identified: { type: 'BOOLEAN', description: 'true if a real plant was identified' },
    commonName: STR,
    scientificName: STR,
    family: STR,
    genus: STR,
    description: { type: 'STRING', description: '2-4 sentence overview of the plant' },
    characteristics: STR_ARR,
    uses: STR_ARR,
    notes: STR_ARR,
    irrigation: {
      type: 'OBJECT',
      properties: { frequency: STR, amount: STR, method: STR, notes: STR },
      required: ['frequency', 'amount', 'method', 'notes'],
    },
    planting: {
      type: 'OBJECT',
      properties: {
        season: STR,
        soil: STR,
        depth: STR,
        spacing: STR,
        sunlight: STR,
        germination: STR,
      },
      required: ['season', 'soil', 'depth', 'spacing', 'sunlight', 'germination'],
    },
    care: {
      type: 'OBJECT',
      properties: {
        sunlight: STR,
        soil: STR,
        temperature: STR,
        humidity: STR,
        fertilizer: STR,
        pruning: STR,
      },
      required: ['sunlight', 'soil', 'temperature', 'humidity', 'fertilizer', 'pruning'],
    },
    nativeRegion: STR,
    growthHabit: STR,
    lifespan: STR,
    bloomSeason: STR,
    toxicity: STR,
    confidence: { type: 'NUMBER', description: '0 to 1' },
    alternatives: { type: 'ARRAY', items: STR, description: 'other possible species if uncertain' },
    relatedPlants: { type: 'ARRAY', items: STR, description: '3-6 related or companion plants' },
  },
  required: [
    'identified', 'commonName', 'scientificName', 'family', 'genus', 'description',
    'characteristics', 'uses', 'notes', 'irrigation', 'planting', 'care',
    'nativeRegion', 'growthHabit', 'lifespan', 'bloomSeason', 'toxicity',
    'confidence', 'alternatives', 'relatedPlants',
  ],
}

const diagnosisSchema = {
  type: 'OBJECT',
  properties: {
    isPlant: { type: 'BOOLEAN' },
    plantName: STR,
    overallHealth: {
      type: 'STRING',
      enum: ['healthy', 'mild', 'moderate', 'severe', 'critical'],
    },
    summary: { type: 'STRING', description: '1-3 sentence overall assessment' },
    issues: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: STR,
          type: {
            type: 'STRING',
            enum: ['pest', 'fungal', 'bacterial', 'viral', 'nutrient', 'environmental', 'physical', 'other'],
          },
          severity: { type: 'STRING', enum: ['low', 'moderate', 'high'] },
          confidence: { type: 'NUMBER' },
          symptoms: STR_ARR,
          description: STR,
        },
        required: ['name', 'type', 'severity', 'confidence', 'symptoms', 'description'],
      },
    },
    treatment: {
      type: 'OBJECT',
      properties: {
        immediate: STR_ARR,
        organic: STR_ARR,
        chemical: STR_ARR,
      },
      required: ['immediate', 'organic', 'chemical'],
    },
    prevention: STR_ARR,
    recoveryPlan: STR,
    urgency: { type: 'STRING', enum: ['low', 'medium', 'high', 'immediate'] },
  },
  required: [
    'isPlant', 'plantName', 'overallHealth', 'summary', 'issues',
    'treatment', 'prevention', 'recoveryPlan', 'urgency',
  ],
}

const seasonalSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '1-2 sentence overview of the gardening month' },
    plantings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: STR,
          type: { type: 'STRING', enum: ['vegetable', 'herb', 'fruit', 'flower', 'tree', 'other'] },
          action: { type: 'STRING', enum: ['sow', 'plant', 'harvest', 'maintain', 'prune'] },
          note: STR,
        },
        required: ['name', 'type', 'action', 'note'],
      },
    },
    tasks: STR_ARR,
  },
  required: ['summary', 'plantings', 'tasks'],
}

const okSchema = {
  type: 'OBJECT',
  properties: { ok: { type: 'BOOLEAN' } },
  required: ['ok'],
}

async function generate<T>(settings: Settings, parts: unknown[], schema: object): Promise<T> {
  let apiKey = settings.apiKey.trim()
  let builtin = false
  if (!apiKey) {
    if (builtinQuotaLeft() > 0) {
      apiKey = builtinApiKey()
      builtin = true
    } else {
      throw new GeminiError(
        'Free trial uses are over for today — add your own free Gemini API key in Settings.',
      )
    }
  }
  const model = settings.model.trim().replace(/^models\//, '') || 'gemini-3.8-flash'

  let res: Response
  try {
    res = await fetch(
      `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.3,
          },
        }),
      },
    )
  } catch {
    throw new GeminiError('Network error — could not reach the Gemini API.')
  }

  if (!res.ok) {
    let msg = `Gemini request failed (HTTP ${res.status})`
    try {
      const err = await res.json()
      if (err?.error?.message) msg = err.error.message
    } catch {
      /* keep default */
    }
    if (res.status === 429) msg += ' — you may have hit the free-tier rate limit; wait a moment and retry.'
    throw new GeminiError(msg)
  }

  // count the trial use only once the request actually succeeded
  if (builtin) consumeBuiltin()

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts
    ?.find((p: { text?: string }) => typeof p.text === 'string')?.text
  if (!text) throw new GeminiError('The model returned an empty response.')
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError('Could not parse the model response.')
  }
}

function imagePart(photo: CapturedPhoto) {
  return { inline_data: { mime_type: photo.mimeType, data: photo.base64 } }
}

export async function identifyPlant(settings: Settings, photo: CapturedPhoto): Promise<PlantProfile> {
  const prompt = [
    'You are an expert botanist and horticulturist. Identify the plant in this photo and return a complete botanical profile.',
    'Fill every field with practical, specific information a gardener can act on (e.g. irrigation frequency like "deeply once a week", planting depth in cm/inches).',
    'If the image does not clearly show a plant, set identified=false and explain why in description; still fill other fields with best-effort or empty values.',
    'If you are not fully certain of the species, put the most likely match in the main fields and list alternatives.',
    `Write all human-readable text in ${settings.language || 'English'}. Keep scientific names in Latin.`,
  ].join(' ')
  return generate<PlantProfile>(settings, [{ text: prompt }, imagePart(photo)], plantSchema)
}

export async function diagnosePlant(settings: Settings, photo: CapturedPhoto): Promise<Diagnosis> {
  const prompt = [
    'You are a plant pathologist. Examine this photo for signs of disease, pests, nutrient deficiencies, or environmental/physical damage.',
    'List each distinct problem you can see evidence for as a separate issue, with the visible symptoms that support it.',
    'Give a concrete treatment plan: immediate actions, organic/low-toxicity options, and chemical options naming example active ingredients.',
    'If the plant looks healthy, set overallHealth="healthy" and return an empty issues array.',
    'If the image does not show a plant, set isPlant=false and explain in summary.',
    `Write all human-readable text in ${settings.language || 'English'}.`,
  ].join(' ')
  return generate<Diagnosis>(settings, [{ text: prompt }, imagePart(photo)], diagnosisSchema)
}

export async function searchPlant(settings: Settings, query: string): Promise<PlantProfile> {
  const prompt = [
    `You are a botanical encyclopedia. Provide a complete botanical and horticultural profile for the plant "${query}".`,
    'Accept common names, scientific names, transliterations, and names in any language or script. Tolerate misspellings.',
    'If the name is ambiguous, use the most common garden/houseplant match and put the other candidates in alternatives.',
    'Set identified=true whenever any reasonable plant match exists. Only set identified=false if nothing plant-like matches at all — and still put your best guesses in alternatives.',
    'Fill every field with practical, specific information a gardener can act on.',
    `Write all human-readable text in ${settings.language || 'English'}. Keep scientific names in Latin.`,
  ].join(' ')
  return generate<PlantProfile>(settings, [{ text: prompt }], plantSchema)
}

const suggestSchema = {
  type: 'OBJECT',
  properties: {
    suggestions: { type: 'ARRAY', items: STR, description: 'up to 6 plant names' },
  },
  required: ['suggestions'],
}

export async function suggestPlants(settings: Settings, query: string): Promise<string[]> {
  const prompt = [
    `A user searched for the plant "${query}" but no exact match was found.`,
    'List up to 6 real plants that are the closest or most likely intended matches — fix spelling, transliteration, or language issues.',
    `Output only plant names in ${settings.language || 'English'}.`,
  ].join(' ')
  const r = await generate<{ suggestions: string[] }>(settings, [{ text: prompt }], suggestSchema)
  return r.suggestions ?? []
}

export async function seasonalPlan(
  settings: Settings,
  opts: { lat: number; lon: number; label: string; month: string; weather?: string },
): Promise<SeasonalPlan> {
  const hemisphere = opts.lat >= 0 ? 'northern' : 'southern'
  const prompt = [
    'You are an expert agronomist and gardening advisor.',
    `Location: ${opts.label} (lat ${opts.lat.toFixed(2)}, lon ${opts.lon.toFixed(2)}, ${hemisphere} hemisphere).`,
    `Month: ${opts.month}.${opts.weather ? ` Current weather: ${opts.weather}.` : ''}`,
    'List 6-12 plants a home gardener should sow, plant out, harvest or maintain THIS month in this climate, matched to the season.',
    'Also list 3-6 general garden tasks appropriate for the month and weather.',
    'Keep notes short and practical.',
    `Write all human-readable text in ${settings.language || 'English'}.`,
  ].join(' ')
  return generate<SeasonalPlan>(settings, [{ text: prompt }], seasonalSchema)
}

export async function testConnection(settings: Settings): Promise<boolean> {
  const res = await generate<{ ok: boolean }>(
    settings,
    [{ text: 'Reply with {"ok": true}.' }],
    okSchema,
  )
  return res.ok === true
}
