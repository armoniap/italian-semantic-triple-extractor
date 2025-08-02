import React, { useMemo } from 'react';
import { TripleAnalytics } from '@/types/triples';
import {
  BarChart3,
  Users,
  Network,
  TrendingUp,
  MapPin,
  Globe,
  Award,
  Calendar,
} from 'lucide-react';

interface AnalyticsPanelProps {
  analytics: TripleAnalytics;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics }) => {
  // Prepare data for visualizations
  const topEntities = Object.entries(analytics.entityFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topPredicates = Object.entries(analytics.predicateFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Italian-specific analytics
  const italianAnalytics = useMemo(() => {
    const entityNames = Object.keys(analytics.entityFrequency);

    // Detect Italian regions
    const italianRegions = entityNames.filter(name =>
      /\b(Lazio|Lombardia|Campania|Sicilia|Veneto|Piemonte|Puglia|Emilia-Romagna|Toscana|Calabria|Sardegna|Liguria|Marche|Abruzzo|Friuli-Venezia|Umbria|Basilicata|Molise|Valle|Trentino)\b/i.test(
        name
      )
    );

    // Detect Italian cities
    const italianCities = entityNames.filter(name =>
      /\b(Roma|Milano|Napoli|Torino|Palermo|Genova|Bologna|Firenze|Bari|Catania|Venezia|Verona|Messina|Padova|Trieste|Brescia|Prato|Taranto|Modena|Reggio|Parma|Perugia|Livorno|Cagliari|Foggia|Rimini|Salerno|Ferrara|Sassari|Monza|Siracusa|Pescara|Bergamo|Forlì|Trento|Vicenza|Terni|Bolzano|Novara|Piacenza|Ancona|Andria|Arezzo|Udine|Cesena|Lecce|Como|Ravenna|Brindisi|Varese|Matera|Trapani|Asti|Campobasso|L'Aquila|Cremona|Massa|Carrara|Potenza|Cosenza|Lecco|Mantova|Caltanissetta|Agrigento|Ragusa|Pistoia|Cuneo|Savona|Imperia|Latina|Frosinone|Viterbo|Rieti|Tivoli|Guidonia|Pomezia|Aprilia|Civitavecchia|Anzio|Nettuno|Genzano|Albano|Ariccia|Marino|Castel|Velletri|Colleferro|Ciampino|Zagarolo|Palestrina|Subiaco|Tivoli)\b/i.test(
        name
      )
    );

    // Detect cultural terms
    const culturalTerms = entityNames.filter(name =>
      /\b(pasta|pizza|risotto|gelato|espresso|cappuccino|lasagne|gnocchi|carbonara|amatriciana|parmigiana|tiramisù|cannoli|panettone|prosecco|chianti|barolo|parmigiano|mozzarella|prosciutto|mortadella|salame|bresaola|gorgonzola|pecorino|basilica|duomo|palazzo|castello|teatro|museo|fontana|ponte|piazza|corso|via|viale)\b/i.test(
        name
      )
    );

    // Detect historical figures
    const historicalFigures = entityNames.filter(name =>
      /\b(Dante|Petrarca|Boccaccio|Leonardo|Michelangelo|Raffaello|Caravaggio|Botticelli|Donatello|Brunelleschi|Bramante|Bernini|Borromini|Galileo|Volta|Marconi|Fermi|Garibaldi|Cavour|Mazzini|Vittorio|Emanuele|Umberto|Margherita|Napoleone|Cesare|Augusto|Traiano|Marco|Aurelio|Costantino|Francesco|Giuseppe|Verdi|Puccini|Rossini|Vivaldi|Pavarotti|Toscanini)\b/i.test(
        name
      )
    );

    // Calculate percentages
    const totalEntities = entityNames.length;

    return {
      regions: italianRegions,
      cities: italianCities,
      cultural: culturalTerms,
      historical: historicalFigures,
      percentages: {
        regions: totalEntities
          ? Math.round((italianRegions.length / totalEntities) * 100)
          : 0,
        cities: totalEntities
          ? Math.round((italianCities.length / totalEntities) * 100)
          : 0,
        cultural: totalEntities
          ? Math.round((culturalTerms.length / totalEntities) * 100)
          : 0,
        historical: totalEntities
          ? Math.round((historicalFigures.length / totalEntities) * 100)
          : 0,
      },
    };
  }, [analytics.entityFrequency]);

  // Cultural insights
  const culturalInsights = useMemo(() => {
    const insights = [];

    if (italianAnalytics.percentages.regions > 20) {
      insights.push({
        icon: '🗺️',
        text: `Forte presenza geografica italiana (${italianAnalytics.percentages.regions}% delle entità sono regioni)`,
        type: 'geographic',
      });
    }

    if (italianAnalytics.percentages.cities > 30) {
      insights.push({
        icon: '🏛️',
        text: `Concentrazione urbana significativa (${italianAnalytics.percentages.cities}% delle entità sono città italiane)`,
        type: 'urban',
      });
    }

    if (italianAnalytics.percentages.cultural > 15) {
      insights.push({
        icon: '🍝',
        text: `Ricco contenuto culturale italiano (${italianAnalytics.percentages.cultural}% riferimenti culturali)`,
        type: 'cultural',
      });
    }

    if (italianAnalytics.percentages.historical > 10) {
      insights.push({
        icon: '👑',
        text: `Importanti riferimenti storici (${italianAnalytics.percentages.historical}% figure storiche italiane)`,
        type: 'historical',
      });
    }

    if (analytics.dominantRelationType === 'LOCATED_IN') {
      insights.push({
        icon: '📍',
        text: 'Il testo si concentra su relazioni geografiche e di localizzazione',
        type: 'spatial',
      });
    }

    if (analytics.dominantRelationType === 'BORN_IN') {
      insights.push({
        icon: '👤',
        text: 'Prevalenza di informazioni biografiche e anagrafiche',
        type: 'biographical',
      });
    }

    // Regional distribution insight
    if (italianAnalytics.regions.length > 3) {
      insights.push({
        icon: '🇮🇹',
        text: `Copertura geografica nazionale (${italianAnalytics.regions.length} regioni identificate)`,
        type: 'national',
      });
    }

    return insights;
  }, [analytics, italianAnalytics]);

  const getPredicateLabel = (type: string): string => {
    const labels: Record<string, string> = {
      LOCATED_IN: 'Si trova in',
      BORN_IN: 'Nato in',
      FOUNDED: 'Ha fondato',
      CREATED: 'Ha creato',
      MAYOR_OF: 'Sindaco di',
      CAPITAL_OF: 'Capitale di',
      MEMBER_OF: 'Membro di',
      WORKS_FOR: 'Lavora per',
    };
    return labels[type] || type.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">
                Triple Totali
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.totalTriples}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">
                Entità Uniche
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.uniqueEntities}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">
                Confidenza Media
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.averageConfidence * 100)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500">
                Relazione Principale
              </div>
              <div className="text-sm font-bold text-gray-900">
                {getPredicateLabel(analytics.dominantRelationType)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Italian Cultural Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <div className="text-sm font-medium text-green-800">
                Regioni Italiane
              </div>
              <div className="text-xl font-bold text-green-900">
                {italianAnalytics.regions.length}
              </div>
              <div className="text-xs text-green-600">
                {italianAnalytics.percentages.regions}% del totale
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Globe className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <div className="text-sm font-medium text-blue-800">
                Città Italiane
              </div>
              <div className="text-xl font-bold text-blue-900">
                {italianAnalytics.cities.length}
              </div>
              <div className="text-xs text-blue-600">
                {italianAnalytics.percentages.cities}% del totale
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <Award className="h-6 w-6 text-orange-600" />
            <div className="ml-3">
              <div className="text-sm font-medium text-orange-800">
                Cultura Italiana
              </div>
              <div className="text-xl font-bold text-orange-900">
                {italianAnalytics.cultural.length}
              </div>
              <div className="text-xs text-orange-600">
                {italianAnalytics.percentages.cultural}% del totale
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <div className="text-sm font-medium text-purple-800">
                Figure Storiche
              </div>
              <div className="text-xl font-bold text-purple-900">
                {italianAnalytics.historical.length}
              </div>
              <div className="text-xs text-purple-600">
                {italianAnalytics.percentages.historical}% del totale
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top entities */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Entità Più Frequenti
          </h4>

          <div className="space-y-3">
            {topEntities.map(([entity, count], index) => {
              const percentage =
                (count / Math.max(...topEntities.map(([, c]) => c))) * 100;

              return (
                <div key={entity} className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {index + 1}. {entity}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-3 text-sm text-gray-500">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top predicates */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2 text-green-600" />
            Relazioni Più Comuni
          </h4>

          <div className="space-y-3">
            {topPredicates.map(([predicate, count], index) => {
              const percentage =
                (count / Math.max(...topPredicates.map(([, c]) => c))) * 100;

              return (
                <div key={predicate} className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {index + 1}. {getPredicateLabel(predicate)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-3 text-sm text-gray-500">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed analysis */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          Analisi Dettagliata
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Entità Più Connessa
            </h5>
            <div className="text-lg font-bold text-gray-900">
              {analytics.mostConnectedEntity || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {analytics.entityFrequency[analytics.mostConnectedEntity] || 0}{' '}
              connessioni
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Tipo di Relazione Dominante
            </h5>
            <div className="text-lg font-bold text-gray-900">
              {getPredicateLabel(analytics.dominantRelationType)}
            </div>
            <div className="text-sm text-gray-500">
              {analytics.predicateFrequency[analytics.dominantRelationType] ||
                0}{' '}
              occorrenze
            </div>
          </div>
        </div>
      </div>

      {/* Italian Cultural Insights */}
      <div className="bg-gradient-to-r from-green-50 via-white to-red-50 border-2 border-italian-green rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🇮🇹</span>
          Insights Culturali Italiani
        </h4>

        {culturalInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {culturalInsights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border"
              >
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{insight.text}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      insight.type === 'geographic'
                        ? 'bg-green-100 text-green-700'
                        : insight.type === 'cultural'
                          ? 'bg-orange-100 text-orange-700'
                          : insight.type === 'historical'
                            ? 'bg-purple-100 text-purple-700'
                            : insight.type === 'urban'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {insight.type === 'geographic'
                      ? 'Geografia'
                      : insight.type === 'cultural'
                        ? 'Cultura'
                        : insight.type === 'historical'
                          ? 'Storia'
                          : insight.type === 'urban'
                            ? 'Urbanistica'
                            : insight.type === 'national'
                              ? 'Nazionale'
                              : insight.type === 'spatial'
                                ? 'Spaziale'
                                : insight.type === 'biographical'
                                  ? 'Biografico'
                                  : 'Generale'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">
              🤔 Aggiungi più contenuto italiano per insights culturali più
              dettagliati
            </p>
          </div>
        )}

        {/* Traditional insights */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="font-medium text-gray-700 mb-3">Insights Generali:</h5>
          <div className="space-y-2 text-sm text-gray-600">
            {analytics.totalTriples > 10 && (
              <div>
                • Il testo contiene un numero significativo di relazioni
                semantiche ({analytics.totalTriples} triple)
              </div>
            )}

            {analytics.averageConfidence > 0.8 && (
              <div>
                • L'analisi ha prodotto risultati ad alta confidenza (
                {Math.round(analytics.averageConfidence * 100)}%)
              </div>
            )}

            {analytics.uniqueEntities > analytics.totalTriples * 0.6 && (
              <div>
                • Il testo presenta una buona diversità di entità (
                {analytics.uniqueEntities} entità uniche)
              </div>
            )}

            {Object.keys(analytics.entityFrequency).length > 0 && (
              <div>
                • L'entità "{analytics.mostConnectedEntity}" sembra essere
                centrale nel testo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional Distribution */}
      {italianAnalytics.regions.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
            Distribuzione Geografica Italiana
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Regions */}
            {italianAnalytics.regions.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  Regioni ({italianAnalytics.regions.length}):
                </h5>
                <div className="space-y-1">
                  {italianAnalytics.regions.slice(0, 5).map((region, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 flex items-center"
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {region}
                    </div>
                  ))}
                  {italianAnalytics.regions.length > 5 && (
                    <div className="text-xs text-gray-500">
                      +{italianAnalytics.regions.length - 5} altre...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cities */}
            {italianAnalytics.cities.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  Città ({italianAnalytics.cities.length}):
                </h5>
                <div className="space-y-1">
                  {italianAnalytics.cities.slice(0, 5).map((city, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 flex items-center"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {city}
                    </div>
                  ))}
                  {italianAnalytics.cities.length > 5 && (
                    <div className="text-xs text-gray-500">
                      +{italianAnalytics.cities.length - 5} altre...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cultural terms */}
            {italianAnalytics.cultural.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  Cultura ({italianAnalytics.cultural.length}):
                </h5>
                <div className="space-y-1">
                  {italianAnalytics.cultural.slice(0, 5).map((term, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 flex items-center"
                    >
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      {term}
                    </div>
                  ))}
                  {italianAnalytics.cultural.length > 5 && (
                    <div className="text-xs text-gray-500">
                      +{italianAnalytics.cultural.length - 5} altri...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
