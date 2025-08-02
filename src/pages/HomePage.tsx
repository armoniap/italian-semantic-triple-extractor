import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, Zap, Shield, Download, BarChart3 } from 'lucide-react';
import { useApplication } from '@/store/ApplicationStore';

const HomePage: React.FC = () => {
  const { isApiKeyValid } = useApplication();

  const features = [
    {
      icon: Globe,
      title: 'Ottimizzato per l\'Italiano',
      description: 'Specializzato nel riconoscimento di entità italiane: luoghi, persone, istituzioni e cultura.'
    },
    {
      icon: Zap,
      title: 'AI Avanzata',
      description: 'Utilizza Google Gemini per analisi semantiche profonde e estrazione di triple RDF.'
    },
    {
      icon: Shield,
      title: 'Privacy e Sicurezza',
      description: 'Elaborazione client-side, API key criptate, nessun invio di dati a server esterni.'
    },
    {
      icon: Download,
      title: 'Export Multipli',
      description: 'Esporta risultati in JSON, CSV, RDF/Turtle per integrazione con altri sistemi.'
    },
    {
      icon: BarChart3,
      title: 'Analisi Avanzate',
      description: 'Statistiche dettagliate, grafi di relazioni e insights automatici sui dati estratti.'
    }
  ];

  const examples = [
    {
      title: 'Geografia Italiana',
      text: 'Milano è la capitale economica d\'Italia, situata in Lombardia.'
    },
    {
      title: 'Storia e Cultura',
      text: 'Leonardo da Vinci nacque a Vinci nel 1452 e dipinse la Gioconda.'
    },
    {
      title: 'Istituzioni',
      text: 'La Università Bocconi di Milano è famosa per i suoi corsi di economia.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex justify-center items-center mb-6">
          <Globe className="w-16 h-16 text-italian-green mr-4" />
          <div className="italian-accent w-16 h-2 rounded"></div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Italian Semantic Triple Extractor
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Strumento avanzato per l'estrazione automatica di entità e relazioni semantiche 
          da testo italiano utilizzando l'intelligenza artificiale di Google Gemini.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/analyze"
            className="btn-primary flex items-center space-x-2 px-6 py-3 text-lg"
          >
            <Search className="w-5 h-5" />
            <span>Inizia Analisi</span>
          </Link>
          
          {!isApiKeyValid && (
            <Link
              to="/settings"
              className="btn-secondary flex items-center space-x-2 px-6 py-3 text-lg"
            >
              <Shield className="w-5 h-5" />
              <span>Configura API</span>
            </Link>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {!isApiKeyValid && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Configurazione Richiesta
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                Per utilizzare il tool è necessario configurare una API key di Google Gemini.{' '}
                <Link to="/settings" className="font-medium underline">
                  Configura ora
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Caratteristiche Principali
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <Icon className="w-12 h-12 text-italian-green" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Examples */}
      <div className="py-12 bg-gray-50 rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Esempi di Utilizzo
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {examples.map((example, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {example.title}
              </h3>
              <div className="text-gray-600 italic mb-4">
                "{example.text}"
              </div>
              <div className="text-sm text-gray-500">
                Estrae automaticamente entità e relazioni semantiche
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Come Funziona
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-italian-green text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Inserisci il Testo</h3>
            <p className="text-gray-600 text-sm">
              Carica testo italiano o file Markdown
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-italian-green text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analisi AI</h3>
            <p className="text-gray-600 text-sm">
              Gemini estrae entità e relazioni
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-italian-green text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Visualizza</h3>
            <p className="text-gray-600 text-sm">
              Esplora risultati e grafi interattivi
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-italian-green text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              4
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Esporta</h3>
            <p className="text-gray-600 text-sm">
              Salva in formati standard (JSON, RDF, CSV)
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center py-12">
        <div className="bg-gradient-to-r from-italian-green to-green-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto per Iniziare?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Inizia subito ad estrarre entità e relazioni semantiche dai tuoi testi italiani
          </p>
          <Link
            to={isApiKeyValid ? "/analyze" : "/settings"}
            className="inline-flex items-center space-x-2 bg-white text-italian-green font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>{isApiKeyValid ? "Inizia Analisi" : "Configura API"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;