import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  Trash2,
  Play,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lightbulb,
  Database,
  Zap,
} from 'lucide-react';
import { useApplication } from '@/store/ApplicationStore';

const InputSection: React.FC = () => {
  const {
    currentText,
    isAnalyzing,
    analysisProgress,
    analyzeText,
    clearResults,
    isApiKeyValid,
    setAnalysisError,
    useSemanticEnhancement,
    toggleSemanticEnhancement,
    semanticSearchService,
  } = useApplication();

  const [text, setText] = useState(currentText || '');
  const [dragOver, setDragOver] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) {
      setAnalysisError('Inserisci del testo da analizzare');
      return;
    }

    if (!isApiKeyValid) {
      setAnalysisError('Configura la tua API key nelle impostazioni');
      return;
    }

    await analyzeText(text);
  }, [text, analyzeText, isApiKeyValid, setAnalysisError]);

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        setAnalysisError('Sono supportati solo file .md e .txt');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (content) {
          setText(content);
        }
      };
      reader.readAsText(file);
    },
    [setAnalysisError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleClear = useCallback(() => {
    setText('');
    clearResults();
  }, [clearResults]);

  // Word count calculation
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Italian language detection and validation
  const italianAnalysis = useMemo(() => {
    if (!text.trim())
      return { isItalian: false, confidence: 0, indicators: [] };

    const italianIndicators = [
      // Common Italian words
      /\b(il|la|lo|le|gli|un|una|uno|del|della|dello|dei|degli|delle|nel|nella|nello|nei|negli|nelle)\b/gi,
      // Italian verb endings
      /\w+(are|ere|ire|ato|uto|ito)\b/gi,
      // Italian city/region names
      /\b(Roma|Milano|Napoli|Torino|Firenze|Bologna|Venezia|Genova|Palermo|Bari|Catania|Verona|Messina|Padova|Trieste|Brescia|Prato|Taranto|Modena|Reggio|Calabria|Livorno|Cagliari|Foggia|Rimini|Salerno|Ferrara|Sassari|Monza|Siracusa|Pescara|Bergamo|Forlì|Trento|Vicenza|Terni|Bolzano|Novara|Piacenza|Ancona|Andria|Arezzo|Udine|Cesena)\b/gi,
      // Italian surnames
      /\b\w+(ini|oni|etti|elli|ucci|acci|asso|otto|ino|ano|ese|elli)\b/gi,
      // Italian geographical terms
      /\b(piazza|via|corso|viale|monte|lago|fiume|isola|regione|provincia|comune|città|paese|borgo)\b/gi,
      // Italian cultural terms
      /\b(arte|cultura|storia|tradizione|festival|cucina|pasta|pizza|risotto|gelato|espresso|cappuccino|basilica|duomo|palazzo|castello|museo|teatro|opera)\b/gi,
    ];

    let totalMatches = 0;
    const indicators: string[] = [];

    italianIndicators.forEach((regex, index) => {
      const matches = text.match(regex);
      if (matches) {
        totalMatches += matches.length;
        switch (index) {
          case 0:
            indicators.push('Articoli italiani');
            break;
          case 1:
            indicators.push('Verbi italiani');
            break;
          case 2:
            indicators.push('Città italiane');
            break;
          case 3:
            indicators.push('Cognomi italiani');
            break;
          case 4:
            indicators.push('Termini geografici');
            break;
          case 5:
            indicators.push('Cultura italiana');
            break;
        }
      }
    });

    const confidence = Math.min(totalMatches / Math.max(1, wordCount / 10), 1);
    const isItalian = confidence > 0.3;

    return { isItalian, confidence, indicators: [...new Set(indicators)] };
  }, [text, wordCount]);

  // Italian cultural context suggestions
  const italianSuggestions = useMemo(() => {
    const suggestions = [];

    if (text.toLowerCase().includes('roma')) {
      suggestions.push(
        '💡 Considera di aggiungere informazioni su monumenti romani come il Colosseo, Foro Romano, o Pantheon'
      );
    }

    if (text.toLowerCase().includes('milano')) {
      suggestions.push(
        '💡 Potresti menzionare La Scala, il Duomo, o la Quadrilatero della Moda'
      );
    }

    if (text.toLowerCase().includes('firenze')) {
      suggestions.push(
        '💡 Aggiungi riferimenti agli Uffizi, Ponte Vecchio, o ai Medici per un contesto storico più ricco'
      );
    }

    if (text.toLowerCase().includes('venezia')) {
      suggestions.push(
        '💡 Includi Piazza San Marco, Palazzo Ducale, o il Carnevale per arricchire il testo'
      );
    }

    if (text.toLowerCase().includes('napoli')) {
      suggestions.push(
        '💡 Menziona il Vesuvio, Pompei, o la pizza napoletana per maggiore contesto culturale'
      );
    }

    if (/\b(pasta|pizza|risotto|gelato)\b/i.test(text)) {
      suggestions.push(
        '💡 Specifica le origini regionali dei piatti italiani per relazioni geografiche più precise'
      );
    }

    if (/\b(renaissance|rinascimento)\b/i.test(text)) {
      suggestions.push(
        '💡 Aggiungi nomi di artisti come Leonardo, Michelangelo, o Raffaello'
      );
    }

    if (text.split(/\s+/).length < 50) {
      suggestions.push(
        '📝 Testi più lunghi permettono di estrarre relazioni semantiche più ricche'
      );
    }

    if (!text.includes('.') && text.length > 100) {
      suggestions.push(
        "📝 Aggiungi punteggiatura per migliorare l'analisi delle frasi"
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }, [text]);

  // Analyze markdown structure if present
  const isMarkdown =
    text.includes('#') || text.includes('[') || text.includes('```');
  const estimatedTime = Math.ceil(wordCount / 200); // Reading time estimation

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Globe className="w-5 h-5 mr-2 text-italian-green" />
          Inserisci Testo Italiano
        </h3>
        <div className="flex items-center space-x-2">
          {/* Italian language indicator */}
          {text.trim() && (
            <div
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                italianAnalysis.isItalian
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              {italianAnalysis.isItalian ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              <span>
                {italianAnalysis.isItalian ? 'Italiano' : 'Non italiano'}(
                {Math.round(italianAnalysis.confidence * 100)}%)
              </span>
            </div>
          )}

          {isMarkdown && (
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
              Markdown
            </span>
          )}

          {wordCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {wordCount} parole • {estimatedTime} min
            </span>
          )}
        </div>
      </div>

      {/* Italian analysis details */}
      {text.trim() && italianAnalysis.indicators.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm">
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Indicatori italiani rilevati:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {italianAnalysis.indicators.map((indicator, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs rounded"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cultural context suggestions */}
      {italianSuggestions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start">
            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Suggerimenti per arricchire il contesto italiano:
              </div>
              <div className="space-y-1">
                {italianSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="text-yellow-700 dark:text-yellow-300 text-xs"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 mt-1 underline"
              >
                {showSuggestions ? 'Nascondi' : 'Mostra'} tutti i suggerimenti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver
            ? 'border-italian-green bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Trascina un file Markdown o
                <span className="text-italian-green"> sfoglia</span>
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".md,.txt"
              onChange={handleFileInputChange}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Formati supportati: .md, .txt
          </p>
        </div>
      </div>

      {/* Text input */}
      <div className="space-y-2">
        <label
          htmlFor="text-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Testo da Analizzare
        </label>
        <textarea
          id="text-input"
          rows={12}
          className="form-textarea custom-scrollbar"
          placeholder="Inserisci qui il tuo testo italiano. Puoi utilizzare Markdown per la formattazione.

Esempio:
# Milano
Milano è una città nel nord Italia, capitale della regione Lombardia. È famosa per essere un importante centro economico e della moda.

## Storia
La città fu fondata dai Celti e successivamente conquistata dai Romani..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isAnalyzing}
        />
      </div>

      {/* Progress bar during analysis */}
      {isAnalyzing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Analisi in corso...
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {analysisProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-italian-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Semantic Enhancement Toggle */}
      {semanticSearchService && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Analisi Semantica Avanzata
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  Utilizza il database vettoriale per relazioni semantiche più ricche e contesto culturale italiano.
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`flex items-center space-x-1 ${
                    semanticSearchService?.isReady() 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      semanticSearchService?.isReady() 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`} />
                    <span>
                      {semanticSearchService?.isReady() 
                        ? semanticSearchService.getVectorStore()?.isUsingChromaDB()
                          ? 'ChromaDB connesso' 
                          : 'IndexedDB attivo'
                        : 'Vector DB non disponibile'}
                    </span>
                  </div>
                  {useSemanticEnhancement && (
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                      <Zap className="w-3 h-3" />
                      <span>Attivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={toggleSemanticEnhancement}
                disabled={!semanticSearchService?.isReady() || isAnalyzing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  useSemanticEnhancement
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useSemanticEnhancement ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleClear}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          disabled={isAnalyzing}
        >
          <Trash2 className="w-4 h-4" />
          <span>Pulisci</span>
        </button>

        <div className="flex items-center space-x-3">
          {text && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {text.length} caratteri
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || isAnalyzing || !isApiKeyValid}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analizzando...' : 'Analizza Testo'}</span>
          </button>
        </div>
      </div>

      {/* Enhanced help text with Italian examples */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-2 flex items-center">
          <span className="text-lg mr-2">🇮🇹</span>
          Suggerimenti per un'analisi ottimale:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
              Contenuto ideale:
            </h5>
            <ul className="space-y-1 text-sm">
              <li>• Testo in italiano standard</li>
              <li>• Luoghi italiani (città, regioni, monumenti)</li>
              <li>• Personalità italiane (storiche e contemporanee)</li>
              <li>• Eventi e tradizioni culturali</li>
              <li>• Organizzazioni e istituzioni italiane</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
              Esempi efficaci:
            </h5>
            <ul className="space-y-1 text-sm">
              <li>• "Leonardo da Vinci nacque a Vinci nel 1452"</li>
              <li>• "Il Colosseo si trova nel centro di Roma"</li>
              <li>• "La Juventus gioca all'Allianz Stadium"</li>
              <li>• "Il risotto è un piatto tipico lombardo"</li>
              <li>• "Dante scrisse la Divina Commedia"</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Nota:</strong> Il sistema è ottimizzato per l'italiano e
            riconosce dialetti regionali, nomi storici, geografia italiana e
            relazioni culturali specifiche.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
