# Italian Semantic Triple Extractor - Progetto Triple

## Panoramica del Progetto
Tool SPECIALIZZATO per l'estrazione di entità e triple semantiche esclusivamente da testo ITALIANO utilizzando l'API Google Gemini. A differenza di TextRazor che supporta 19 lingue genericamente, questo strumento è progettato SOLO per l'italiano con ottimizzazioni specifiche per la cultura, geografia, storia e linguistica italiana.

## Funzionalità Principali

### 1. Estrazione di Entità Italiane Specializzate
- **Named Entity Recognition (NER)** ottimizzato esclusivamente per l'italiano:
  - **Persone italiane**: Nomi e cognomi italiani, personalità storiche (Dante, Michelangelo), politici contemporanei, santi e figure religiose
  - **Organizzazioni italiane**: Aziende (Fiat, ENI, Telecom), istituzioni (Camera, Senato, Quirinale), partiti politici italiani, sindacati (CGIL, CISL)
  - **Geografia italiana**: 8.000+ comuni italiani, 20 regioni, 110 province, monumenti UNESCO, parchi nazionali, isole, laghi, fiumi
  - **Cultura italiana**: Dialetti regionali, cucina tradizionale, festività religiose e civili, tradizioni locali
  - **Storia italiana**: Eventi dal Risorgimento ad oggi, periodi storici (Impero Romano, Rinascimento), battaglie, trattati
  - **Sport italiano**: Serie A, squadre storiche, atleti olimpici, Giro d'Italia, Formula 1
  - **Arte e letteratura**: Musei, opere d'arte, scrittori, poeti, movimenti artistici italiani

### 2. Estrazione di Triple Semantiche Italiane
- **Relazioni geografiche italiane**: "Roma è capitale di Italia", "Toscana confina con Lazio", "Po attraversa Piemonte"
- **Relazioni storiche specifiche**: "Garibaldi ha unificato Italia", "Medici hanno governato Firenze", "Risorgimento ha preceduto Unità d'Italia"
- **Relazioni culturali**: "Pasta è piatto tipico italiano", "Carnival è tradizione veneziana", "Palio appartiene a Siena"
- **Relazioni linguistiche**: Riconoscimento di espressioni idiomatiche italiane, modi di dire regionali
- **Relazioni amministrative**: "Prefetto governa provincia", "Sindaco amministra comune", "Regione ha competenza su sanità"
- **Relazioni sportive**: "Milan gioca a San Siro", "Juventus ha sede a Torino", "Ferrari corre in Formula 1"

### 3. Analisi Semantica Avanzata per l'Italiano
- **Disambiguazione specifica italiana**: Distinzione tra "Milano città" vs "Milano Finanza", "Roma antica" vs "Roma moderna"
- **Scoring di confidenza adattato**: Algoritmi tarati su corpus di testi italiani per accuratezza superiore
- **Analisi sintattica italiana**: Gestione di costruzioni sintattiche tipiche dell'italiano (pronomi clitici, participio assoluto)
- **Sinonimi e varianti regionali**: "Anguria/Cocomero", "Ciabatta/Baguette italiana", "Maccheroni/Pasta"
- **Riconoscimento forme dialettali**: Inserti di dialetto napoletano, milanese, siciliano in testi standard
- **Gestione titoli nobiliari**: "Sua Maestà", "Sua Eccellenza", "Monsignore", gerarchie ecclesiastiche

### 4. Supporto Markdown
- Input di testo in formato Markdown
- Preservazione della formattazione originale
- Estrazione di metadati dai headers e struttura

## Architettura Tecnica

### Frontend
- **Linguaggio**: JavaScript/TypeScript con React
- **Framework**: Vite per build veloce e compatibilità GitHub Pages
- **Styling**: CSS Modules o Tailwind CSS
- **State Management**: React Context o Zustand

### Backend/API Integration
- **API**: Google Gemini API per analisi semantica
- **Autenticazione**: API key storage nel localStorage del browser
- **Gestione errori**: Retry logic e fallback handling

### Storage
- **API Key**: localStorage del browser (criptata)
- **Risultati**: Sessione locale con opzione export
- **Cache**: Risultati delle analisi per testi ripetuti

## Caratteristiche dell'Interfaccia

### 1. Input Section
- **Text Area** per inserimento testo Markdown
- **File Upload** per caricamento file .md
- **Configurazione API Key** con validazione
- **Opzioni di analisi** personalizzabili

### 2. Output Section
- **Visualizzazione entità** con highlighting nel testo
- **Grafo delle triple** interattivo
- **Tabella relazioni** strutturata
- **Export risultati** (JSON, CSV, RDF/TTL)

### 3. Dashboard Analytics
- **Statistiche estrazione** (numero entità, triple, confidence)
- **Metriche temporali** delle analisi
- **Frequenza entità** più comuni

## Specializzazioni Avanzate per la Lingua Italiana

### 1. Knowledge Base Italiana Completa
- **DBpedia italiana + fonti specializzate**:
  - Database completo di 8.000+ comuni con frazioni e località
  - Archivio personalità dalla storia romana ad oggi (100.000+ figure)
  - Mappatura completa istituzioni (Ministeri, Enti, Authorities)
  - Cronologia eventi storici dal 753 a.C. ad oggi
- **Dizionari specialistici**:
  - Terminologia giuridica italiana (Codici, Leggi, Decreti)
  - Lessico economico-finanziario (Borsa italiana, sistema bancario)
  - Terminologia medica italiana (ASL, nomenclatura sanitaria)
  - Vocabolario ecclesiastico (Diocesi, Ordini religiosi, liturgia)

### 2. Linguistica Italiana Avanzata
- **Morfologia complessa**:
  - Gestione di articoli determinativi/indeterminativi + preposizioni articolate
  - Riconoscimento forme arcaiche ("egli", "codesto", "colui")
  - Analisi di suffissi regionali ("-ino" ligure, "-ello" romano)
- **Sintassi specializzata**:
  - Costruzioni passive italiane ("si dice che", "viene detto")
  - Periodi ipotetici (se fossi, se avessi)
  - Congiuntivo e condizionale in contesti formali
- **Varianti diacroniche**:
  - Italiano antico (Dante, Petrarca)
  - Italiano moderno (XIX-XX sec.)
  - Italiano contemporaneo (neologismi, anglicismi)

### 3. Contesto Culturale Profondo
- **Calendario liturgico e civile**:
  - 365 santi del calendario, feste patronali per città
  - Ricorrenze storiche (25 Aprile, 2 Giugno, 4 Novembre)
  - Stagioni agricole e tradizioni contadine
- **Regionalismo culturale**:
  - Cucina regionale (1.000+ piatti tipici georeferenziati)
  - Dialetti: riconoscimento di 20 famiglie linguistiche regionali
  - Artigianato locale (Murano, ceramica di Caltagirone)
- **Settori specialistici italiani**:
  - Moda (Milano Fashion Week, brand luxury)
  - Design (Salone del Mobile, industrial design)
  - Cinema (Festival di Venezia, Cinecittà)
  - Arte (movimenti dal Futurismo alla Transavanguardia)

## Requisiti Tecnici

### 1. Compatibilità GitHub Pages
- Build statico con Vite
- Routing client-side con React Router
- No server-side dependencies
- Asset optimization per performance

### 2. Sicurezza
- API key encryption nel browser
- No logging di dati sensibili
- HTTPS enforcement
- Content Security Policy

### 3. Performance
- Lazy loading dei componenti
- Debouncing per input di testo
- Caching intelligente
- Compressione risultati

## Struttura del Progetto

```
triple/
├── src/
│   ├── components/
│   │   ├── InputSection/
│   │   ├── OutputSection/
│   │   ├── EntityHighlighter/
│   │   └── TripleGraph/
│   ├── services/
│   │   ├── geminiAPI.ts
│   │   ├── entityExtractor.ts
│   │   └── tripleExtractor.ts
│   ├── utils/
│   │   ├── markdownParser.ts
│   │   ├── storage.ts
│   │   └── export.ts
│   └── types/
│       ├── entities.ts
│       └── triples.ts
├── public/
├── docs/
└── tests/
```

## Fasi di Sviluppo

### Fase 1: Setup Base
- [x] Ricerca e pianificazione
- [ ] Setup progetto Vite + React + TypeScript
- [ ] Configurazione GitHub Pages workflow
- [ ] Struttura componenti base

### Fase 2: Core Functionality
- [ ] Integrazione Google Gemini API
- [ ] Implementazione entity extraction
- [ ] Sviluppo triple extraction
- [ ] Sistema di storage API key

### Fase 3: UI/UX
- [ ] Interfaccia input Markdown
- [ ] Visualizzazione risultati
- [ ] Highlighting entità nel testo
- [ ] Grafo interattivo triple

### Fase 4: Ottimizzazioni Italiane
- [ ] Fine-tuning per lingua italiana
- [ ] Knowledge base italiana
- [ ] Testing con testi italiani
- [ ] Validazione accuratezza

### Fase 5: Deploy e Testing
- [ ] Testing cross-browser
- [ ] Ottimizzazione performance
- [ ] Deploy su GitHub Pages
- [ ] Documentazione utente

## API Google Gemini - Configurazione

### Modelli Consigliati
- **Gemini Pro**: Per analisi semantica generale
- **Gemini Pro Vision**: Se necessario supporto immagini
- **Text Embedding**: Per similarity e clustering

### Prompt Engineering Specializzato per l'Italiano
- **Prompt context-aware per l'italiano**:
  - Template pre-addestrati su corpus di 1M+ documenti italiani
  - Esempi di training da fonti autorevoli (ANSA, Corriere, Repubblica)
  - Pattern specifici per testi giuridici, amministrativi, letterari
- **Gestione ambiguità linguistiche italiane**:
  - Omonimie geografiche: "Alessandria" (Piemonte vs Egitto)
  - Polisemia culturale: "Scala" (Teatro vs strumento musicale)
  - Ambiguità temporali: "Settembre" (mese vs eventi storici)
- **Template per triple italiane**:
  - Relazioni familiari italiane ("cugino", "cognato", "suocera")
  - Gerarchie ecclesiastiche ("Vescovo di", "Cardinale di")
  - Strutture amministrative ("Sindaco di", "Prefetto di", "Questore di")

## Metriche di Successo

### Accuratezza Specializzata per l'Italiano
- **Precisione > 92%** per entità geografiche italiane (vs 85% tool generici)
- **Recall > 88%** per personalità storiche italiane
- **F1-score > 90%** per triple culturali italiane
- **Precisione > 95%** per istituzioni e organizzazioni italiane
- **Accuratezza > 85%** anche per testi con inserti dialettali
- **Riconoscimento > 90%** di espressioni idiomatiche italiane

### Performance
- Tempo analisi < 3 secondi per testo medio
- Load time < 2 secondi
- Responsiveness su mobile

### Usabilità
- Setup API key in < 30 secondi
- Interfaccia intuitiva per utenti non tecnici
- Export risultati in formati standard

## Note Tecniche

### Gestione API Limits
- Rate limiting intelligente
- Chunking per testi lunghi
- Retry automatico con backoff
- Notifiche quota usage

### Estensibilità
- Plugin system per nuove lingue
- API per integrazione esterna
- Webhook per notifiche
- Batch processing mode

### Accessibilità
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- High contrast mode