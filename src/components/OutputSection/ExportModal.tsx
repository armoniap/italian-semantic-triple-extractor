import React, { useState } from 'react';
import {
  Download,
  X,
  FileText,
  Database,
  Code,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ItalianEntity } from '@/types/entities';
import { SemanticTriple, TripleAnalytics } from '@/types/triples';
import { ExportService } from '@/utils/export';

interface ExportModalProps {
  entities: ItalianEntity[];
  triples: SemanticTriple[];
  analytics?: TripleAnalytics | null;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'rdf' | 'turtle' | 'xml';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  extension: string;
  mimeType: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  entities,
  triples,
  analytics,
  isOpen,
  onClose,
}) => {
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(
    new Set(['json'])
  );
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeItalianContext, setIncludeItalianContext] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportOptions: ExportOption[] = [
    {
      format: 'json',
      label: 'JSON Strutturato',
      description:
        'Formato JSON completo con tutte le entità, triple e metadati italiani',
      icon: Code,
      extension: 'json',
      mimeType: 'application/json',
    },
    {
      format: 'csv',
      label: 'CSV Tabellare',
      description: 'Formato CSV per analisi in Excel o Google Sheets',
      icon: FileText,
      extension: 'csv',
      mimeType: 'text/csv',
    },
    {
      format: 'rdf',
      label: 'RDF/XML Semantico',
      description: 'Standard RDF per integrazione con knowledge graphs',
      icon: Database,
      extension: 'rdf',
      mimeType: 'application/rdf+xml',
    },
    {
      format: 'turtle',
      label: 'Turtle Semantico',
      description: 'Formato Turtle per web semantico e linked data',
      icon: Database,
      extension: 'ttl',
      mimeType: 'text/turtle',
    },
    {
      format: 'xml',
      label: 'XML Strutturato',
      description: 'Formato XML per integrazione con sistemi enterprise',
      icon: Code,
      extension: 'xml',
      mimeType: 'application/xml',
    },
  ];

  const toggleFormat = (format: ExportFormat) => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormats(newFormats);
  };

  const handleExport = async () => {
    if (selectedFormats.size === 0) {
      setExportError('Seleziona almeno un formato di esportazione');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const exportOptions = {
        includeMetadata,
        includeAnalytics: includeAnalytics && !!analytics,
        includeItalianContext,
        italianLabels: true,
        culturalContext: true,
      };

      const exportPromises = Array.from(selectedFormats).map(async format => {
        return ExportService.exportResults(
          entities,
          triples,
          { ...exportOptions, format },
          analytics || undefined
        );
      });

      await Promise.all(exportPromises);

      setExportSuccess(
        `Esportazione completata! ${selectedFormats.size} file${selectedFormats.size > 1 ? 's' : ''} scaricato/i.`
      );

      // Auto-close modal after success
      setTimeout(() => {
        onClose();
        setExportSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(
        error instanceof Error
          ? `Errore durante l'esportazione: ${error.message}`
          : "Errore sconosciuto durante l'esportazione"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getFilePreview = () => {
    const fileCount = selectedFormats.size;
    if (fileCount === 0) return 'Nessun file';

    const formatList = Array.from(selectedFormats)
      .map(format =>
        exportOptions
          .find(opt => opt.format === format)
          ?.extension.toUpperCase()
      )
      .join(', ');

    return `${fileCount} file: ${formatList}`;
  };

  const getTotalEntitiesCount = () => entities.length;
  const getTotalTriplesCount = () => triples.length;
  const getItalianEntitiesCount = () =>
    entities.filter(
      e =>
        e.type.includes('ITALIAN') ||
        e.metadata?.region ||
        e.metadata?.culturalContext
    ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Download className="w-5 h-5 mr-2 text-italian-green" />
              Esporta Risultati Analisi Italiana
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Contenuto da esportare:
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getTotalEntitiesCount()}
                </div>
                <div className="text-gray-600">Entità Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getTotalTriplesCount()}
                </div>
                <div className="text-gray-600">Triple Semantiche</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {getItalianEntitiesCount()}
                </div>
                <div className="text-gray-600">Entità Italiane</div>
              </div>
            </div>
          </div>

          {/* Export format selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Formati di Esportazione:
            </h4>
            <div className="space-y-3">
              {exportOptions.map(option => {
                const Icon = option.icon;
                const isSelected = selectedFormats.has(option.format);

                return (
                  <div
                    key={option.format}
                    onClick={() => toggleFormat(option.format)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-italian-green bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFormat(option.format)}
                          className="form-checkbox h-4 w-4 text-italian-green rounded border-gray-300 focus:ring-italian-green"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {option.label}
                          </span>
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            .{option.extension}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export options */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Opzioni di Esportazione:
            </h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={e => setIncludeMetadata(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-italian-green rounded border-gray-300 focus:ring-italian-green"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include metadati entità (coordinate, regioni, contesto
                  culturale)
                </span>
              </label>

              {analytics && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeAnalytics}
                    onChange={e => setIncludeAnalytics(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-italian-green rounded border-gray-300 focus:ring-italian-green"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include statistiche e analytics delle relazioni
                  </span>
                </label>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeItalianContext}
                  onChange={e => setIncludeItalianContext(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-italian-green rounded border-gray-300 focus:ring-italian-green"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include contesto culturale italiano e traduzioni
                </span>
              </label>
            </div>
          </div>

          {/* Export preview */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-blue-800">
                Anteprima esportazione:
              </span>
              <div className="mt-1 text-blue-700">{getFilePreview()}</div>
            </div>
          </div>

          {/* Status messages */}
          {exportSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700">{exportSuccess}</span>
            </div>
          )}

          {exportError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{exportError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>

            <button
              onClick={handleExport}
              disabled={selectedFormats.size === 0 || isExporting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Esportazione...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Esporta{' '}
                  {selectedFormats.size > 0 ? `(${selectedFormats.size})` : ''}
                </>
              )}
            </button>
          </div>

          {/* Italian cultural note */}
          <div className="mt-4 text-xs text-gray-500 italic text-center">
            🇮🇹 Esportazione ottimizzata per contenuti e cultura italiana
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
