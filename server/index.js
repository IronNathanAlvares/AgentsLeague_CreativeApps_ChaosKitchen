import express from 'express'
import { z } from 'zod'

const app = express()
const port = Number(process.env.SERVER_PORT || 8787)

app.use(express.json({ limit: '1mb' }))

const dishCardSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(1),
  mood: z.string().trim().min(1),
  dishName: z.string().trim().min(1),
  recipeConcept: z.string().trim().min(1),
  flavorProfile: z.array(z.string().trim().min(1)).min(1),
  lore: z.string().trim().min(1),
  platingPrompt: z.string().trim().min(1),
  challengeMode: z.string().trim().min(1),
})

const requestSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(1).max(8),
  mood: z.string().trim().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Chaos']),
  chefPersonality: z.enum(['Classical Chef', 'Street Food Vendor', 'Fusion Master']),
})

const difficultyPromptMap = {
  Easy: 'Keep flavors straightforward, beginner-friendly, and easy to execute with simple techniques.',
  Medium: 'Use complex fusion ideas with layered flavors while staying practical for home cooks.',
  Chaos: 'Push wild, experimental, and bold culinary combinations with dramatic creative flair.',
}

const chefPromptMap = {
  'Classical Chef': 'Adopt an elegant, refined, traditional chef voice with polished plating concepts.',
  'Street Food Vendor': 'Adopt a bold, spicy, energetic street-food voice with punchy and casual style.',
  'Fusion Master': 'Adopt an inventive fusion voice focused on unexpected pairings and playful innovation.',
}

function toStringList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
}

function normalizeGeneratedCard(payload, fallbackIngredients, fallbackMood) {
  const fallback = {
    ingredients: fallbackIngredients,
    mood: fallbackMood,
    dishName: 'Chaos Kitchen Special',
    recipeConcept: 'Mix your selected ingredients with contrasting textures and finish with a bright garnish.',
    flavorProfile: ['savory', 'tangy', 'spicy'],
    lore: 'A house special made in the busiest hour of the chaos kitchen.',
    platingPrompt: 'Serve with bold color contrast and one dramatic garnish.',
    challengeMode: 'Use one pan and finish in under 15 minutes.',
  }

  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const candidate = payload
  return {
    ingredients: toStringList(candidate.ingredients).length > 0 ? toStringList(candidate.ingredients) : fallback.ingredients,
    mood: typeof candidate.mood === 'string' && candidate.mood.trim() ? candidate.mood.trim() : fallback.mood,
    dishName: typeof candidate.dishName === 'string' && candidate.dishName.trim() ? candidate.dishName.trim() : fallback.dishName,
    recipeConcept:
      typeof candidate.recipeConcept === 'string' && candidate.recipeConcept.trim()
        ? candidate.recipeConcept.trim()
        : fallback.recipeConcept,
    flavorProfile: toStringList(candidate.flavorProfile).length > 0 ? toStringList(candidate.flavorProfile) : fallback.flavorProfile,
    lore: typeof candidate.lore === 'string' && candidate.lore.trim() ? candidate.lore.trim() : fallback.lore,
    platingPrompt:
      typeof candidate.platingPrompt === 'string' && candidate.platingPrompt.trim()
        ? candidate.platingPrompt.trim()
        : fallback.platingPrompt,
    challengeMode:
      typeof candidate.challengeMode === 'string' && candidate.challengeMode.trim()
        ? candidate.challengeMode.trim()
        : fallback.challengeMode,
  }
}

function parseGeneratedCardContent(content, fallbackIngredients, fallbackMood) {
  const parsedJson = JSON.parse(content)
  const parsed = dishCardSchema.safeParse(parsedJson)

  if (parsed.success) {
    return parsed.data
  }

  return normalizeGeneratedCard(parsedJson, fallbackIngredients, fallbackMood)
}

async function callModelForDishCard({
  baseUrl,
  headers,
  model,
  ingredients,
  mood,
  difficulty,
  chefPersonality,
  repair,
}) {
  const difficultyPrompt = difficultyPromptMap[difficulty] || difficultyPromptMap.Medium
  const chefPrompt = chefPromptMap[chefPersonality] || chefPromptMap['Fusion Master']
  const messages = [
    {
      role: 'system',
      content:
        `You generate safe, playful culinary ideas. Return JSON only with keys: ingredients, mood, dishName, recipeConcept, flavorProfile, lore, platingPrompt, challengeMode. Keep outputs concise and non-harmful. Difficulty rule: ${difficultyPrompt} Chef personality rule: ${chefPrompt}`,
    },
    {
      role: 'user',
      content: JSON.stringify({ ingredients, mood, difficulty, chefPersonality }),
    },
  ]

  if (repair) {
    messages.push({
      role: 'user',
      content:
        'Your previous response was invalid. Return only valid JSON with all required keys and string values where expected.',
    })
  }

  const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  if (!upstreamResponse.ok) {
    const upstreamText = await upstreamResponse.text()
    throw new Error(`Model request failed: ${upstreamResponse.status} ${upstreamText}`)
  }

  const upstreamData = await upstreamResponse.json()
  const content = upstreamData?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('Model returned an unexpected response shape.')
  }

  return content
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/generate', async (req, res) => {
  const inputCandidate = {
    ingredients: toStringList(req.body?.ingredients).slice(0, 8),
    mood: typeof req.body?.mood === 'string' && req.body.mood.trim() ? req.body.mood.trim() : 'Street Food',
    difficulty: req.body?.difficulty,
    chefPersonality: req.body?.chefPersonality,
  }
  const parsedInput = requestSchema.safeParse(inputCandidate)
  if (!parsedInput.success) {
    return res.status(400).json({ error: 'Invalid request payload.' })
  }

  const { ingredients, mood, difficulty, chefPersonality } = parsedInput.data

  const baseUrl = (process.env.MODEL_API_BASE_URL || 'http://localhost:11434/v1').replace(/\/$/, '')
  const model = process.env.MODEL_NAME || 'mistral'
  const apiKey = process.env.MODEL_API_KEY
  const authHeader = process.env.MODEL_AUTH_HEADER || 'Authorization'
  const authScheme = process.env.MODEL_AUTH_SCHEME || 'Bearer'

  try {
    const headers = {
      'Content-Type': 'application/json',
    }

    const authValue = authScheme ? `${authScheme} ${apiKey}` : apiKey
    if (apiKey) {
      headers[authHeader] = authValue
    }

    let content
    try {
      content = await callModelForDishCard({
        baseUrl,
        headers,
        model,
        ingredients,
        mood,
        difficulty,
        chefPersonality,
        repair: false,
      })
      parseGeneratedCardContent(content, ingredients, mood)
    } catch {
      content = await callModelForDishCard({
        baseUrl,
        headers,
        model,
        ingredients,
        mood,
        difficulty,
        chefPersonality,
        repair: true,
      })
    }

    const dishCard = parseGeneratedCardContent(content, ingredients, mood)
    return res.json({ dishCard, model })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return res.status(500).json({ error: message })
  }
})

app.listen(port, () => {
  console.log(`Chaos Kitchen API server listening on http://localhost:${port}`)
})
