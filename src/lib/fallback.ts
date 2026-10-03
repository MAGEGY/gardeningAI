/**
 * Fallback AI providers for when Gemini is unavailable.
 *
 * 1. Pollinations (https://text.pollinations.ai/openai) — free, keyless,
 *    OpenAI-compatible text + vision endpoint.
 * 2. Wikipedia REST API — keyless article summaries for knowledge searches.
 */

import type { Diagnosis, PlantProfile, SeasonalPlan, Settings } from '../types'

const POLL_URL = 'https://text.pollinations.ai/openai'

const WIKI_LANG: Record<string, string> = {
  English: 'en', Arabic: 'ar', French: 'fr', Spanish: 'es', German: 'de',
  Italian: 'it', Portuguese: 'pt', Russian: 'ru', Turkish: 'tr', Hindi: 'hi',
}

const WIKI_NOTE: Record<string, string> = {
  English: 'Summary from Wikipedia — the AI service was busy. Try again soon for full care details.',
  Arabic: 'ملخص من ويكيبيديا — كانت خدمة الذكاء الاصطناعي مشغولة. حاول قريبًا للحصول على تفاصيل الرعاية الكاملة.',
  French: 'Résumé de Wikipédia — le service IA était occupé. Réessayez bientôt pour tous les détails d’entretien.',
  Spanish: 'Resumen de Wikipedia — el servicio de IA estaba ocupado. Vuelve pronto para todos los detalles de cuidado.',
  German: 'Zusammenfassung von Wikipedia — der KI-Dienst war ausgelastet. Versuche es bald erneut für alle Pflegedetails.',
  Italian: 'Riepilogo da Wikipedia — il servizio IA era occupato. Riprova presto per tutti i dettagli di cura.',
  Portuguese: 'Resumo da Wikipédia — o serviço de IA estava ocupado. Tente novamente em breve para todos os detalhes de cuidado.',
  Russian: 'Краткое описание из Википедии — сервис ИИ был занят. Скоро попробуйте снова для полных деталей ухода.',
  Turkish: 'Wikipedia özeti — yapay zeka servisi meşguldu. Tüm bakım ayrıntıları için yakında tekrar deneyin.',
  Hindi: 'विकिपीडिया से सारांश — AI सेवा व्यस्त थी। पूरी देखभाल जानकारी के लिए जल्द फिर से प्रयास करें।',
}

const PLANT_SHAPE =
  '{"identified": boolean, "commonName": string, "scientificName": string, "family": string, "genus": string, "description": string, "characteristics": string[], "uses": string[], "notes": string[], "irrigation": {"frequency": string, "amount": string, "method": string, "notes": string}, "planting": {"season": string, "soil": string, "depth": string, "spacing": string, "sunlight": string, "germination": string}, "care": {"sunlight": string, "soil": string, "temperature": string, "humidity": string, "fertilizer": string, "pruning": string}, "nativeRegion": string, "growthHabit": string, "lifespan": string, "bloomSeason": string, "toxicity": string, "confidence": number, "alternatives": string[], "relatedPlants": string[]}'

const DIAG_SHAPE =
  '{"isPlant": boolean, "plantName": string, "overallHealth": "healthy"|"mild"|"moderate"|"severe"|"critical", "summary": string, "issues": [{"name": string, "type": "pest"|"fungal"|"bacterial"|"viral"|"nutrient"|"environmental"|"physical"|"other", "severity": "low"|"moderate"|"high", "confidence": number, "symptoms": string[], "description": string}], "treatment": {"immediate": string[], "organic": string[], "chemical": string[]}, "prevention": string[], "recoveryPlan": string, "urgency": "low"|"medium"|"high"|"immediate"}'

const SEASON_SHAPE =
  '{"summary": string, "plantings": [{"name": string, "type": "vegetable"|"herb"|"fruit"|"flower"|"tree"|"other", "action": "sow"|"plant"|"harvest"|"maintain"|"prune", "note": string}], "tasks": string[]}'

export const SHAPES = { plant: PLANT_SHAPE, diag: DIAG_SHAPE, season: SEASON_SHAPE }

/** One chat turn against the free keyless Pollinations endpoint. */
export async function pollinationsChat(content: unknown[]): Promise<string> {
  const res = await fetch(POLL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [{ role: 'user', content }],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(45_000),
  })
  if (!res.ok) throw new Error(`Fallback AI failed (HTTP ${res.status})`)
  const raw = await res.text()
  try {
    const data = JSON.parse(raw)
    const text = data?.choices?.[0]?.message?.content
    if (typeof text === 'string' && text.trim()) return text
    throw new Error('Fallback AI returned an empty response.')
  } catch {
    if (raw.trim()) return raw
    throw new Error('Fallback AI returned an empty response.')
  }
}

/** Extract a JSON object from a model reply that may wrap it in prose or code fences. */
export function parseJSONLoose(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function strObj(v: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = str(val)
  }
  return out
}

export function normalizePlant(raw: unknown): PlantProfile {
  const r = (raw ?? {}) as Record<string, unknown>
  const irr = strObj(r.irrigation)
  const pl = strObj(r.planting)
  const care = strObj(r.care)
  return {
    identified: r.identified !== false,
    commonName: str(r.commonName),
    scientificName: str(r.scientificName),
    family: str(r.family),
    genus: str(r.genus),
    description: str(r.description),
    characteristics: arr(r.characteristics),
    uses: arr(r.uses),
    notes: arr(r.notes),
    irrigation: { frequency: irr.frequency ?? '', amount: irr.amount ?? '', method: irr.method ?? '', notes: irr.notes ?? '' },
    planting: { season: pl.season ?? '', soil: pl.soil ?? '', depth: pl.depth ?? '', spacing: pl.spacing ?? '', sunlight: pl.sunlight ?? '', germination: pl.germination ?? '' },
    care: { sunlight: care.sunlight ?? '', soil: care.soil ?? '', temperature: care.temperature ?? '', humidity: care.humidity ?? '', fertilizer: care.fertilizer ?? '', pruning: care.pruning ?? '' },
    nativeRegion: str(r.nativeRegion),
    growthHabit: str(r.growthHabit),
    lifespan: str(r.lifespan),
    bloomSeason: str(r.bloomSeason),
    toxicity: str(r.toxicity),
    confidence: typeof r.confidence === 'number' ? r.confidence : 0,
    alternatives: arr(r.alternatives),
    relatedPlants: arr(r.relatedPlants),
  }
}

export function normalizeDiagnosis(raw: unknown): Diagnosis {
  const r = (raw ?? {}) as Record<string, unknown>
  const tr = strObj(r.treatment)
  const issues = Array.isArray(r.issues) ? r.issues : []
  return {
    isPlant: r.isPlant !== false,
    plantName: str(r.plantName),
    overallHealth: str(r.overallHealth) || 'moderate',
    summary: str(r.summary),
    issues: issues.map((i) => {
      const issue = (i ?? {}) as Record<string, unknown>
      return {
        name: str(issue.name),
        type: str(issue.type) || 'other',
        severity: str(issue.severity) || 'moderate',
        confidence: typeof issue.confidence === 'number' ? issue.confidence : 0,
        symptoms: arr(issue.symptoms),
        description: str(issue.description),
      }
    }),
    treatment: { immediate: arr(tr.immediate), organic: arr(tr.organic), chemical: arr(tr.chemical) },
    prevention: arr(r.prevention),
    recoveryPlan: str(r.recoveryPlan),
    urgency: str(r.urgency) || 'medium',
  }
}

export function normalizeSeasonal(raw: unknown): SeasonalPlan {
  const r = (raw ?? {}) as Record<string, unknown>
  const plantings = Array.isArray(r.plantings) ? r.plantings : []
  return {
    summary: str(r.summary),
    plantings: plantings.map((p) => {
      const item = (p ?? {}) as Record<string, unknown>
      return {
        name: str(item.name),
        type: str(item.type) || 'other',
        action: str(item.action) || 'maintain',
        note: str(item.note),
      }
    }),
    tasks: arr(r.tasks),
  }
}

/** Wikipedia article summary mapped into a PlantProfile (best-effort fallback). */
export async function wikiPlantProfile(settings: Settings, query: string): Promise<PlantProfile> {
  const lang = WIKI_LANG[settings.language] || 'en'
  const sres = await fetch(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`,
    { signal: AbortSignal.timeout(15_000) },
  )
  if (!sres.ok) throw new Error(`Wikipedia search failed (HTTP ${sres.status})`)
  const hits = (await sres.json())?.query?.search ?? []
  if (!hits.length) throw new Error('No Wikipedia article matched this search.')

  let summary: { title?: string; extract?: string } | null = null
  for (const hit of hits) {
    const rres = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`,
      { signal: AbortSignal.timeout(15_000) },
    )
    if (!rres.ok) continue
    const data = await rres.json()
    if (!/may refer to|توضيح/i.test(data?.extract || '')) {
      summary = data
      break
    }
  }
  if (!summary?.extract) throw new Error('No Wikipedia article matched this search.')

  return {
    identified: true,
    commonName: summary.title || query,
    scientificName: '',
    family: '',
    genus: '',
    description: summary.extract,
    characteristics: [],
    uses: [],
    notes: [WIKI_NOTE[settings.language] || WIKI_NOTE.English],
    irrigation: { frequency: '', amount: '', method: '', notes: '' },
    planting: { season: '', soil: '', depth: '', spacing: '', sunlight: '', germination: '' },
    care: { sunlight: '', soil: '', temperature: '', humidity: '', fertilizer: '', pruning: '' },
    nativeRegion: '',
    growthHabit: '',
    lifespan: '',
    bloomSeason: '',
    toxicity: '',
    confidence: 0,
    alternatives: [],
    relatedPlants: [],
  }
}
