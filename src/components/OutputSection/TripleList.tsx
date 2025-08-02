import React from 'react';
import { SemanticTriple } from '@/types/triples';
import { useApplication } from '@/store/ApplicationStore';
import { ArrowRight } from 'lucide-react';

interface TripleListProps {
  triples: SemanticTriple[];
}

const TripleList: React.FC<TripleListProps> = ({ triples }) => {
  const { selectedTriple, selectTriple } = useApplication();

  if (triples.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nessuna tripla semantica trovata
      </div>
    );
  }

  // Group triples by predicate type for better organization
  const groupedTriples = triples.reduce(
    (groups, triple) => {
      const type = triple.predicate.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(triple);
      return groups;
    },
    {} as Record<string, SemanticTriple[]>
  );

  const getPredicateLabel = (type: string): string => {
    const labels: Record<string, string> = {
      LOCATED_IN: 'Si trova in',
      BORN_IN: 'Nato in',
      DIED_IN: 'Morto in',
      FOUNDED: 'Ha fondato',
      CREATED: 'Ha creato',
      PAINTED: 'Ha dipinto',
      WROTE: 'Ha scritto',
      MAYOR_OF: 'Sindaco di',
      CAPITAL_OF: 'Capitale di',
      MEMBER_OF: 'Membro di',
      WORKS_FOR: 'Lavora per',
      PART_OF: 'Parte di',
      BORDERS_WITH: 'Confina con',
      NEAR: 'Vicino a',
    };
    return labels[type] || type.replace('_', ' ');
  };

  const getPredicateColor = (type: string): string => {
    const colors: Record<string, string> = {
      LOCATED_IN: 'bg-green-100 text-green-800',
      BORN_IN: 'bg-blue-100 text-blue-800',
      DIED_IN: 'bg-gray-100 text-gray-800',
      FOUNDED: 'bg-purple-100 text-purple-800',
      CREATED: 'bg-pink-100 text-pink-800',
      PAINTED: 'bg-indigo-100 text-indigo-800',
      WROTE: 'bg-yellow-100 text-yellow-800',
      MAYOR_OF: 'bg-red-100 text-red-800',
      CAPITAL_OF: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTriples).map(([type, typeTriples]) => (
        <div key={type} className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 flex items-center justify-between">
              {getPredicateLabel(type)}
              <span className="text-xs text-gray-500">
                {typeTriples.length}{' '}
                {typeTriples.length === 1 ? 'relazione' : 'relazioni'}
              </span>
            </h4>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              {typeTriples.map(triple => (
                <div
                  key={triple.id}
                  onClick={() => selectTriple(triple)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedTriple?.id === triple.id
                      ? 'ring-2 ring-italian-green border-italian-green bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Triple visualization */}
                  <div className="flex items-center space-x-3">
                    {/* Subject */}
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {triple.subject.text}
                      </div>
                    </div>

                    {/* Predicate */}
                    <div className="flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex-shrink-0">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getPredicateColor(triple.predicate.type)}`}
                      >
                        {triple.predicate.label}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Object */}
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {triple.object.text}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="flex-shrink-0 ml-auto">
                      <div className="text-xs text-gray-500">
                        {Math.round(triple.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Context */}
                  {triple.context && (
                    <div className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                      "{triple.context}"
                    </div>
                  )}

                  {/* Source information */}
                  {triple.source && (
                    <div className="mt-2 text-xs text-gray-500">
                      Fonte: caratteri {triple.source.startOffset}-
                      {triple.source.endOffset}
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

export default TripleList;
