import { useEffect, useState, type ReactNode } from 'react'
import { Ctx, LANG_KEY, UI_LANGS, isLang, translate, type UiLang } from '../i18n'
import { initSecureKey } from '../lib/secureKey'
import { loadSettings, saveSettings } from '../lib/storage'
import { LeafIcon } from './icons'

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  // decrypt the stored API key before any child renders (they read it synchronously)
  useEffect(() => {
    void initSecureKey().finally(() => setReady(true))
  }, [])

  const [lang, setLangState] = useState<UiLang>(() => {
    const s = localStorage.getItem(LANG_KEY)
    return isLang(s) ? s : 'en'
  })
  const [chosen, setChosen] = useState(() => isLang(localStorage.getItem(LANG_KEY)))
  const dir = UI_LANGS.find((l) => l.code === lang)?.dir ?? 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = (l: UiLang) => {
    setLangState(l)
    setChosen(true)
    localStorage.setItem(LANG_KEY, l)
    // default AI answers to the UI language unless the user overrides it in Settings
    const english = UI_LANGS.find((x) => x.code === l)?.english ?? 'English'
    saveSettings({ ...loadSettings(), language: english })
  }

  const t = (key: string) => translate(lang, key)

  return (
    <Ctx.Provider value={{ lang, chosen, dir, setLang, t }}>
      {ready ? (
        children
      ) : (
        <div className="boot-splash">
          <LeafIcon width={52} height={52} />
        </div>
      )}
    </Ctx.Provider>
  )
}
