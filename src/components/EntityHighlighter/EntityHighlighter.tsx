import React, { useState, useMemo } from 'react';
import { ItalianEntity, ItalianEntityType } from '@/types/entities';
import { useApplication } from '@/store/ApplicationStore';

interface EntityHighlighterProps {
  text: string;
  entities: ItalianEntity[];
  onEntityClick?: (entity: ItalianEntity) => void;
  highlightMode?: boolean;
  showTooltips?: boolean;
}

interface HighlightedSegment {
  text: string;
  entity?: ItalianEntity;
  isEntity: boolean;
}

const EntityHighlighter: React.FC<EntityHighlighterProps> = ({
  text,
  entities,
  onEntityClick,
  highlightMode = true,
  showTooltips = true,
}) => {
  const { selectEntity } = useApplication();
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Italian-specific entity type styling with better contrast
  const getItalianEntityStyle = (entity: ItalianEntity): string => {
    const baseClasses =
      'px-2 py-1 rounded-md font-medium cursor-pointer transition-all duration-200 hover:shadow-md border';

    const typeStyles: Record<string, string> = {
      [ItalianEntityType.PERSON]:
        'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      [ItalianEntityType.HISTORICAL_FIGURE]:
        'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
      [ItalianEntityType.POLITICIAN]:
        'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
      [ItalianEntityType.ARTIST]:
        'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      [ItalianEntityType.WRITER]:
        'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',

      [ItalianEntityType.ITALIAN_CITY]:
        'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      [ItalianEntityType.ITALIAN_REGION]:
        'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700',
      [ItalianEntityType.ITALIAN_PROVINCE]:
        'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
      [ItalianEntityType.LOCATION]:
        'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      [ItalianEntityType.MONUMENT]:
        'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
      [ItalianEntityType.LANDMARK]:
        'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
      [ItalianEntityType.PIAZZA]:
        'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',

      [ItalianEntityType.ORGANIZATION]:
        'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-700',
      [ItalianEntityType.COMPANY]:
        'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700',
      [ItalianEntityType.INSTITUTION]:
        'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
      [ItalianEntityType.POLITICAL_PARTY]:
        'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-700',
      [ItalianEntityType.UNIVERSITY]:
        'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      [ItalianEntityType.MUSEUM]:
        'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',

      [ItalianEntityType.DATE]:
        'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
      [ItalianEntityType.TIME]:
        'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
      [ItalianEntityType.PERIOD]:
        'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
      [ItalianEntityType.ITALIAN_HOLIDAY]:
        'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
      [ItalianEntityType.HISTORICAL_EVENT]:
        'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',

      [ItalianEntityType.CULTURAL_EVENT]:
        'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
      [ItalianEntityType.FESTIVAL]:
        'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-700',
      [ItalianEntityType.TRADITION]:
        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700',
      [ItalianEntityType.CUISINE]:
        'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',

      [ItalianEntityType.ITALIAN_BRAND]:
        'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
      [ItalianEntityType.ITALIAN_PRODUCT]:
        'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:border-stone-600',

      [ItalianEntityType.MONETARY]:
        'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:border-green-600',
      [ItalianEntityType.PERCENTAGE]:
        'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      [ItalianEntityType.NUMBER]:
        'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',

      [ItalianEntityType.MISCELLANEOUS]:
        'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
    };

    return `${baseClasses} ${typeStyles[entity.type] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}`;
  };

  // Get Italian label for entity type
  const getItalianEntityLabel = (type: ItalianEntityType): string => {
    const labels: Record<ItalianEntityType, string> = {
      [ItalianEntityType.PERSON]: 'Persona',
      [ItalianEntityType.HISTORICAL_FIGURE]: 'Figura Storica',
      [ItalianEntityType.POLITICIAN]: 'Politico',
      [ItalianEntityType.ARTIST]: 'Artista',
      [ItalianEntityType.WRITER]: 'Scrittore',
      [ItalianEntityType.SCIENTIST]: 'Scienziato',

      [ItalianEntityType.ORGANIZATION]: 'Organizzazione',
      [ItalianEntityType.COMPANY]: 'Azienda',
      [ItalianEntityType.INSTITUTION]: 'Istituzione',
      [ItalianEntityType.POLITICAL_PARTY]: 'Partito Politico',
      [ItalianEntityType.UNIVERSITY]: 'Università',
      [ItalianEntityType.MUSEUM]: 'Museo',

      [ItalianEntityType.LOCATION]: 'Luogo',
      [ItalianEntityType.ITALIAN_CITY]: 'Città Italiana',
      [ItalianEntityType.ITALIAN_REGION]: 'Regione Italiana',
      [ItalianEntityType.ITALIAN_PROVINCE]: 'Provincia Italiana',
      [ItalianEntityType.MONUMENT]: 'Monumento',
      [ItalianEntityType.LANDMARK]: 'Punto di Riferimento',
      [ItalianEntityType.PIAZZA]: 'Piazza',

      [ItalianEntityType.DATE]: 'Data',
      [ItalianEntityType.TIME]: 'Orario',
      [ItalianEntityType.PERIOD]: 'Periodo',
      [ItalianEntityType.ITALIAN_HOLIDAY]: 'Festività Italiana',
      [ItalianEntityType.HISTORICAL_EVENT]: 'Evento Storico',

      [ItalianEntityType.MONETARY]: 'Valore Monetario',
      [ItalianEntityType.PERCENTAGE]: 'Percentuale',
      [ItalianEntityType.NUMBER]: 'Numero',

      [ItalianEntityType.CULTURAL_EVENT]: 'Evento Culturale',
      [ItalianEntityType.FESTIVAL]: 'Festival',
      [ItalianEntityType.TRADITION]: 'Tradizione',
      [ItalianEntityType.CUISINE]: 'Cucina',

      [ItalianEntityType.ITALIAN_BRAND]: 'Marchio Italiano',
      [ItalianEntityType.ITALIAN_PRODUCT]: 'Prodotto Italiano',

      [ItalianEntityType.MISCELLANEOUS]: 'Altro',
    };

    return labels[type] || type;
  };

  // Create segments with proper React rendering
  const segments = useMemo((): HighlightedSegment[] => {
    if (!highlightMode || entities.length === 0) {
      return [{ text, isEntity: false }];
    }

    // Sort entities by start position
    const sortedEntities = [...entities].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    const segments: HighlightedSegment[] = [];
    let lastOffset = 0;

    sortedEntities.forEach(entity => {
      // Add text before entity
      if (entity.startOffset > lastOffset) {
        segments.push({
          text: text.substring(lastOffset, entity.startOffset),
          isEntity: false,
        });
      }

      // Add entity
      segments.push({
        text: text.substring(entity.startOffset, entity.endOffset),
        entity,
        isEntity: true,
      });

      lastOffset = entity.endOffset;
    });

    // Add remaining text
    if (lastOffset < text.length) {
      segments.push({
        text: text.substring(lastOffset),
        isEntity: false,
      });
    }

    return segments;
  }, [text, entities, highlightMode]);

  const handleEntityClick = (entity: ItalianEntity) => {
    if (onEntityClick) {
      onEntityClick(entity);
    } else {
      selectEntity(entity);
    }
  };

  if (!highlightMode || entities.length === 0) {
    return (
      <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">
        {text}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm relative">
      {segments.map((segment, index) => {
        if (!segment.isEntity) {
          return <span key={index}>{segment.text}</span>;
        }

        const entity = segment.entity!;
        const isHovered = hoveredEntity === entity.id;

        return (
          <span key={index} className="relative inline-block">
            <span
              className={getItalianEntityStyle(entity)}
              onClick={() => handleEntityClick(entity)}
              onMouseEnter={() => setHoveredEntity(entity.id)}
              onMouseLeave={() => setHoveredEntity(null)}
              data-entity-id={entity.id}
              data-entity-type={entity.type}
            >
              {segment.text}
            </span>

            {/* Italian tooltip */}
            {showTooltips && isHovered && (
              <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg min-w-48 max-w-64">
                <div className="font-semibold mb-1">{entity.text}</div>
                <div className="text-gray-300 mb-2">
                  {getItalianEntityLabel(entity.type)}
                </div>

                {/* Confidence */}
                <div className="text-gray-400 text-xs mb-2">
                  Confidenza: {Math.round(entity.confidence * 100)}%
                </div>

                {/* Italian metadata */}
                {entity.metadata && (
                  <div className="space-y-1 text-xs">
                    {entity.metadata.region && (
                      <div className="text-green-300">
                        📍 {entity.metadata.region}
                      </div>
                    )}
                    {entity.metadata.culturalContext && (
                      <div className="text-blue-300">
                        🏛️ {entity.metadata.culturalContext}
                      </div>
                    )}
                    {entity.metadata.historicalPeriod && (
                      <div className="text-purple-300">
                        📅 {entity.metadata.historicalPeriod}
                      </div>
                    )}
                    {entity.metadata.dialectalVariants &&
                      entity.metadata.dialectalVariants.length > 0 && (
                        <div className="text-yellow-300">
                          🗣️ Varianti:{' '}
                          {entity.metadata.dialectalVariants.join(', ')}
                        </div>
                      )}
                  </div>
                )}

                {/* External links */}
                {(entity.wikipediaUrl || entity.dbpediaUrl) && (
                  <div className="mt-2 pt-2 border-t border-gray-700 space-x-2">
                    {entity.wikipediaUrl && (
                      <a
                        href={entity.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        Wikipedia
                      </a>
                    )}
                    {entity.dbpediaUrl && (
                      <a
                        href={entity.dbpediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        DBpedia
                      </a>
                    )}
                  </div>
                )}

                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default EntityHighlighter;
