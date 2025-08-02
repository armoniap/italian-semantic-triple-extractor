import React from 'react';
import { useApplication } from '@/store/ApplicationStore';
import InputSection from '@/components/InputSection/InputSection';
import OutputSection from '@/components/OutputSection/OutputSection';
import EntityHighlighter from '@/components/EntityHighlighter/EntityHighlighter';
import TripleGraph from '@/components/TripleGraph/TripleGraph';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                API Key Non Configurata
              </h3>
              <div className="mt-2 text-red-700">
                <p>
                  Per utilizzare il sistema di analisi è necessario configurare
                  una API key di Google Gemini nelle impostazioni.
                </p>
                <div className="mt-4">
                  <a
                    href="/settings"
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
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
    <div className="max-w-7xl mx-auto">
      {/* Error Display */}
      {analysisError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errore di Analisi
              </h3>
              <div className="mt-1 text-sm text-red-700">{analysisError}</div>
              <div className="mt-3">
                <button
                  onClick={() => setAnalysisError(null)}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <InputSection />

          {/* Text with entity highlighting */}
          {currentText && hasResults && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Testo Analizzato
                </h3>
                <button
                  onClick={toggleHighlightMode}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
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

              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <EntityHighlighter
                  text={currentText}
                  entities={entities}
                  highlightMode={highlightMode}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <OutputSection />

          {/* Graph visualization for triples */}
          {activeView === 'triples' && triples.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <TripleGraph triples={triples} />
            </div>
          )}
        </div>
      </div>

      {/* Full-width sections for detailed views */}
      {hasResults && (
        <div className="mt-8 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-blue-600">
                {entities.length}
              </div>
              <div className="text-sm text-gray-600">Entità Estratte</div>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600">
                {triples.length}
              </div>
              <div className="text-sm text-gray-600">Triple Semantiche</div>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set([...entities.map(e => e.type)]).size}
              </div>
              <div className="text-sm text-gray-600">Tipi di Entità</div>
            </div>

            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set([...triples.map(t => t.predicate.type)]).size}
              </div>
              <div className="text-sm text-gray-600">Tipi di Relazione</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
