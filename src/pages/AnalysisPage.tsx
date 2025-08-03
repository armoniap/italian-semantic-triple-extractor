import React from 'react';
import { useApplication } from '@/store/ApplicationStore';
import InputSection from '@/components/InputSection/InputSection';
import OutputSection from '@/components/OutputSection/OutputSection';
import EntityHighlighter from '@/components/EntityHighlighter/EntityHighlighter';
import TripleGraph from '@/components/TripleGraph/TripleGraph';
import {
  AlertCircle,
  Eye,
  EyeOff,
  BarChart3,
  Network,
  List,
} from 'lucide-react';

const AnalysisPage: React.FC = () => {
  const {
    isApiKeyValid,
    analysisError,
    entities,
    triples,
    currentText,
    highlightMode,
    toggleHighlightMode,
    activeView,
    setAnalysisError,
  } = useApplication();

  const hasResults = entities.length > 0 || triples.length > 0;

  if (!isApiKeyValid) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                API Key Non Configurata
              </h3>
              <div className="mt-2 text-red-700 dark:text-red-300">
                <p>
                  Per utilizzare il sistema di analisi è necessario configurare
                  una API key di Google Gemini nelle impostazioni.
                </p>
                <div className="mt-4">
                  <a
                    href="/settings"
                    className="inline-flex items-center bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Vai alle Impostazioni
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Error Display */}
      {analysisError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Errore di Analisi
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                {analysisError}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setAnalysisError(null)}
                  className="text-sm bg-red-600 dark:bg-red-700 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Section - Takes full width on mobile, 1 column on xl */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <InputSection />
          </div>
        </div>

        {/* Results Section - Takes remaining 2 columns on xl */}
        <div className="xl:col-span-2 space-y-6">
          {hasResults && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-4 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {entities.length}
                      </div>
                      <div className="text-sm text-blue-100">Entità</div>
                    </div>
                    <List className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 p-4 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{triples.length}</div>
                      <div className="text-sm text-green-100">Triple</div>
                    </div>
                    <Network className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-4 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {new Set([...entities.map(e => e.type)]).size}
                      </div>
                      <div className="text-sm text-purple-100">Tipi</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 p-4 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {new Set([...triples.map(t => t.predicate.type)]).size}
                      </div>
                      <div className="text-sm text-orange-100">Relazioni</div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Analyzed Text Display */}
              {currentText && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Testo Analizzato
                      </h3>
                      <button
                        onClick={toggleHighlightMode}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {highlightMode ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        <span>
                          {highlightMode ? 'Nascondi' : 'Mostra'} Evidenziature
                        </span>
                      </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600">
                      <EntityHighlighter
                        text={currentText}
                        entities={entities}
                        highlightMode={highlightMode}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Results Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <OutputSection />
              </div>

              {/* Graph Visualization */}
              {activeView === 'triples' && triples.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Grafo delle Relazioni
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                    <TripleGraph triples={triples} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!hasResults && currentText && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Analisi in Corso
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                L'analisi del testo è in corso. I risultati appariranno qui.
              </p>
            </div>
          )}

          {/* Welcome State */}
          {!currentText && (
            <div className="bg-gradient-to-br from-italian-green/10 to-italian-red/10 dark:from-italian-green/20 dark:to-italian-red/20 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="text-italian-green dark:text-green-400 mb-4">
                <Network className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Benvenuto nell'Estrattore di Triple Italiane
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Inserisci del testo italiano nell'area a sinistra per iniziare
                l'analisi semantica e l'estrazione di entità e relazioni.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
                  Entità Geografiche
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                  Persone Storiche
                </span>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full">
                  Eventi Culturali
                </span>
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full">
                  Tradizioni Italiane
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
