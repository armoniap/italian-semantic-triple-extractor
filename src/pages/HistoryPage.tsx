import React, { useState, useMemo } from 'react';
import { SecureStorage, AnalysisHistoryItem } from '@/utils/storage';
import { Trash2, Clock, FileText, Download, Search, Calendar, MapPin, Users, TrendingUp, Flag } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(
    SecureStorage.getAnalysisHistory()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'stats'>('list');

  const handleClearHistory = () => {
    if (confirm('Sei sicuro di voler cancellare tutta la cronologia?')) {
      SecureStorage.clearAnalysisHistory();
      setHistory([]);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    // Update storage
    localStorage.setItem('analysis_history', JSON.stringify(updatedHistory));
  };

  const filteredHistory = history.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  // Italian analytics for history
  const italianHistoryAnalytics = useMemo(() => {
    const analytics = {
      totalAnalyses: history.length,
      totalEntities: history.reduce((sum, item) => sum + item.entitiesCount, 0),
      totalTriples: history.reduce((sum, item) => sum + item.triplesCount, 0),
      averageConfidence: history.length > 0 ? history.reduce((sum, item) => sum + item.confidence, 0) / history.length : 0,
      timeSpan: {
        start: history.length > 0 ? Math.min(...history.map(item => item.timestamp)) : 0,
        end: history.length > 0 ? Math.max(...history.map(item => item.timestamp)) : 0
      },
      monthlyDistribution: {} as Record<string, number>,
      averageProcessingTime: history.length > 0 ? history.reduce((sum, item) => sum + item.processingTime, 0) / history.length : 0,
      qualityDistribution: {
        high: history.filter(item => item.confidence > 0.8).length,
        medium: history.filter(item => item.confidence >= 0.6 && item.confidence <= 0.8).length,
        low: history.filter(item => item.confidence < 0.6).length
      }
    };
    
    // Group by month for timeline
    history.forEach(item => {
      const date = new Date(item.timestamp);
      const monthKey = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
      analytics.monthlyDistribution[monthKey] = (analytics.monthlyDistribution[monthKey] || 0) + 1;
    });
    
    return analytics;
  }, [history]);
  
  // Group history by time periods for timeline view
  const timelineGroups = useMemo(() => {
    const groups: Record<string, AnalysisHistoryItem[]> = {};
    
    history.forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Oggi';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Ieri';
      } else if (date > weekAgo) {
        groupKey = 'Questa settimana';
      } else {
        groupKey = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    // Sort groups by most recent first
    const sortedGroups: [string, AnalysisHistoryItem[]][] = Object.entries(groups).sort((a, b) => {
      const orderMap: Record<string, number> = {
        'Oggi': 0,
        'Ieri': 1,
        'Questa settimana': 2
      };
      
      const aOrder = orderMap[a[0]] ?? 999;
      const bOrder = orderMap[b[0]] ?? 999;
      
      if (aOrder !== 999 && bOrder !== 999) {
        return aOrder - bOrder;
      }
      
      if (aOrder !== 999) return -1;
      if (bOrder !== 999) return 1;
      
      // For month groups, sort by date
      return b[0].localeCompare(a[0]);
    });
    
    return sortedGroups;
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Clock className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nessuna cronologia
          </h3>
          <p className="mt-2 text-gray-600">
            Le analisi effettuate verranno salvate automaticamente qui.
          </p>
          <div className="mt-6">
            <a
              href="/analyze"
              className="btn-primary"
            >
              Inizia Prima Analisi
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Flag className="w-6 h-6 mr-3 text-italian-green" />
            Cronologia Analisi Italiana
          </h1>
          <p className="text-gray-600 mt-1">
            {history.length} {history.length === 1 ? 'analisi salvata' : 'analisi salvate'}
            {italianHistoryAnalytics.timeSpan.start > 0 && (
              <span className="ml-2">
                • Dal {formatDate(italianHistoryAnalytics.timeSpan.start)}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View mode selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'timeline' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'stats' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              Statistiche
            </button>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="btn-danger flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Pulisci Tutto</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca nelle analisi..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-italian-green to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm opacity-90">Analisi Totali</div>
              <div className="text-2xl font-bold">{italianHistoryAnalytics.totalAnalyses}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm opacity-90">Entità Estratte</div>
              <div className="text-2xl font-bold">{italianHistoryAnalytics.totalEntities}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm opacity-90">Triple Estratte</div>
              <div className="text-2xl font-bold">{italianHistoryAnalytics.totalTriples}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm opacity-90">Confidenza Media</div>
              <div className="text-2xl font-bold">
                {Math.round(italianHistoryAnalytics.averageConfidence * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <div>
              <div className="text-sm opacity-90">Tempo Medio</div>
              <div className="text-2xl font-bold">
                {formatDuration(italianHistoryAnalytics.averageProcessingTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-5 h-5 text-italian-green flex-shrink-0" />
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.title || `Analisi ${item.id.slice(-8)}`}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Lunghezza:</span>
                      <div className="font-medium">{item.textLength} caratteri</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Entità:</span>
                      <div className="font-medium text-blue-600">{item.entitiesCount}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Triple:</span>
                      <div className="font-medium text-green-600">{item.triplesCount}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Confidenza:</span>
                      <div className="font-medium text-purple-600">
                        {Math.round(item.confidence * 100)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Tempo:</span>
                      <div className="font-medium">{formatDuration(item.processingTime)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Enhanced progress bar for confidence */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Qualità Analisi Italiana</span>
                  <span>{Math.round(item.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.confidence > 0.8 ? 'bg-italian-green' :
                      item.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {timelineGroups.map(([groupName, groupItems]) => (
            <div key={groupName} className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-italian-green opacity-30"></div>
              
              {/* Group header */}
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-italian-green rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">{groupName}</h3>
                <span className="ml-2 text-sm text-gray-500">({groupItems.length} analisi)</span>
              </div>
              
              {/* Timeline items */}
              <div className="ml-12 space-y-4">
                {groupItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {item.title || `Analisi ${item.id.slice(-8)}`}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{item.entitiesCount} entità</span>
                      <span>{item.triplesCount} triple</span>
                      <span className={`font-medium ${
                        item.confidence > 0.8 ? 'text-green-600' :
                        item.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(item.confidence * 100)}% qualità
                      </span>
                      <span>{formatDuration(item.processingTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Statistics View */}
      {viewMode === 'stats' && (
        <div className="space-y-6">
          {/* Quality distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Qualità</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {italianHistoryAnalytics.qualityDistribution.high}
                </div>
                <div className="text-sm text-green-700">Alta Qualità (&gt;80%)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {italianHistoryAnalytics.qualityDistribution.medium}
                </div>
                <div className="text-sm text-yellow-700">Media Qualità (60-80%)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {italianHistoryAnalytics.qualityDistribution.low}
                </div>
                <div className="text-sm text-red-700">Bassa Qualità (&lt;60%)</div>
              </div>
            </div>
          </div>
          
          {/* Monthly distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Mensile</h3>
            <div className="space-y-3">
              {Object.entries(italianHistoryAnalytics.monthlyDistribution)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-gray-700">{month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-italian-green h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...Object.values(italianHistoryAnalytics.monthlyDistribution))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredHistory.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nessun risultato
          </h3>
          <p className="mt-2 text-gray-600">
            Nessuna analisi corrisponde alla ricerca "{searchTerm}"
          </p>
        </div>
      )}

      {/* Export options */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Opzioni di Esportazione
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(history, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'cronologia-analisi.json';
              link.click();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Esporta JSON</span>
          </button>
          
          <button
            onClick={() => {
              const csvContent = [
                'Data,Titolo,Caratteri,Entità,Triple,Confidenza,Tempo',
                ...history.map(item => [
                  formatDate(item.timestamp),
                  item.title?.replace(/,/g, ';') || 'Senza titolo',
                  item.textLength,
                  item.entitiesCount,
                  item.triplesCount,
                  Math.round(item.confidence * 100) + '%',
                  formatDuration(item.processingTime)
                ].join(','))
              ].join('\n');
              
              const dataBlob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'cronologia-analisi.csv';
              link.click();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;