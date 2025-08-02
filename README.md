# Italian Semantic Triple Extractor

Tool avanzato per l'estrazione automatica di entità e relazioni semantiche da testo italiano utilizzando l'API Google Gemini.

## 🇮🇹 Caratteristiche Principali

- **Ottimizzato per l'Italiano**: Riconoscimento specializzato di entità italiane (luoghi, persone, istituzioni, cultura)
- **AI Avanzata**: Utilizza Google Gemini per analisi semantiche profonde
- **Triple Semantiche**: Estrazione di relazioni RDF soggetto-predicato-oggetto
- **Privacy**: Elaborazione client-side, API key criptate
- **Export Multipli**: JSON, CSV, RDF/Turtle
- **Interfaccia Moderna**: React + TypeScript + Tailwind CSS

## 🚀 Quick Start

### Prerequisiti

- Node.js 18+
- Google Gemini API Key ([ottienila qui](https://ai.google.dev/))

### Installazione

```bash
# Clona il repository
git clone https://github.com/username/triple.git
cd triple

# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev
```

### Configurazione

1. Apri l'applicazione
2. Vai su Impostazioni
3. Inserisci la tua Google Gemini API Key
4. Inizia ad analizzare testi italiani!

## 🏗️ Architettura

```
triple/
├── src/
│   ├── components/          # Componenti React
│   │   ├── InputSection/    # Input testo e file
│   │   ├── OutputSection/   # Visualizzazione risultati
│   │   ├── EntityHighlighter/ # Evidenziazione entità
│   │   └── TripleGraph/     # Grafo interattivo
│   ├── services/            # Servizi core
│   │   ├── geminiAPI.ts     # Integrazione Gemini
│   │   ├── entityExtractor.ts # Estrazione entità
│   │   └── tripleExtractor.ts # Estrazione triple
│   ├── utils/               # Utilità
│   │   ├── markdownParser.ts # Parser Markdown
│   │   ├── storage.ts       # Storage sicuro
│   │   └── export.ts        # Export formati
│   └── types/               # Tipi TypeScript
│       ├── entities.ts      # Tipi entità italiane
│       └── triples.ts       # Tipi triple semantiche
```

## 🔧 Sviluppo

### Script Disponibili

```bash
npm run dev          # Sviluppo
npm run build        # Build produzione
npm run preview      # Preview build
npm run lint         # Lint codice
npm run lint:fix     # Fix lint automatico
npm run format       # Format codice
npm run deploy       # Deploy GitHub Pages
```

### Tecnologie

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **AI**: Google Gemini API
- **Build**: Vite + GitHub Actions
- **Deploy**: GitHub Pages

## 📊 Funzionalità

### Estrazione Entità
- Persone (storiche e contemporanee)
- Luoghi italiani (città, regioni, monumenti)
- Organizzazioni e istituzioni
- Date ed eventi
- Brand e prodotti italiani

### Triple Semantiche
- Relazioni geografiche (situato_in, confina_con)
- Relazioni biografiche (nato_in, morto_in)
- Relazioni culturali (ha_creato, ha_dipinto)
- Relazioni istituzionali (sindaco_di, presidente_di)

### Analisi Avanzate
- Statistiche estrazione
- Grafi di relazioni interattivi
- Export in formati standard
- Cache intelligente
- Cronologia analisi

## 🌐 Deploy

### GitHub Pages

Il progetto è configurato per il deploy automatico su GitHub Pages:

1. Fork questo repository
2. Abilita GitHub Pages nelle impostazioni
3. I commit su `main` triggherano il deploy automatico

### Deploy Manuale

```bash
npm run build
npm run deploy
```

## 🔐 Privacy e Sicurezza

- **API Key**: Salvate criptate nel localStorage
- **Dati**: Elaborazione client-side, nessun server esterno
- **Cache**: Opzionale e locale
- **Export**: Controllo completo sui dati

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📝 Esempi

### Testo di Input
```
Milano è la capitale economica d'Italia, situata in Lombardia. 
Leonardo da Vinci nacque a Vinci nel 1452 e dipinse la Gioconda.
L'Università Bocconi di Milano è famosa per i suoi corsi di economia.
```

### Entità Estratte
- **Milano** (ITALIAN_CITY)
- **Italia** (LOCATION) 
- **Lombardia** (ITALIAN_REGION)
- **Leonardo da Vinci** (HISTORICAL_FIGURE)
- **Università Bocconi** (UNIVERSITY)

### Triple Semantiche
- Milano → situato_in → Lombardia
- Leonardo da Vinci → nato_in → Vinci
- Leonardo da Vinci → ha_dipinto → Gioconda
- Università Bocconi → situato_in → Milano

## 🆘 Supporto

- **Issues**: [GitHub Issues](https://github.com/username/triple/issues)
- **Documentazione**: [Wiki](https://github.com/username/triple/wiki)
- **Email**: support@example.com

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi [LICENSE](LICENSE) per dettagli.

## 🙏 Ringraziamenti

- Google per l'API Gemini
- Comunità React e TypeScript
- Contributors del progetto

---

Made with ❤️ for the Italian NLP community