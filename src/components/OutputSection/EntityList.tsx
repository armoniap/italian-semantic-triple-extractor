import React from 'react';
import { ItalianEntity } from '@/types/entities';
import { useApplication } from '@/store/ApplicationStore';

interface EntityListProps {
  entities: ItalianEntity[];
}

const EntityList: React.FC<EntityListProps> = ({ entities }) => {
  const { selectedEntity, selectEntity } = useApplication();

  if (entities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nessuna entità trovata
      </div>
    );
  }

  // Group entities by type for better visualization
  const groupedEntities = entities.reduce((groups, entity) => {
    const type = entity.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(entity);
    return groups;
  }, {} as Record<string, ItalianEntity[]>);

  const getEntityTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'PERSON': 'Persone',
      'LOCATION': 'Luoghi',
      'ITALIAN_CITY': 'Città Italiane',
      'ITALIAN_REGION': 'Regioni Italiane',
      'ORGANIZATION': 'Organizzazioni',
      'DATE': 'Date',
      'EVENT': 'Eventi',
      'MONUMENT': 'Monumenti',
      'COMPANY': 'Aziende'
    };
    return typeLabels[type] || type.replace('_', ' ');
  };

  const getEntityTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'PERSON': 'bg-blue-100 text-blue-800',
      'LOCATION': 'bg-green-100 text-green-800',
      'ITALIAN_CITY': 'bg-green-100 text-green-800',
      'ITALIAN_REGION': 'bg-green-100 text-green-800',
      'ORGANIZATION': 'bg-purple-100 text-purple-800',
      'DATE': 'bg-yellow-100 text-yellow-800',
      'EVENT': 'bg-pink-100 text-pink-800',
      'MONUMENT': 'bg-indigo-100 text-indigo-800',
      'COMPANY': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedEntities).map(([type, typeEntities]) => (
        <div key={type} className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 flex items-center justify-between">
              {getEntityTypeLabel(type)}
              <span className="text-xs text-gray-500">
                {typeEntities.length} {typeEntities.length === 1 ? 'elemento' : 'elementi'}
              </span>
            </h4>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeEntities.map((entity) => (
                <div
                  key={entity.id}
                  onClick={() => selectEntity(entity)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedEntity?.id === entity.id
                      ? 'ring-2 ring-italian-green border-italian-green bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {entity.text}
                      </h5>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEntityTypeColor(entity.type)}`}>
                          {entity.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(entity.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional metadata */}
                  {entity.metadata && (
                    <div className="mt-2 space-y-1">
                      {entity.metadata.region && (
                        <div className="text-xs text-gray-600">
                          📍 {entity.metadata.region}
                        </div>
                      )}
                      {entity.metadata.culturalContext && (
                        <div className="text-xs text-gray-600">
                          🏛️ {entity.metadata.culturalContext}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* External links */}
                  {(entity.wikipediaUrl || entity.dbpediaUrl) && (
                    <div className="mt-2 flex space-x-2">
                      {entity.wikipediaUrl && (
                        <a
                          href={entity.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700"
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
                          className="text-xs text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          DBpedia
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EntityList;