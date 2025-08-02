import React, { useState } from 'react';
import { Download, Eye, BarChart3, Network } from 'lucide-react';
import { useApplication } from '@/store/ApplicationStore';
import { ExportService } from '@/utils/export';
import EntityList from './EntityList';
import TripleList from './TripleList';
import AnalyticsPanel from './AnalyticsPanel';
import ExportModal from './ExportModal';

const OutputSection: React.FC = () => {
  const {
    entities,
    triples,
    analytics,
    extractionResult,
    tripleResult,
    activeView,
    setActiveView,
  } = useApplication();

  const [showExportModal, setShowExportModal] = useState(false);
  const hasResults = entities.length > 0 || triples.length > 0;

  const handleExport = async (format: 'json' | 'csv' | 'rdf') => {
    try {
      await ExportService.exportResults(
        entities,
        triples,
        {
          format,
          includeMetadata: true,
          includeAnalytics: !!analytics,
        },
        analytics || undefined
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <Eye className="mx-auto h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Nessun risultato
        </h3>
        <p className="mt-2 text-gray-600">
          Analizza del testo per vedere le entità e le triple semantiche
          estratte.
        </p>
      </div>
    );
  }

  const viewTabs = [
    {
      id: 'entities' as const,
      label: 'Entità',
      icon: Eye,
      count: entities.length,
      description: 'Entità estratte dal testo',
    },
    {
      id: 'triples' as const,
      label: 'Triple',
      icon: Network,
      count: triples.length,
      description: 'Relazioni semantiche identificate',
    },
    {
      id: 'analytics' as const,
      label: 'Analisi',
      icon: BarChart3,
      count: null,
      description: 'Statistiche e metriche',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with export options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Risultati Analisi
        </h3>

        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {extractionResult && (
              <span className="mr-4">
                Confidenza: {Math.round(extractionResult.confidence * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleExport('json')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Esporta JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Esporta CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleExport('rdf')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Esporta RDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      {(extractionResult || tripleResult) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {extractionResult && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">
                Tempo Estrazione Entità
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {extractionResult.processingTime}ms
              </div>
            </div>
          )}

          {tripleResult && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">
                Tempo Estrazione Triple
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tripleResult.processingTime}ms
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Lingua Rilevata</div>
            <div className="text-2xl font-bold text-gray-900">
              {extractionResult?.language === 'it'
                ? '🇮🇹 Italiano'
                : '❓ Sconosciuto'}
            </div>
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-italian-green text-italian-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content area */}
      <div className="min-h-96">
        {activeView === 'entities' && <EntityList entities={entities} />}

        {activeView === 'triples' && <TripleList triples={triples} />}

        {activeView === 'analytics' && analytics && (
          <AnalyticsPanel analytics={analytics} />
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        entities={entities}
        triples={triples}
        analytics={analytics || null}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default OutputSection;
