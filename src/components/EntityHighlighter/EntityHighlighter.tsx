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
  showTooltips = true
}) => {
  const { selectEntity } = useApplication();
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Italian-specific entity type styling
  const getItalianEntityStyle = (entity: ItalianEntity): string => {
    const baseClasses = 'px-1.5 py-0.5 rounded-md text-white font-medium cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105';
    
    const typeStyles: Record<string, string> = {
      [ItalianEntityType.PERSON]: 'bg-blue-600 hover:bg-blue-700',
      [ItalianEntityType.HISTORICAL_FIGURE]: 'bg-indigo-600 hover:bg-indigo-700',
      [ItalianEntityType.POLITICIAN]: 'bg-red-600 hover:bg-red-700',
      [ItalianEntityType.ARTIST]: 'bg-purple-600 hover:bg-purple-700',
      [ItalianEntityType.WRITER]: 'bg-pink-600 hover:bg-pink-700',
      
      [ItalianEntityType.ITALIAN_CITY]: 'bg-green-600 hover:bg-green-700',
      [ItalianEntityType.ITALIAN_REGION]: 'bg-emerald-600 hover:bg-emerald-700',
      [ItalianEntityType.ITALIAN_PROVINCE]: 'bg-teal-600 hover:bg-teal-700',
      [ItalianEntityType.LOCATION]: 'bg-green-500 hover:bg-green-600',
      [ItalianEntityType.MONUMENT]: 'bg-amber-600 hover:bg-amber-700',
      [ItalianEntityType.LANDMARK]: 'bg-orange-600 hover:bg-orange-700',
      [ItalianEntityType.PIAZZA]: 'bg-yellow-600 hover:bg-yellow-700',
      
      [ItalianEntityType.ORGANIZATION]: 'bg-violet-600 hover:bg-violet-700',
      [ItalianEntityType.COMPANY]: 'bg-cyan-600 hover:bg-cyan-700',
      [ItalianEntityType.INSTITUTION]: 'bg-slate-600 hover:bg-slate-700',
      [ItalianEntityType.POLITICAL_PARTY]: 'bg-rose-600 hover:bg-rose-700',
      [ItalianEntityType.UNIVERSITY]: 'bg-blue-500 hover:bg-blue-600',
      [ItalianEntityType.MUSEUM]: 'bg-purple-500 hover:bg-purple-600',
      
      [ItalianEntityType.DATE]: 'bg-orange-500 hover:bg-orange-600',
      [ItalianEntityType.TIME]: 'bg-amber-500 hover:bg-amber-600',
      [ItalianEntityType.PERIOD]: 'bg-yellow-500 hover:bg-yellow-600',
      [ItalianEntityType.ITALIAN_HOLIDAY]: 'bg-red-500 hover:bg-red-600',
      [ItalianEntityType.HISTORICAL_EVENT]: 'bg-indigo-500 hover:bg-indigo-600',
      
      [ItalianEntityType.CULTURAL_EVENT]: 'bg-pink-500 hover:bg-pink-600',
      [ItalianEntityType.FESTIVAL]: 'bg-fuchsia-600 hover:bg-fuchsia-700',
      [ItalianEntityType.TRADITION]: 'bg-emerald-500 hover:bg-emerald-600',
      [ItalianEntityType.CUISINE]: 'bg-orange-400 hover:bg-orange-500',
      
      [ItalianEntityType.ITALIAN_BRAND]: 'bg-gray-600 hover:bg-gray-700',
      [ItalianEntityType.ITALIAN_PRODUCT]: 'bg-stone-600 hover:bg-stone-700',
      
      [ItalianEntityType.MONETARY]: 'bg-green-700 hover:bg-green-800',
      [ItalianEntityType.PERCENTAGE]: 'bg-blue-400 hover:bg-blue-500',
      [ItalianEntityType.NUMBER]: 'bg-gray-500 hover:bg-gray-600',
      
      [ItalianEntityType.MISCELLANEOUS]: 'bg-slate-500 hover:bg-slate-600'
    };
    
    return `${baseClasses} ${typeStyles[entity.type] || 'bg-gray-500 hover:bg-gray-600'}`;
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
      
      [ItalianEntityType.MISCELLANEOUS]: 'Altro'
    };
    
    return labels[type] || type;
  };

  // Create segments with proper React rendering
  const segments = useMemo((): HighlightedSegment[] => {
    if (!highlightMode || entities.length === 0) {
      return [{ text, isEntity: false }];
    }

    // Sort entities by start position
    const sortedEntities = [...entities].sort((a, b) => a.startOffset - b.startOffset);
    
    const segments: HighlightedSegment[] = [];
    let lastOffset = 0;

    sortedEntities.forEach((entity) => {
      // Add text before entity
      if (entity.startOffset > lastOffset) {
        segments.push({
          text: text.substring(lastOffset, entity.startOffset),
          isEntity: false
        });
      }

      // Add entity
      segments.push({
        text: text.substring(entity.startOffset, entity.endOffset),
        entity,
        isEntity: true
      });

      lastOffset = entity.endOffset;
    });

    // Add remaining text
    if (lastOffset < text.length) {
      segments.push({
        text: text.substring(lastOffset),
        isEntity: false
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
    return <div className="whitespace-pre-wrap leading-relaxed font-mono text-sm">{text}</div>;
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
                    {entity.metadata.dialectalVariants && entity.metadata.dialectalVariants.length > 0 && (
                      <div className="text-yellow-300">
                        🗣️ Varianti: {entity.metadata.dialectalVariants.join(', ')}
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
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