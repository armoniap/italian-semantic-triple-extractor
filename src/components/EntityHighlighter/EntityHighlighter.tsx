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

  // Completely redesigned entity styling for dark theme
  const getModernEntityStyle = (entity: ItalianEntity): string => {
    const baseClasses =
      'inline-flex items-center px-2 py-1 mx-0.5 my-0.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 border';

    // Modern, accessible color scheme that works in both light and dark
    const typeStyles: Record<string, string> = {
      // People - Blue family
      [ItalianEntityType.PERSON]:
        'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-400/30 dark:hover:bg-blue-400/30',
      [ItalianEntityType.HISTORICAL_FIGURE]:
        'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20 dark:bg-indigo-400/20 dark:text-indigo-300 dark:border-indigo-400/30 dark:hover:bg-indigo-400/30',
      [ItalianEntityType.POLITICIAN]:
        'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 dark:bg-red-400/20 dark:text-red-300 dark:border-red-400/30 dark:hover:bg-red-400/30',
      [ItalianEntityType.ARTIST]:
        'bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300 dark:border-purple-400/30 dark:hover:bg-purple-400/30',
      [ItalianEntityType.WRITER]:
        'bg-pink-500/10 text-pink-700 border-pink-500/20 hover:bg-pink-500/20 dark:bg-pink-400/20 dark:text-pink-300 dark:border-pink-400/30 dark:hover:bg-pink-400/30',

      // Places - Green family
      [ItalianEntityType.ITALIAN_CITY]:
        'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/30 dark:hover:bg-emerald-400/30',
      [ItalianEntityType.ITALIAN_REGION]:
        'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:bg-green-400/20 dark:text-green-300 dark:border-green-400/30 dark:hover:bg-green-400/30',
      [ItalianEntityType.ITALIAN_PROVINCE]:
        'bg-teal-500/10 text-teal-700 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/30 dark:hover:bg-teal-400/30',
      [ItalianEntityType.LOCATION]:
        'bg-lime-500/10 text-lime-700 border-lime-500/20 hover:bg-lime-500/20 dark:bg-lime-400/20 dark:text-lime-300 dark:border-lime-400/30 dark:hover:bg-lime-400/30',
      [ItalianEntityType.MONUMENT]:
        'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30 dark:hover:bg-amber-400/30',
      [ItalianEntityType.LANDMARK]:
        'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 dark:bg-orange-400/20 dark:text-orange-300 dark:border-orange-400/30 dark:hover:bg-orange-400/30',
      [ItalianEntityType.PIAZZA]:
        'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 dark:bg-yellow-400/20 dark:text-yellow-300 dark:border-yellow-400/30 dark:hover:bg-yellow-400/30',

      // Organizations - Purple/Violet family
      [ItalianEntityType.ORGANIZATION]:
        'bg-violet-500/10 text-violet-700 border-violet-500/20 hover:bg-violet-500/20 dark:bg-violet-400/20 dark:text-violet-300 dark:border-violet-400/30 dark:hover:bg-violet-400/30',
      [ItalianEntityType.COMPANY]:
        'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300 dark:border-cyan-400/30 dark:hover:bg-cyan-400/30',
      [ItalianEntityType.INSTITUTION]:
        'bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 dark:bg-slate-400/20 dark:text-slate-300 dark:border-slate-400/30 dark:hover:bg-slate-400/30',
      [ItalianEntityType.POLITICAL_PARTY]:
        'bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300 dark:border-rose-400/30 dark:hover:bg-rose-400/30',
      [ItalianEntityType.UNIVERSITY]:
        'bg-sky-500/10 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 dark:bg-sky-400/20 dark:text-sky-300 dark:border-sky-400/30 dark:hover:bg-sky-400/30',
      [ItalianEntityType.MUSEUM]:
        'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 hover:bg-fuchsia-500/20 dark:bg-fuchsia-400/20 dark:text-fuchsia-300 dark:border-fuchsia-400/30 dark:hover:bg-fuchsia-400/30',

      // Time/Events - Orange family
      [ItalianEntityType.DATE]:
        'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 dark:bg-orange-400/20 dark:text-orange-300 dark:border-orange-400/30 dark:hover:bg-orange-400/30',
      [ItalianEntityType.TIME]:
        'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30 dark:hover:bg-amber-400/30',
      [ItalianEntityType.PERIOD]:
        'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20 dark:bg-yellow-400/20 dark:text-yellow-300 dark:border-yellow-400/30 dark:hover:bg-yellow-400/30',
      [ItalianEntityType.ITALIAN_HOLIDAY]:
        'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 dark:bg-red-400/20 dark:text-red-300 dark:border-red-400/30 dark:hover:bg-red-400/30',
      [ItalianEntityType.HISTORICAL_EVENT]:
        'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20 dark:bg-indigo-400/20 dark:text-indigo-300 dark:border-indigo-400/30 dark:hover:bg-indigo-400/30',

      // Culture - Pink/Purple family
      [ItalianEntityType.CULTURAL_EVENT]:
        'bg-pink-500/10 text-pink-700 border-pink-500/20 hover:bg-pink-500/20 dark:bg-pink-400/20 dark:text-pink-300 dark:border-pink-400/30 dark:hover:bg-pink-400/30',
      [ItalianEntityType.FESTIVAL]:
        'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 hover:bg-fuchsia-500/20 dark:bg-fuchsia-400/20 dark:text-fuchsia-300 dark:border-fuchsia-400/30 dark:hover:bg-fuchsia-400/30',
      [ItalianEntityType.TRADITION]:
        'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/30 dark:hover:bg-emerald-400/30',
      [ItalianEntityType.CUISINE]:
        'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 dark:bg-orange-400/20 dark:text-orange-300 dark:border-orange-400/30 dark:hover:bg-orange-400/30',

      // Commercial - Gray family
      [ItalianEntityType.ITALIAN_BRAND]:
        'bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20 dark:bg-gray-400/20 dark:text-gray-300 dark:border-gray-400/30 dark:hover:bg-gray-400/30',
      [ItalianEntityType.ITALIAN_PRODUCT]:
        'bg-stone-500/10 text-stone-700 border-stone-500/20 hover:bg-stone-500/20 dark:bg-stone-400/20 dark:text-stone-300 dark:border-stone-400/30 dark:hover:bg-stone-400/30',

      // Numbers - Blue/Green family
      [ItalianEntityType.MONETARY]:
        'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:bg-green-400/20 dark:text-green-300 dark:border-green-400/30 dark:hover:bg-green-400/30',
      [ItalianEntityType.PERCENTAGE]:
        'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-400/30 dark:hover:bg-blue-400/30',
      [ItalianEntityType.NUMBER]:
        'bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 dark:bg-slate-400/20 dark:text-slate-300 dark:border-slate-400/30 dark:hover:bg-slate-400/30',

      // Misc
      [ItalianEntityType.MISCELLANEOUS]:
        'bg-neutral-500/10 text-neutral-700 border-neutral-500/20 hover:bg-neutral-500/20 dark:bg-neutral-400/20 dark:text-neutral-300 dark:border-neutral-400/30 dark:hover:bg-neutral-400/30',
    };

    return `${baseClasses} ${typeStyles[entity.type] || 'bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20 dark:bg-gray-400/20 dark:text-gray-300 dark:border-gray-400/30 dark:hover:bg-gray-400/30'}`;
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
      <div className="whitespace-pre-wrap leading-loose font-mono text-sm text-gray-900 dark:text-gray-100">
        {text}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-loose font-mono text-sm text-gray-900 dark:text-gray-100 relative">
      {segments.map((segment, index) => {
        if (!segment.isEntity) {
          return <span key={index}>{segment.text}</span>;
        }

        const entity = segment.entity!;
        const isHovered = hoveredEntity === entity.id;

        return (
          <span key={index} className="relative inline-block">
            <span
              className={getModernEntityStyle(entity)}
              onClick={() => handleEntityClick(entity)}
              onMouseEnter={() => setHoveredEntity(entity.id)}
              onMouseLeave={() => setHoveredEntity(null)}
              data-entity-id={entity.id}
              data-entity-type={entity.type}
            >
              {segment.text}
            </span>

            {/* Modern tooltip */}
            {showTooltips && isHovered && (
              <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl min-w-64 max-w-80">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {entity.text}
                    </div>
                    <div className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                      {Math.round(entity.confidence * 100)}%
                    </div>
                  </div>

                  {/* Type */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getItalianEntityLabel(entity.type)}
                  </div>

                  {/* Italian metadata */}
                  {entity.metadata && (
                    <div className="space-y-2 text-xs">
                      {entity.metadata.region && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <span className="mr-1">📍</span>
                          <span>{entity.metadata.region}</span>
                        </div>
                      )}
                      {entity.metadata.culturalContext && (
                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                          <span className="mr-1">🏛️</span>
                          <span>{entity.metadata.culturalContext}</span>
                        </div>
                      )}
                      {entity.metadata.historicalPeriod && (
                        <div className="flex items-center text-purple-600 dark:text-purple-400">
                          <span className="mr-1">📅</span>
                          <span>{entity.metadata.historicalPeriod}</span>
                        </div>
                      )}
                      {entity.metadata.dialectalVariants &&
                        entity.metadata.dialectalVariants.length > 0 && (
                          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                            <span className="mr-1">🗣️</span>
                            <span>
                              Varianti:{' '}
                              {entity.metadata.dialectalVariants.join(', ')}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* External links */}
                  {(entity.wikipediaUrl || entity.dbpediaUrl) && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex space-x-3">
                      {entity.wikipediaUrl && (
                        <a
                          href={entity.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          Wikipedia →
                        </a>
                      )}
                      {entity.dbpediaUrl && (
                        <a
                          href={entity.dbpediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          DBpedia →
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default EntityHighlighter;
