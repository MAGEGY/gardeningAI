import { UI_LANGS, useI18n } from '../i18n'
import GrowVideo from './GrowVideo'
import { LeafIcon } from './icons'

export default function LanguageScreen() {
  const { setLang } = useI18n()
  return (
    <div className="onboard">
      <GrowVideo className="bg-video" />
      <div className="onboard-card">
        <div className="onboard-brand">
          <LeafIcon width={40} height={40} />
          <h1>Gardening AI</h1>
        </div>
        <p className="muted small">
          Choose your language · اختر لغتك · Choisissez votre langue · Elige tu idioma · Sprache wählen
        </p>
        <div className="lang-grid">
          {UI_LANGS.map((l) => (
            <button key={l.code} className="lang-btn" onClick={() => setLang(l.code)}>
              <strong>{l.native}</strong>
              {l.native !== l.english && <small className="muted">{l.english}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
