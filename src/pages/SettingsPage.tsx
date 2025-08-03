import React, { useState } from 'react';
import {
  Key,
  Palette,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApplication } from '@/store/ApplicationStore';
import { SecureStorage } from '@/utils/storage';

const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, isApiKeyValid, initializeServices } =
    useApplication();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'preferences' | 'data'>(
    'api'
  );

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      const success = await initializeServices(apiKey.trim());
      if (success) {
        setApiTestResult('success');
        setApiKey('');
      } else {
        setApiTestResult('error');
      }
    } catch (error) {
      setApiTestResult('error');
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Sei sicuro di voler rimuovere la API key?')) {
      SecureStorage.removeApiKey();
      setApiTestResult(null);
      window.location.reload();
    }
  };

  const handleExportData = () => {
    try {
      const data = SecureStorage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'italian-triple-extractor-data.json';
      link.click();
    } catch (error) {
      alert("Errore durante l'esportazione dei dati");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = event.target?.result as string;
        const success = SecureStorage.importData(data);
        if (success) {
          alert('Dati importati con successo!');
          window.location.reload();
        } else {
          alert("Errore durante l'importazione dei dati");
        }
      } catch (error) {
        alert('File non valido');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (
      confirm(
        'ATTENZIONE: Questa azione eliminerà tutti i dati salvati (API key, preferenze, cronologia). Continuare?'
      )
    ) {
      SecureStorage.clearAllData();
      alert('Tutti i dati sono stati eliminati');
      window.location.reload();
    }
  };

  const storageUsage = SecureStorage.getStorageUsage();

  const tabs = [
    { id: 'api' as const, label: 'API Key', icon: Key },
    { id: 'preferences' as const, label: 'Preferenze', icon: Palette },
    { id: 'data' as const, label: 'Gestione Dati', icon: Database },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Impostazioni</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-italian-green text-italian-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* API Key Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurazione Google Gemini API
            </h2>

            {/* Current status */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    isApiKeyValid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-medium">
                  {isApiKeyValid
                    ? 'API Key Configurata e Valida'
                    : 'API Key Non Configurata'}
                </span>
              </div>
            </div>

            {/* API Key form */}
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="api-key"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="api-key"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Inserisci la tua API key di Google Gemini"
                    className="form-input pr-12"
                    disabled={isTestingApi}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!apiKey.trim() || isTestingApi}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingApi ? 'Testando...' : 'Salva e Testa'}
                </button>

                {isApiKeyValid && (
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    className="btn-danger"
                  >
                    Rimuovi API Key
                  </button>
                )}
              </div>
            </form>

            {/* Test result */}
            {apiTestResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  apiTestResult === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {apiTestResult === 'success' ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  <span>
                    {apiTestResult === 'success'
                      ? 'API key configurata e salvata in modo sicuro! (Crittografata nel browser)'
                      : 'API key non valida. Verifica la chiave e riprova.'}
                  </span>
                </div>
              </div>
            )}

            {/* Help */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">
                    Come ottenere una API key di Google Gemini:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Vai su{' '}
                      <a
                        href="https://ai.google.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google AI Studio
                      </a>
                    </li>
                    <li>Accedi con il tuo account Google</li>
                    <li>Clicca su "Get API Key" e crea una nuova chiave</li>
                    <li>Copia la chiave e incollala qui sopra</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    La tua API key viene salvata in modo sicuro nel browser e
                    criptata.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Preferenze Applicazione
            </h2>

            <div className="space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lingua Interfaccia
                </label>
                <select
                  value={preferences.language}
                  onChange={e =>
                    updatePreferences({
                      language: e.target.value as 'it' | 'en',
                    })
                  }
                  className="form-input w-48"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema
                </label>
                <select
                  value={preferences.theme}
                  onChange={e =>
                    updatePreferences({ theme: e.target.value as any })
                  }
                  className="form-input w-48"
                >
                  <option value="light">Chiaro</option>
                  <option value="dark">Scuro</option>
                  <option value="auto">Automatico</option>
                </select>
              </div>

              {/* Confidence threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soglia Confidenza Minima:{' '}
                  {Math.round(preferences.minConfidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={preferences.minConfidence}
                  onChange={e =>
                    updatePreferences({
                      minConfidence: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Le entità con confidenza inferiore verranno filtrate
                </div>
              </div>

              {/* Max entities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero Massimo Entità
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={preferences.maxEntities}
                  onChange={e =>
                    updatePreferences({ maxEntities: parseInt(e.target.value) })
                  }
                  className="form-input w-24"
                />
              </div>

              {/* Export format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato Export Predefinito
                </label>
                <select
                  value={preferences.exportFormat}
                  onChange={e =>
                    updatePreferences({ exportFormat: e.target.value as any })
                  }
                  className="form-input w-48"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="rdf">RDF/XML</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.enableCache}
                    onChange={e =>
                      updatePreferences({ enableCache: e.target.checked })
                    }
                    className="rounded border-gray-300 text-italian-green focus:ring-italian-green"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Abilita cache dei risultati
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={e =>
                      updatePreferences({ autoSave: e.target.checked })
                    }
                    className="rounded border-gray-300 text-italian-green focus:ring-italian-green"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Salva automaticamente nella cronologia
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={e =>
                      updatePreferences({ notifications: e.target.checked })
                    }
                    className="rounded border-gray-300 text-italian-green focus:ring-italian-green"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Mostra notifiche di completamento
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Storage usage */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Utilizzo Storage
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>API Key:</span>
                <span>{(storageUsage.apiKey / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Preferenze:</span>
                <span>{(storageUsage.preferences / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cronologia:</span>
                <span>{(storageUsage.history / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache:</span>
                <span>{(storageUsage.cache / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Totale:</span>
                <span>{(storageUsage.total / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>

          {/* Data management actions */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gestione Dati
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Esporta Dati</h3>
                  <p className="text-sm text-gray-600">
                    Salva preferenze e cronologia in un file JSON
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Esporta</span>
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Importa Dati</h3>
                  <p className="text-sm text-gray-600">
                    Ripristina dati da un file di backup
                  </p>
                </div>
                <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
                  <Download className="w-4 h-4 transform rotate-180" />
                  <span>Importa</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Pulisci Cache</h3>
                  <p className="text-sm text-gray-600">
                    Rimuovi risultati analisi cachati
                  </p>
                </div>
                <button
                  onClick={() => {
                    SecureStorage.clearCache();
                    alert('Cache pulita con successo');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Pulisci</span>
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900 text-red-700">
                    Elimina Tutti i Dati
                  </h3>
                  <p className="text-sm text-gray-600">
                    ATTENZIONE: Rimuove tutto (API key, preferenze, cronologia)
                  </p>
                </div>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina Tutto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
