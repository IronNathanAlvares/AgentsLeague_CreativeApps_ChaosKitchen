import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { ChopChallengeGame, FlameControlGame, MemoryMatchGame, AccuracyShooterGame } from './games.tsx'
import asianFusionThemeImage from '../gif_images/asian fusion theme.gif'
import chaoticMysteryThemeImage from '../images/Chaotic Mystery Theme.png'
import dessertThemeImage from '../images/dessert theme.png'
import retroClassicThemeImage from '../images/Retro Classic Theme.png'
import spicyHotThemeImage from '../images/spicy hot theme.png'
import streetFoodThemeImage from '../images/street food theme.png'
import vegetarianGardenThemeImage from '../images/vegetarian garden theme.png'

type DishCard = {
  id: string
  ingredients: string[]
  mood: string
  dishName: string
  recipeConcept: string
  flavorProfile: string[]
  lore: string
  platingPrompt: string
  challengeMode: string
  modelUsed?: string
  rating?: number
  timestamp?: number
}

type Difficulty = 'Easy' | 'Medium' | 'Chaos'
type ChefPersonality = 'Classical Chef' | 'Street Food Vendor' | 'Fusion Master'

type PlayerStats = {
  totalDishesCreated: number
  themeUsage: Record<string, number>
}

type MiniGameType = 'chop-challenge' | 'flame-control' | 'memory-match' | 'accuracy-shooter'
type GameHighScores = {
  chopChallenge: number
  flameControl: number
  memoryMatch: number
  accuracyShooter: number
}

const dishCardSchema = z.object({
  id: z.string().min(1),
  ingredients: z.array(z.string().min(1)),
  mood: z.string().min(1),
  dishName: z.string().min(1),
  recipeConcept: z.string().min(1),
  flavorProfile: z.array(z.string().min(1)),
  lore: z.string().min(1),
  platingPrompt: z.string().min(1),
  challengeMode: z.string().min(1),
})

const apiDishCardSchema = dishCardSchema.omit({ id: true })
const savedCardsSchema = z.array(dishCardSchema)

type IngredientItem = { name: string; unlocked: boolean }
type ThemeItem = { name: string; unlocked: boolean }

const allIngredients: IngredientItem[] = [
  { name: 'Mango', unlocked: true },
  { name: 'Kimchi', unlocked: true },
  { name: 'Black Garlic', unlocked: true },
  { name: 'Coconut Milk', unlocked: true },
  { name: 'Tofu', unlocked: true },
  { name: 'Rice Noodles', unlocked: true },
  { name: 'Corn', unlocked: true },
  { name: 'Saffron', unlocked: false },
  { name: 'Truffle Oil', unlocked: false },
  { name: 'Dragon Fruit', unlocked: false },
  { name: 'Edible Gold', unlocked: false },
  { name: 'Wasabi', unlocked: false },
  { name: 'Liquid Smoke', unlocked: false },
  { name: 'Miso Paste', unlocked: false },
  { name: 'Pomegranate', unlocked: false },
]

const themes: ThemeItem[] = [
  { name: 'Street Food Theme', unlocked: true },
  { name: 'Asian Fusion Theme', unlocked: true },
  { name: 'Dessert Theme', unlocked: true },
  { name: 'Spicy Hot Theme', unlocked: true },
  { name: 'Vegetarian Garden Theme', unlocked: true },
  { name: 'Retro Classic Theme', unlocked: true },
  { name: 'Chaotic Mystery Theme', unlocked: true },
  { name: 'Neon Cyberpunk Theme', unlocked: false },
  { name: 'Enchanted Forest Theme', unlocked: false },
  { name: 'Underwater Abyss Theme', unlocked: false },
  { name: 'Steampunk Kitchen Theme', unlocked: false },
  { name: 'Lunar Alchemy Theme', unlocked: false },
]

const ingredientPricing: Record<string, number> = {
  'Saffron': 200,
  'Truffle Oil': 250,
  'Dragon Fruit': 150,
  'Edible Gold': 300,
  'Wasabi': 120,
  'Liquid Smoke': 180,
  'Miso Paste': 140,
  'Pomegranate': 160,
}

const themePricing: Record<string, number> = {
  'Neon Cyberpunk Theme': 500,
  'Enchanted Forest Theme': 450,
  'Underwater Abyss Theme': 600,
  'Steampunk Kitchen Theme': 550,
  'Lunar Alchemy Theme': 500,
}
const themeImageMap: Record<string, string> = {
  'Street Food Theme': streetFoodThemeImage,
  'Asian Fusion Theme': asianFusionThemeImage,
  'Dessert Theme': dessertThemeImage,
  'Spicy Hot Theme': spicyHotThemeImage,
  'Vegetarian Garden Theme': vegetarianGardenThemeImage,
  'Retro Classic Theme': retroClassicThemeImage,
  'Chaotic Mystery Theme': chaoticMysteryThemeImage,
  'Neon Cyberpunk Theme': chaoticMysteryThemeImage,
  'Enchanted Forest Theme': chaoticMysteryThemeImage,
  'Underwater Abyss Theme': chaoticMysteryThemeImage,
  'Steampunk Kitchen Theme': chaoticMysteryThemeImage,
  'Lunar Alchemy Theme': chaoticMysteryThemeImage,
}
const themeAnimationClassMap: Record<string, string> = {
  'Street Food Theme': 'theme-anim-street',
  'Asian Fusion Theme': 'theme-anim-asian',
  'Dessert Theme': 'theme-anim-dessert',
  'Spicy Hot Theme': 'theme-anim-spicy',
  'Vegetarian Garden Theme': 'theme-anim-garden',
  'Retro Classic Theme': 'theme-anim-retro',
  'Chaotic Mystery Theme': 'theme-anim-chaos',
  'Neon Cyberpunk Theme': 'theme-anim-chaos',
  'Enchanted Forest Theme': 'theme-anim-chaos',
  'Underwater Abyss Theme': 'theme-anim-chaos',
  'Steampunk Kitchen Theme': 'theme-anim-chaos',
  'Lunar Alchemy Theme': 'theme-anim-chaos',
}
const dishPrefixes = ['Meteor', 'Thunder', 'Lunar', 'Chaos', 'Neon', 'Dragonfire']
const dishStyles = ['Stew', 'Skillet', 'Wrap', 'Bowl', 'Taco', 'Noodle Stack']
const flavorPool = ['sweet', 'umami', 'tangy', 'creamy', 'spicy', 'smoky', 'citrusy', 'savory']
const loreOpeners = [
  'Legend says this dish first appeared when the market lights flickered at midnight.',
  'A wandering chef created this recipe to settle a friendly cooking duel.',
  'This combination became famous after winning the annual chaos cook-off.',
]
const challengePool = [
  'Cook in under 15 minutes without using oil.',
  'Use only one pan and finish with a crunchy topping.',
  'Make it street-food portable with no utensils required.',
  'Keep total prep under 10 minutes and plate with only three colors.',
]
const savedCardsStorageKey = 'chaos-kitchen-saved-cards'
const darkModeStorageKey = 'chaos-kitchen-dark-mode'
const soundEnabledStorageKey = 'chaos-kitchen-sound-enabled'
const playerStatsStorageKey = 'chaos-kitchen-player-stats'
const pointsStorageKey = 'chaos-kitchen-points'
const gameHighScoresStorageKey = 'chaos-kitchen-high-scores'
const unlockedItemsStorageKey = 'chaos-kitchen-unlocked-items'

// const lockedIngredients = allIngredients.filter((i) => !i.unlocked).map((i) => i.name)
// const lockedThemes = themes.filter((t) => !t.unlocked).map((t) => t.name)

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function pickMany(items: string[], count: number): string[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function remixIngredientList(baseIngredients: string[]): string[] {
  const unlockedIngredients = allIngredients.filter((i) => i.unlocked).map((i) => i.name)
  const seed = baseIngredients.length > 0 ? baseIngredients : pickMany(unlockedIngredients, 3)
  const remixed = [...seed]
  const candidates = unlockedIngredients.filter((ingredient) => !remixed.includes(ingredient))

  if (candidates.length === 0) {
    return remixed
  }

  const replaceIndex = Math.floor(Math.random() * remixed.length)
  remixed[replaceIndex] = pickRandom(candidates)
  return remixed
}

function generateMockDishCard(ingredients: string[], mood: string, difficulty: Difficulty, chefPersonality: ChefPersonality): DishCard {
  const unlockedIngredients = allIngredients.filter((i) => i.unlocked).map((i) => i.name)
  const safeIngredients = ingredients.length > 0 ? ingredients : pickMany(unlockedIngredients, 3)
  const leadIngredient = safeIngredients[0]
  const dishName = `${leadIngredient} ${pickRandom(dishPrefixes)} ${pickRandom(dishStyles)}`
  const selectedFlavors = pickMany(flavorPool, 5)
  const difficultyLine =
    difficulty === 'Easy'
      ? 'Keep techniques simple and flavors clear.'
      : difficulty === 'Medium'
        ? 'Layer flavors with balanced fusion complexity.'
        : 'Go bold with surprising, experimental flavor twists.'

  const personalityLine =
    chefPersonality === 'Classical Chef'
      ? 'Presented with elegant, timeless culinary style.'
      : chefPersonality === 'Street Food Vendor'
        ? 'Presented with bold, punchy street-food energy.'
        : 'Presented with imaginative fusion storytelling.'

  return {
    id: crypto.randomUUID(),
    ingredients: safeIngredients,
    mood,
    dishName,
    recipeConcept: `${difficultyLine} Build a ${mood.toLowerCase()}-style base with ${safeIngredients.join(', ')}, then finish with a bold texture contrast and a bright final garnish.`,
    flavorProfile: selectedFlavors,
    lore: `${pickRandom(loreOpeners)} ${personalityLine} In ${mood.toLowerCase()} circles, cooks call it "${dishName}".`,
    platingPrompt:
      'Serve in a dramatic shallow bowl with layered textures, high contrast garnish, and cinematic side lighting for a playful food-magazine look.',
    challengeMode: pickRandom(challengePool),
  }
}

function toDishCard(payload: unknown): DishCard | null {
  const parsed = apiDishCardSchema.safeParse(payload)
  if (!parsed.success) {
    return null
  }

  const value = parsed.data
  return {
    id: crypto.randomUUID(),
    ingredients: value.ingredients,
    mood: value.mood,
    dishName: value.dishName,
    recipeConcept: value.recipeConcept,
    flavorProfile: value.flavorProfile,
    lore: value.lore,
    platingPrompt: value.platingPrompt,
    challengeMode: value.challengeMode,
  }
}

async function generateDishCardFromApiWithSettings(
  ingredients: string[],
  mood: string,
  difficulty: Difficulty,
  chefPersonality: ChefPersonality,
): Promise<DishCard> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ingredients, mood, difficulty, chefPersonality }),
  })

  if (!response.ok) {
    let detail = ''

    try {
      const errorData = (await response.json()) as { error?: string }
      if (typeof errorData.error === 'string' && errorData.error.trim()) {
        detail = `: ${errorData.error}`
      }
    } catch {
      detail = ''
    }

    throw new Error(`API request failed with status ${response.status}${detail}`)
  }

  const data = (await response.json()) as { dishCard?: unknown; model?: string }
  const parsedCard = toDishCard(data.dishCard)
  if (!parsedCard) {
    throw new Error('API response was missing a valid dish card.')
  }

  return { ...parsedCard, modelUsed: data.model }
}

function playChimeSound() {
  const audioContext = new AudioContext()
  const gain = audioContext.createGain()
  gain.connect(audioContext.destination)
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.7)

  const first = audioContext.createOscillator()
  first.type = 'sine'
  first.frequency.setValueAtTime(783.99, audioContext.currentTime)
  first.connect(gain)
  first.start()
  first.stop(audioContext.currentTime + 0.3)

  const second = audioContext.createOscillator()
  second.type = 'triangle'
  second.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.2)
  second.connect(gain)
  second.start(audioContext.currentTime + 0.2)
  second.stop(audioContext.currentTime + 0.7)
}

function playWhooshSound() {
  const audioContext = new AudioContext()
  const gain = audioContext.createGain()
  gain.connect(audioContext.destination)
  gain.gain.setValueAtTime(0.12, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35)

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.35, audioContext.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1
  }

  const noise = audioContext.createBufferSource()
  noise.buffer = noiseBuffer

  const filter = audioContext.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1200, audioContext.currentTime)
  filter.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.35)

  noise.connect(filter)
  filter.connect(gain)
  noise.start()
  noise.stop(audioContext.currentTime + 0.35)
}

function playSuccessChime() {
  const audioContext = new AudioContext()
  const gain = audioContext.createGain()
  gain.connect(audioContext.destination)
  gain.gain.setValueAtTime(0.15, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.4)

  const osc = audioContext.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1174.66, audioContext.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1568.0, audioContext.currentTime + 0.1)
  osc.connect(gain)
  osc.start()
  osc.stop(audioContext.currentTime + 0.4)
}

// function playKnifeSound() {
//   const audioContext = new AudioContext()
//   const gain = audioContext.createGain()
//   gain.connect(audioContext.destination)
//   gain.gain.setValueAtTime(0.1, audioContext.currentTime)
//   gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
//
//   const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate)
//   const data = noiseBuffer.getChannelData(0)
//   for (let i = 0; i < data.length; i += 1) {
//     data[i] = Math.random() * 2 - 1
//   }
//
//   const noise = audioContext.createBufferSource()
//   noise.buffer = noiseBuffer
//   noise.connect(gain)
//   noise.start()
// }

// function playSizzleSound() {
//   const audioContext = new AudioContext()
//   const gain = audioContext.createGain()
//   gain.connect(audioContext.destination)
//   gain.gain.setValueAtTime(0.08, audioContext.currentTime)
//   gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3)
//
//   const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate)
//   const data = noiseBuffer.getChannelData(0)
//   for (let i = 0; i < data.length; i += 1) {
//     data[i] = Math.random() * 2 - 1
//   }
//
//   const noise = audioContext.createBufferSource()
//   noise.buffer = noiseBuffer
//
//   const filter = audioContext.createBiquadFilter()
//   filter.type = 'highpass'
//   filter.frequency.setValueAtTime(2000, audioContext.currentTime)
//
//   noise.connect(filter)
//   filter.connect(gain)
//   noise.start()
// }

function App() {
  const [screen, setScreen] = useState<'menu' | 'help' | 'credits' | 'game'>('menu')
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Mango', 'Kimchi', 'Tofu'])
  const [selectedTheme, setSelectedTheme] = useState<string>(themes[0].name)
  const [dishCard, setDishCard] = useState<DishCard | null>(null)
  const [savedCards, setSavedCards] = useState<DishCard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSource, setGenerationSource] = useState<'api' | 'mock' | null>(null)
  const [generationAction, setGenerationAction] = useState<'cook' | 'remix' | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [editingCard, setEditingCard] = useState<DishCard | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [chefPersonality, setChefPersonality] = useState<ChefPersonality>('Fusion Master')
  const [recipeHistory, setRecipeHistory] = useState<DishCard[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'stats'>('saved')
  const [darkMode, setDarkMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ totalDishesCreated: 0, themeUsage: {} })
  const [showIngredientsDropdown, setShowIngredientsDropdown] = useState(false)
  const [playerPoints, setPlayerPoints] = useState(0)
  const [gameHighScores, setGameHighScores] = useState<GameHighScores>({ chopChallenge: 0, flameControl: 0, memoryMatch: 0, accuracyShooter: 0 })
  const [currentGame, setCurrentGame] = useState<MiniGameType | null>(null)
  const [showGameSelectionModal, setShowGameSelectionModal] = useState(false)
  const [unlockedIngredientSet, setUnlockedIngredientSet] = useState<Set<string>>(new Set())
  const [unlockedThemeSet, setUnlockedThemeSet] = useState<Set<string>>(new Set())
  const [showShopModal, setShowShopModal] = useState(false)
  const activeThemeImage = themeImageMap[selectedTheme] ?? streetFoodThemeImage
  const activeThemeAnimationClass = themeAnimationClassMap[selectedTheme] ?? 'theme-anim-street'

  const refreshApiStatus = useCallback(async () => {
    setApiStatus('checking')

    try {
      const response = await fetch('/api/health')
      setApiStatus(response.ok ? 'online' : 'offline')
    } catch {
      setApiStatus('offline')
    }
  }, [])

  const trackGenerationStats = (theme: string) => {
    setPlayerStats((current) => ({
      totalDishesCreated: current.totalDishesCreated + 1,
      themeUsage: {
        ...current.themeUsage,
        [theme]: (current.themeUsage[theme] || 0) + 1,
      },
    }))
  }

  const runGeneration = async (ingredients: string[], mood: string, action: 'cook' | 'remix') => {
    setGenerationAction(action)
    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      const apiCard = await generateDishCardFromApiWithSettings(ingredients, mood, difficulty, chefPersonality)
      setDishCard(apiCard)
      addToHistory(apiCard)
      trackGenerationStats(apiCard.mood)
      setGenerationSource('api')
      setGenerationStatus('AI API generation complete.')
      if (soundEnabled) {
        playChimeSound()
      }
    } catch (error) {
      const fallbackCard = generateMockDishCard(ingredients, mood, difficulty, chefPersonality)
      setDishCard({ ...fallbackCard, modelUsed: 'Mock Fallback' })
      addToHistory(fallbackCard)
      trackGenerationStats(fallbackCard.mood)
      setGenerationSource('mock')
      const reason = error instanceof Error ? error.message : 'Unknown API error'
      setGenerationStatus(`AI API unavailable (${reason}). Generated with local mock fallback.`)
      if (soundEnabled) {
        playChimeSound()
      }
    } finally {
      setIsGenerating(false)
      setGenerationAction(null)
    }
  }

  const handleCookChaos = async () => {
    await runGeneration(selectedIngredients, selectedTheme, 'cook')
  }

  const handleRemix = async () => {
    if (!dishCard) {
      return
    }

    if (soundEnabled) {
      playWhooshSound()
    }

    const remixedIngredients = remixIngredientList(dishCard.ingredients)
    setSelectedIngredients(remixedIngredients)
    setSelectedTheme(dishCard.mood)
    await runGeneration(remixedIngredients, dishCard.mood, 'remix')
  }

  const handleSaveRecipe = (card?: DishCard) => {
    const cardToSave = card || dishCard
    if (!cardToSave) {
      return
    }

    setSavedCards((current) => {
      if (current.some((c) => c.id === cardToSave.id)) {
        return current
      }

      return [cardToSave, ...current]
    })
  }

  const handleViewRecipe = (card: DishCard) => {
    setDishCard(card)
    setGenerationSource(null)
    setGenerationStatus(null)
  }

  const handleDeleteRecipe = (cardId: string) => {
    setSavedCards((current) => current.filter((card) => card.id !== cardId))
  }

  const handleSaveEditedRecipe = (updatedCard: DishCard) => {
    setSavedCards((current) =>
      current.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    )
    setEditingCard(null)
  }

  const handleRandomIngredients = () => {
    const unlockedIngredients = allIngredients.filter((i) => i.unlocked).map((i) => i.name)
    const randomCount = Math.floor(Math.random() * 3) + 3
    const shuffled = [...unlockedIngredients].sort(() => Math.random() - 0.5)
    setSelectedIngredients(shuffled.slice(0, randomCount))
  }

  const handleExportPdf = () => {
    if (!dishCard) return

    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) {
      alert('Please allow popups to export PDF.')
      return
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>${dishCard.dishName} - Chaos Kitchen</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
            h1 { margin-bottom: 4px; color: #c2410c; }
            h2 { margin-top: 24px; color: #9a3412; }
            .meta { color: #475569; margin-bottom: 18px; }
            .block { padding: 12px; border: 1px solid #fed7aa; border-radius: 10px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${dishCard.dishName}</h1>
          <p class="meta">Theme: ${dishCard.mood} · Difficulty: ${difficulty} · Chef: ${chefPersonality}</p>
          <div class="block"><strong>Ingredients:</strong> ${dishCard.ingredients.join(', ')}</div>
          <div class="block"><strong>Flavor Profile:</strong> ${dishCard.flavorProfile.join(', ')}</div>
          <h2>Recipe Concept</h2>
          <p>${dishCard.recipeConcept}</p>
          <h2>Lore</h2>
          <p>${dishCard.lore}</p>
          <h2>Plating Prompt</h2>
          <p>${dishCard.platingPrompt}</p>
          <h2>Challenge Mode</h2>
          <p>${dishCard.challengeMode}</p>
          <p class="meta">Generated by: ${dishCard.modelUsed || 'unknown'}</p>
        </body>
      </html>
    `

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const handleShareRecipe = () => {
    if (!dishCard) return

    const shareText = `Check out my Chaos Kitchen creation: ${dishCard.dishName}! 🍲✨`
    if (navigator.share) {
      navigator.share({
        title: 'Chaos Kitchen Recipe',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share text copied! 🎉')
      })
    }
  }

  const handleRateRecipe = (cardId: string, rating: number) => {
    setRatings((current) => ({ ...current, [cardId]: rating }))
  }

  const addToHistory = (card: DishCard) => {
    setRecipeHistory((current) => [{ ...card, timestamp: Date.now() }, ...current.slice(0, 9)])
  }

  const awardGamePoints = (pointsEarned: number) => {
    setPlayerPoints((current) => current + pointsEarned)
    if (soundEnabled) {
      playSuccessChime()
    }
  }

  const purchaseItem = (itemName: string, itemType: 'ingredient' | 'theme') => {
    const price = itemType === 'ingredient' ? ingredientPricing[itemName] : themePricing[itemName]
    
    if (!price) return
    if (playerPoints < price) return
    
    const isAlreadyUnlocked = itemType === 'ingredient' 
      ? unlockedIngredientSet.has(itemName)
      : unlockedThemeSet.has(itemName)
    
    if (isAlreadyUnlocked) return
    
    // Deduct points
    setPlayerPoints(playerPoints - price)
    
    // Unlock item
    if (itemType === 'ingredient') {
      const newSet = new Set(unlockedIngredientSet)
      newSet.add(itemName)
      setUnlockedIngredientSet(newSet)
    } else {
      const newSet = new Set(unlockedThemeSet)
      newSet.add(itemName)
      setUnlockedThemeSet(newSet)
    }
  }

  const selectRandomGame = () => {
    const games: MiniGameType[] = ['chop-challenge', 'flame-control', 'memory-match', 'accuracy-shooter']
    const randomGame = games[Math.floor(Math.random() * games.length)]
    setCurrentGame(randomGame)
    setShowGameSelectionModal(false)
  }

  const selectGameManually = (game: MiniGameType) => {
    setCurrentGame(game)
    setShowGameSelectionModal(false)
  }

  // Shop Modal Component (rendered below if showShopModal is true)

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(savedCardsStorageKey)

      if (!storedValue) {
        return
      }

      const parsedValue = JSON.parse(storedValue) as DishCard[]
      const validatedSavedCards = savedCardsSchema.safeParse(parsedValue)
      if (validatedSavedCards.success) {
        setSavedCards(validatedSavedCards.data)
      }
    } catch {
      setSavedCards([])
    }

    try {
      const historyValue = localStorage.getItem('chaos-kitchen-history')
      const ratingsValue = localStorage.getItem('chaos-kitchen-ratings')
      const darkModeValue = localStorage.getItem(darkModeStorageKey)
      const soundEnabledValue = localStorage.getItem(soundEnabledStorageKey)
      const statsValue = localStorage.getItem(playerStatsStorageKey)
      if (historyValue) {
        setRecipeHistory(JSON.parse(historyValue))
      }
      if (ratingsValue) {
        setRatings(JSON.parse(ratingsValue))
      }
      if (darkModeValue) {
        setDarkMode(JSON.parse(darkModeValue) === true)
      }
      if (soundEnabledValue) {
        setSoundEnabled(JSON.parse(soundEnabledValue) !== false)
      }
      if (statsValue) {
        setPlayerStats(JSON.parse(statsValue))
      }
      const pointsValue = localStorage.getItem(pointsStorageKey)
      const highScoresValue = localStorage.getItem(gameHighScoresStorageKey)
      const unlockedValue = localStorage.getItem(unlockedItemsStorageKey)
      if (pointsValue) {
        setPlayerPoints(parseInt(pointsValue, 10))
      }
      if (highScoresValue) {
        setGameHighScores(JSON.parse(highScoresValue))
      }
      if (unlockedValue) {
        const parsed = JSON.parse(unlockedValue)
        setUnlockedIngredientSet(new Set(parsed.ingredients || []))
        setUnlockedThemeSet(new Set(parsed.themes || []))
      }
    } catch {
      // Silently fail on history/ratings load
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(savedCardsStorageKey, JSON.stringify(savedCards))
  }, [savedCards])

  useEffect(() => {
    localStorage.setItem('chaos-kitchen-history', JSON.stringify(recipeHistory))
  }, [recipeHistory])

  useEffect(() => {
    localStorage.setItem('chaos-kitchen-ratings', JSON.stringify(ratings))
  }, [ratings])

  useEffect(() => {
    localStorage.setItem(darkModeStorageKey, JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(soundEnabledStorageKey, JSON.stringify(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem(playerStatsStorageKey, JSON.stringify(playerStats))
  }, [playerStats])

  useEffect(() => {
    localStorage.setItem(pointsStorageKey, playerPoints.toString())
  }, [playerPoints])

  useEffect(() => {
    localStorage.setItem(gameHighScoresStorageKey, JSON.stringify(gameHighScores))
  }, [gameHighScores])

  useEffect(() => {
    localStorage.setItem(unlockedItemsStorageKey, JSON.stringify({
      ingredients: Array.from(unlockedIngredientSet),
      themes: Array.from(unlockedThemeSet),
    }))
  }, [unlockedIngredientSet, unlockedThemeSet])

  useEffect(() => {
    void refreshApiStatus()
    const timer = window.setInterval(() => {
      void refreshApiStatus()
    }, 30000)

    return () => {
      window.clearInterval(timer)
    }
  }, [refreshApiStatus])

  const combinedCards = [...savedCards, ...recipeHistory]
  const uniqueCardsById = Array.from(new Map(combinedCards.map((card) => [card.id, card])).values())
  const topRatedDishes = uniqueCardsById
    .filter((card) => ratings[card.id])
    .sort((left, right) => (ratings[right.id] || 0) - (ratings[left.id] || 0))
    .slice(0, 5)
  const ratingValues = Object.values(ratings)
  const averageRating = ratingValues.length ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(2) : '0.00'
  const favoriteTheme = Object.entries(playerStats.themeUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No data yet'

  // Shop Modal
  if (showShopModal) {
    const modalSurfaceClass = darkMode
      ? 'w-full max-w-2xl rounded-2xl bg-slate-900 p-8 shadow-2xl'
      : 'w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl'
    const modalTitleClass = darkMode ? 'text-2xl font-bold text-slate-100' : 'text-2xl font-bold text-slate-900'
    const modalBodyClass = darkMode ? 'mt-2 text-slate-300' : 'mt-2 text-slate-600'
    const modalSubheadClass = darkMode ? 'text-lg font-semibold text-slate-100 mt-6' : 'text-lg font-semibold text-slate-900 mt-6'
    const modalCancelClass = darkMode
      ? 'mt-6 w-full rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800'
      : 'mt-6 w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100'
    
    const lockedIngredients = allIngredients.filter(item => !item.unlocked && !unlockedIngredientSet.has(item.name))
    const lockedThemes = themes.filter(item => !item.unlocked && !unlockedThemeSet.has(item.name))

    return (
      <main className={`min-h-screen px-6 py-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-900'}`}>
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className={modalSurfaceClass + ' my-8'}>
              <h2 className={modalTitleClass}>🛒 Shop</h2>
              <p className={modalBodyClass}>Use your earned points to unlock premium ingredients and themes!</p>
              <p className="mt-2 rounded-lg bg-yellow-100 px-3 py-2 text-center font-semibold text-yellow-800">
                ⭐ Your Points: {playerPoints}
              </p>

              {/* Premium Ingredients Section */}
              <h3 className={modalSubheadClass}>Premium Ingredients</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {lockedIngredients.map((ingredient) => {
                  const price = ingredientPricing[ingredient.name] || 0
                  const canAfford = playerPoints >= price
                  const isUnlocked = unlockedIngredientSet.has(ingredient.name)
                  
                  return (
                    <div
                      key={ingredient.name}
                      className={`rounded-lg border p-3 ${
                        darkMode
                          ? 'border-slate-600 bg-slate-800'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {ingredient.name}
                          </p>
                          <p className="text-sm font-semibold text-orange-600">⭐ {price} points</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => purchaseItem(ingredient.name, 'ingredient')}
                          disabled={!canAfford || isUnlocked}
                          className={`rounded px-3 py-1 text-sm font-semibold ${
                            isUnlocked
                              ? 'bg-green-200 text-green-800 cursor-not-allowed'
                              : canAfford
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isUnlocked ? '✓ Owned' : canAfford ? 'Buy' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {lockedIngredients.length === 0 && (
                <p className={`mt-2 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  All premium ingredients unlocked! 🎉
                </p>
              )}

              {/* Premium Themes Section */}
              <h3 className={modalSubheadClass}>Premium Themes</h3>
              <div className="mt-3 grid gap-2">
                {lockedThemes.map((theme) => {
                  const price = themePricing[theme.name] || 0
                  const canAfford = playerPoints >= price
                  const isUnlocked = unlockedThemeSet.has(theme.name)
                  
                  return (
                    <div
                      key={theme.name}
                      className={`rounded-lg border p-3 ${
                        darkMode
                          ? 'border-slate-600 bg-slate-800'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {theme.name}
                          </p>
                          <p className="text-sm font-semibold text-orange-600">⭐ {price} points</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => purchaseItem(theme.name, 'theme')}
                          disabled={!canAfford || isUnlocked}
                          className={`rounded px-3 py-1 text-sm font-semibold ${
                            isUnlocked
                              ? 'bg-green-200 text-green-800 cursor-not-allowed'
                              : canAfford
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isUnlocked ? '✓ Owned' : canAfford ? 'Buy' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {lockedThemes.length === 0 && (
                <p className={`mt-2 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  All premium themes unlocked! 🎉
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowShopModal(false)}
                className={modalCancelClass}
              >
                Close Shop
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Game Selection Modal
  if (showGameSelectionModal && !currentGame) {
    const modalSurfaceClass = darkMode
      ? 'w-full max-w-lg rounded-2xl bg-slate-900 p-8 shadow-2xl'
      : 'w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl'
    const modalTitleClass = darkMode ? 'text-2xl font-bold text-slate-100' : 'text-2xl font-bold text-slate-900'
    const modalBodyClass = darkMode ? 'mt-2 text-slate-300' : 'mt-2 text-slate-600'
    const modalSubheadClass = darkMode ? 'text-sm font-semibold text-slate-300' : 'text-sm font-semibold text-slate-700'
    const modalGameButtonClass = darkMode
      ? 'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700'
      : 'w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100'
    const modalCancelClass = darkMode
      ? 'mt-6 w-full rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800'
      : 'mt-6 w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100'

    return (
      <main className={`min-h-screen px-6 py-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-900'}`}>
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={modalSurfaceClass}>
              <h2 className={modalTitleClass}>Play Mini-Games</h2>
              <p className={modalBodyClass}>Earn points to unlock themes and ingredients!</p>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={selectRandomGame}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                >
                  🎲 Random Game
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  🎮 Choose Game
                </button>
              </div>
              <div className="mt-6 space-y-2">
                <h3 className={modalSubheadClass}>Available Games:</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => selectGameManually('chop-challenge')}
                    className={modalGameButtonClass}
                  >
                    🎵 Ingredient Chop Challenge (Rhythm)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectGameManually('flame-control')}
                    className={modalGameButtonClass}
                  >
                    🔥 Flame Control (Timing)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectGameManually('memory-match')}
                    className={modalGameButtonClass}
                  >
                    🎪 Memory Match (Concentration)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectGameManually('accuracy-shooter')}
                    className={modalGameButtonClass}
                  >
                    🎯 Accuracy Shooter (Clicking)
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGameSelectionModal(false)}
                className={modalCancelClass}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Ingredient Chop Challenge Game
  if (currentGame === 'chop-challenge') {
    return (
      <ChopChallengeGame
        onExit={() => {
          setCurrentGame(null)
          setShowGameSelectionModal(true)
        }}
        onGameEnd={(points: number, score: number) => {
          awardGamePoints(points)
          setGameHighScores((current) => ({ ...current, chopChallenge: Math.max(current.chopChallenge, score) }))
          setCurrentGame(null)
          setShowGameSelectionModal(false)
        }}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
      />
    )
  }

  // Flame Control Game
  if (currentGame === 'flame-control') {
    return (
      <FlameControlGame
        onExit={() => {
          setCurrentGame(null)
          setShowGameSelectionModal(true)
        }}
        onGameEnd={(points: number, score: number) => {
          awardGamePoints(points)
          setGameHighScores((current) => ({ ...current, flameControl: Math.max(current.flameControl, score) }))
          setCurrentGame(null)
          setShowGameSelectionModal(false)
        }}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
      />
    )
  }

  // Memory Match Game
  if (currentGame === 'memory-match') {
    return (
      <MemoryMatchGame
        onExit={() => {
          setCurrentGame(null)
          setShowGameSelectionModal(true)
        }}
        onGameEnd={(points: number, score: number) => {
          awardGamePoints(points)
          setGameHighScores((current) => ({ ...current, memoryMatch: Math.max(current.memoryMatch, score) }))
          setCurrentGame(null)
          setShowGameSelectionModal(false)
        }}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
      />
    )
  }

  // Accuracy Shooter Game
  if (currentGame === 'accuracy-shooter') {
    return (
      <AccuracyShooterGame
        onExit={() => {
          setCurrentGame(null)
          setShowGameSelectionModal(true)
        }}
        onGameEnd={(points: number, score: number) => {
          awardGamePoints(points)
          setGameHighScores((current) => ({ ...current, accuracyShooter: Math.max(current.accuracyShooter, score) }))
          setCurrentGame(null)
          setShowGameSelectionModal(false)
        }}
        soundEnabled={soundEnabled}
        darkMode={darkMode}
      />
    )
  }

  if (screen !== 'game') {
    return (
      <main className={`min-h-screen px-6 py-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-900'}`}>
        <div className={`mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-orange-300 ${darkMode ? 'bg-slate-900' : 'bg-white'} p-10 text-center shadow-lg`}>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Chaos Kitchen</p>
          <h1 className={`mt-2 text-5xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Arcade Mode</h1>

          {screen === 'menu' && (
            <>
              <p className={`mt-4 max-w-xl ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Cook weird, earn glory, and build legendary dish cards in a game-like creative kitchen.</p>
              <div className="mt-8 flex w-full max-w-md flex-col gap-3">
                <button type="button" onClick={() => setScreen('game')} className="rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700">Start Game</button>
                <button type="button" onClick={() => setScreen('help')} className={`rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} px-4 py-3 font-semibold`}>Help</button>
                <button type="button" onClick={() => setScreen('credits')} className={`rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} px-4 py-3 font-semibold`}>Credits</button>
                <button type="button" onClick={() => setDarkMode((current) => !current)} className={`rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} px-4 py-3 font-semibold`}>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</button>
              </div>
            </>
          )}

          {screen === 'help' && (
            <>
              <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Choose ingredients + theme, set difficulty and chef style, then press Cook Chaos. Save, remix, rate, export PDF, and track leaderboard stats.</p>
              <button type="button" onClick={() => setScreen('menu')} className="mt-8 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Back</button>
            </>
          )}

          {screen === 'credits' && (
            <>
              <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Built for Agents League with React, TypeScript, Express, and GitHub Copilot.</p>
              <button type="button" onClick={() => setScreen('menu')} className="mt-8 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Back</button>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen px-6 py-8 ${darkMode ? 'app-dark bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl">
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'linear-gradient(45deg, #FF6B35 0%, #F7931E 25%, #FDB833 50%, #F7931E 75%, #FF6B35 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradient 3s ease infinite'
          }}>
            <style>{`
              @keyframes gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes pixelPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
              }
              .pixel-block {
                width: 20px;
                height: 20px;
                display: inline-block;
                margin: 2px;
                animation: pixelPulse 0.6s ease-in-out infinite;
              }
              .pixel-bg {
                position: absolute;
                opacity: 0.3;
                font-size: 40px;
                user-select: none;
              }
              @keyframes streetBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes asianFloat {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-8px) scale(1.04); }
              }
              @keyframes dessertSparkle {
                0%, 100% { transform: rotate(-2deg) scale(1); filter: brightness(1); }
                50% { transform: rotate(2deg) scale(1.06); filter: brightness(1.1); }
              }
              @keyframes spicyHeat {
                0%, 100% { transform: scale(1) translateX(0); }
                25% { transform: scale(1.05) translateX(-2px); }
                75% { transform: scale(1.05) translateX(2px); }
              }
              @keyframes gardenSway {
                0%, 100% { transform: rotate(-2deg); }
                50% { transform: rotate(2deg); }
              }
              @keyframes retroBlink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.85; transform: scale(1.03); }
              }
              @keyframes chaosSpin {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(8deg) scale(1.06); }
                100% { transform: rotate(-8deg) scale(1); }
              }
              .theme-image {
                width: 220px;
                height: 220px;
                object-fit: cover;
                border-radius: 18px;
                border: 4px solid #ffffff;
                image-rendering: pixelated;
                box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.25);
              }
              .theme-anim-street { animation: streetBounce 1s ease-in-out infinite; }
              .theme-anim-asian { animation: asianFloat 1.2s ease-in-out infinite; }
              .theme-anim-dessert { animation: dessertSparkle 1.1s ease-in-out infinite; }
              .theme-anim-spicy { animation: spicyHeat 0.5s linear infinite; }
              .theme-anim-garden { animation: gardenSway 1.4s ease-in-out infinite; transform-origin: bottom center; }
              .theme-anim-retro { animation: retroBlink 0.7s steps(2, end) infinite; }
              .theme-anim-chaos { animation: chaosSpin 0.6s ease-in-out infinite; }
            `}</style>
            
            {/* Floating pixel blocks background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="pixel-bg" style={{ top: '10%', left: '5%' }}>🟦</div>
              <div className="pixel-bg" style={{ top: '20%', right: '10%', animation: 'pixelPulse 0.8s ease-in-out infinite' }}>🟩</div>
              <div className="pixel-bg" style={{ bottom: '15%', left: '15%', animation: 'pixelPulse 0.7s ease-in-out infinite' }}>🟪</div>
              <div className="pixel-bg" style={{ bottom: '25%', right: '5%' }}>🟨</div>
              <div className="pixel-bg" style={{ top: '40%', left: '10%' }}>🟥</div>
              <div className="pixel-bg" style={{ top: '60%', right: '15%' }}>🟦</div>
              <div className="pixel-bg" style={{ bottom: '40%', left: '25%' }}>🟩</div>
              <div className="pixel-bg" style={{ top: '30%', left: '40%' }}>🟪</div>
            </div>

            {/* Main cooking modal */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {generationAction === 'remix' ? (
                <img
                  src="/gif_images/kirby_cooking.gif"
                  alt="Kirby remix animation"
                  className="mb-6 h-56 w-56 rounded-2xl border-4 border-white object-cover"
                />
              ) : (
                <img
                  src={activeThemeImage}
                  alt={`${selectedTheme} preview`}
                  className={`theme-image mb-6 ${activeThemeAnimationClass}`}
                />
              )}
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                {generationAction === 'remix' ? 'Remixing Chaos...' : 'Cooking Chaos...'}
              </h2>
              <p className="mt-3 text-lg text-white drop-shadow-lg">Your legendary dish is being crafted! 🔥</p>
              
              {/* Pixel art loading bar */}
              <div className="mt-6 w-64 rounded-lg border-4 border-white bg-black p-2" style={{ imageRendering: 'pixelated' }}>
                <div className="h-6 w-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Chaos Kitchen</p>
              <button
                type="button"
                onClick={() => setShowGameSelectionModal(true)}
                className="rounded-lg border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-200"
              >
                🎮 Play Mini-Games
              </button>
              <button
                type="button"
                onClick={() => setShowShopModal(true)}
                className="rounded-lg border border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
              >
                🛒 Shop
              </button>
              <p className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">⭐ Points: {playerPoints}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Main Menu
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sound: {soundEnabled ? 'On' : 'Off'}
              </button>
              <p
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  apiStatus === 'online'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : apiStatus === 'offline'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                API {apiStatus}
              </p>
              <button
                type="button"
                onClick={() => {
                  void refreshApiStatus()
                }}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Retry API
              </button>
            </div>
          </div>
          <h1 className="mt-2 text-4xl font-extrabold">Cook weird. Plate legendary.</h1>
          <p className="mt-2 text-slate-700">Pick ingredients, choose a vibe, and generate your next culinary disasterpiece.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Inputs</h2>
            <p className="mt-1 text-sm text-slate-600">Pick ingredients and a mood, then cook chaos.</p>

            <h3 className="mt-5 text-sm font-semibold">Difficulty</h3>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Easy">Easy (Simple flavors)</option>
              <option value="Medium">Medium (Complex fusion)</option>
              <option value="Chaos">Chaos (Maximum zaniness)</option>
            </select>

            <h3 className="mt-5 text-sm font-semibold">AI Chef Personality</h3>
            <select
              value={chefPersonality}
              onChange={(event) => setChefPersonality(event.target.value as ChefPersonality)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Classical Chef">Classical Chef</option>
              <option value="Street Food Vendor">Street Food Vendor</option>
              <option value="Fusion Master">Fusion Master</option>
            </select>

            <h3 className="mt-5 text-sm font-semibold">Ingredients</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomIngredients}
                  className="whitespace-nowrap rounded-lg border border-purple-300 bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 hover:bg-purple-200"
                >
                  🎲 Random
                </button>
                <button
                  type="button"
                  onClick={() => setShowIngredientsDropdown(!showIngredientsDropdown)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {selectedIngredients.length === 0 ? 'Select ingredients...' : `${selectedIngredients.length} selected`}
                </button>
              </div>
              {showIngredientsDropdown && (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 shadow-lg">
                  {allIngredients.map((item) => {
                    const isSelected = selectedIngredients.includes(item.name)
                    const isDisabled = !item.unlocked && !unlockedIngredientSet.has(item.name)

                    return (
                      <label key={item.name} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:rounded hover:bg-orange-50">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (!isDisabled) {
                              if (e.target.checked) {
                                setSelectedIngredients([...selectedIngredients, item.name])
                              } else {
                                setSelectedIngredients(selectedIngredients.filter((ing) => ing !== item.name))
                              }
                            }
                          }}
                          disabled={isDisabled}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <span className={`text-sm ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {item.name}
                        </span>
                        {isDisabled && <span className="ml-auto text-xs text-slate-500">🔒</span>}
                      </label>
                    )
                  })}
                </div>
              )}
              {selectedIngredients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedIngredients.map((ingredient) => (
                    <button
                      key={ingredient}
                      type="button"
                      onClick={() => setSelectedIngredients(selectedIngredients.filter((ing) => ing !== ingredient))}
                      className="rounded-full border border-orange-300 bg-orange-600 px-3 py-1 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      {ingredient} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h3 className="mt-5 text-sm font-semibold">Theme</h3>
            <select
              value={selectedTheme}
              onChange={(event) => setSelectedTheme(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {themes.map((theme) => {
                const isUnlocked = theme.unlocked || unlockedThemeSet.has(theme.name)
                const themeLabel = isUnlocked ? theme.name : `${theme.name} 🔒`
                return (
                  <option key={theme.name} value={theme.name} disabled={!isUnlocked}>
                    {themeLabel}
                  </option>
                )
              })}
            </select>

            <button
              type="button"
              onClick={handleCookChaos}
              disabled={isGenerating}
              className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isGenerating ? 'Cooking...' : 'Cook Chaos'}
            </button>
          </article>

          <article className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Dish Card</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemix}
                  disabled={!dishCard || isGenerating}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">🔀</span>
                  Remix
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={!dishCard}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={handleShareRecipe}
                  disabled={!dishCard}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRecipe()}
                  disabled={!dishCard}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Recipe
                </button>
              </div>
            </div>

            {isGenerating && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Cooking in progress... assembling your next chaos dish.
              </p>
            )}

            {!isGenerating && generationStatus && (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {generationStatus}
              </p>
            )}

            {!dishCard ? (
              <p className="mt-4 text-sm text-slate-600">No dish generated yet. Click "Cook Chaos" to create your first card.</p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  <span className="font-semibold">Generated By:</span>{' '}
                  {dishCard.modelUsed || (generationSource === 'api' ? 'AI API' : 'Local Mock Fallback')}
                </p>
                <p>
                  <span className="font-semibold">Dish Name:</span> {dishCard.dishName}
                </p>
                <p>
                  <span className="font-semibold">Ingredients:</span> {dishCard.ingredients.join(', ')}
                </p>
                <p>
                  <span className="font-semibold">Recipe Concept:</span> {dishCard.recipeConcept}
                </p>
                <p>
                  <span className="font-semibold">Flavor Profile:</span> {dishCard.flavorProfile.join(', ')}
                </p>
                <p>
                  <span className="font-semibold">Lore:</span> {dishCard.lore}
                </p>
                <p>
                  <span className="font-semibold">Plating Prompt:</span> {dishCard.platingPrompt}
                </p>
                <p>
                  <span className="font-semibold">Challenge Mode:</span> {dishCard.challengeMode}
                </p>
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-sm font-semibold">Rate this dish:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRateRecipe(dishCard.id, star)}
                        className="text-2xl transition hover:scale-125"
                      >
                        {(ratings[dishCard.id] || 0) >= star ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 text-sm font-semibold ${
                  activeTab === 'saved'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Saved Recipes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-sm font-semibold ${
                  activeTab === 'history'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 text-sm font-semibold ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stats
              </button>
            </div>

            {activeTab === 'saved' && (
              <>
                <p className="mt-3 text-sm text-slate-600">Your favorited dishes appear here.</p>

                {savedCards.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No saved recipes yet.</p>
                ) : (
                  <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto text-sm">
                    {savedCards.map((card) => (
                      <li key={card.id} className="rounded-lg border border-slate-200 p-3">
                        <p className="font-semibold">{card.dishName}</p>
                        <p className="text-slate-600">Theme: {card.mood}</p>
                        {ratings[card.id] && (
                          <p className="mt-1 text-yellow-600">Rating: {'⭐'.repeat(ratings[card.id])}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewRecipe(card)}
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCard(card)}
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipe(card.id)}
                            className="flex-1 rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                <p className="mt-3 text-sm text-slate-600">Your 10 most recent creations.</p>

                {recipeHistory.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No generation history yet.</p>
                ) : (
                  <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto text-sm">
                    {recipeHistory.map((card) => (
                      <li key={card.id} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <p className="font-semibold">{card.dishName}</p>
                        <p className="text-slate-600">Theme: {card.mood}</p>
                        {card.timestamp && (
                          <p className="text-xs text-slate-500">
                            {new Date(card.timestamp).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewRecipe(card)}
                            className="flex-1 rounded border border-purple-300 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveRecipe(card)}
                            className="flex-1 rounded border border-green-300 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                          >
                            Save
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {activeTab === 'stats' && (
              <>
                <p className="mt-3 text-sm text-slate-600">Leaderboard and creator progress.</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p><span className="font-semibold">Total Dishes Created:</span> {playerStats.totalDishesCreated}</p>
                    <p><span className="font-semibold">Average Rating:</span> {averageRating} / 5</p>
                    <p><span className="font-semibold">Favorite Theme:</span> {favoriteTheme}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold">Most-Rated Dishes</p>
                    {topRatedDishes.length === 0 ? (
                      <p className="mt-2 text-slate-500">Rate dishes to populate the leaderboard.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {topRatedDishes.map((card) => (
                          <li key={card.id} className="rounded border border-amber-200 bg-amber-50 p-2">
                            <p className="font-semibold">{card.dishName}</p>
                            <p className="text-xs text-slate-600">Theme: {card.mood} · Rating: {'⭐'.repeat(ratings[card.id] || 0)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </article>

          {editingCard && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-96 w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold">Edit Recipe</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <label className="block font-semibold">Dish Name</label>
                    <input
                      type="text"
                      value={editingCard.dishName}
                      onChange={(e) => setEditingCard({ ...editingCard, dishName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold">Recipe Concept</label>
                    <textarea
                      value={editingCard.recipeConcept}
                      onChange={(e) => setEditingCard({ ...editingCard, recipeConcept: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold">Lore</label>
                    <textarea
                      value={editingCard.lore}
                      onChange={(e) => setEditingCard({ ...editingCard, lore: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold">Plating Prompt</label>
                    <textarea
                      value={editingCard.platingPrompt}
                      onChange={(e) => setEditingCard({ ...editingCard, platingPrompt: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold">Challenge Mode</label>
                    <textarea
                      value={editingCard.challengeMode}
                      onChange={(e) => setEditingCard({ ...editingCard, challengeMode: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEditedRecipe(editingCard)}
                    className="flex-1 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
