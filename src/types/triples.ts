/**
 * Types for Italian semantic triple extraction
 */

import { ItalianEntity } from './entities';

export interface SemanticTriple {
  id: string;
  subject: TripleEntity;
  predicate: ItalianPredicate;
  object: TripleEntity;
  confidence: number;
  context?: string;
  source?: {
    text: string;
    startOffset: number;
    endOffset: number;
  };
}

export interface TripleEntity {
  id: string;
  text: string;
  type: string;
  entityRef?: ItalianEntity;
}

export interface ItalianPredicate {
  id: string;
  label: string;
  type: ItalianPredicateType;
  inverse?: string;
  semanticWeight: number;
}

export enum ItalianPredicateType {
  // Relazioni geografiche
  LOCATED_IN = 'LOCATED_IN',
  PART_OF = 'PART_OF',
  CAPITAL_OF = 'CAPITAL_OF',
  BORDERS_WITH = 'BORDERS_WITH',
  NEAR = 'NEAR',

  // Relazioni personali
  BORN_IN = 'BORN_IN',
  DIED_IN = 'DIED_IN',
  LIVED_IN = 'LIVED_IN',
  WORKS_FOR = 'WORKS_FOR',
  FOUNDED = 'FOUNDED',
  MARRIED_TO = 'MARRIED_TO',
  CHILD_OF = 'CHILD_OF',

  // Relazioni temporali
  HAPPENED_IN = 'HAPPENED_IN',
  OCCURRED_DURING = 'OCCURRED_DURING',
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  CONTEMPORARY_WITH = 'CONTEMPORARY_WITH',

  // Relazioni culturali italiane
  CREATED = 'CREATED',
  PAINTED = 'PAINTED',
  WROTE = 'WROTE',
  COMPOSED = 'COMPOSED',
  DESIGNED = 'DESIGNED',
  BUILT = 'BUILT',

  // Relazioni istituzionali
  MEMBER_OF = 'MEMBER_OF',
  PRESIDENT_OF = 'PRESIDENT_OF',
  MINISTER_OF = 'MINISTER_OF',
  MAYOR_OF = 'MAYOR_OF',
  GOVERNED = 'GOVERNED',

  // Relazioni economiche
  OWNS = 'OWNS',
  PRODUCES = 'PRODUCES',
  EXPORTS = 'EXPORTS',
  IMPORTS = 'IMPORTS',
  COSTS = 'COSTS',

  // Relazioni culturali specifiche
  PATRON_SAINT_OF = 'PATRON_SAINT_OF',
  CELEBRATES = 'CELEBRATES',
  TRADITIONAL_IN = 'TRADITIONAL_IN',
  DIALECT_OF = 'DIALECT_OF',

  // Relazioni generiche
  IS_A = 'IS_A',
  HAS = 'HAS',
  CONTAINS = 'CONTAINS',
  ASSOCIATED_WITH = 'ASSOCIATED_WITH',
  SIMILAR_TO = 'SIMILAR_TO',
}

export interface TripleExtractionResult {
  triples: SemanticTriple[];
  confidence: number;
  processingTime: number;
  sourceText: string;
  extractedRelations: number;
}

export interface TripleGraph {
  nodes: TripleNode[];
  edges: TripleEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    components: number;
  };
}

export interface TripleNode {
  id: string;
  label: string;
  type: string;
  entityType?: string;
  size: number;
  color: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface TripleEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  predicateType: ItalianPredicateType;
  weight: number;
  color: string;
}

// Analysis types
export interface TripleAnalytics {
  entityFrequency: Record<string, number>;
  predicateFrequency: Record<ItalianPredicateType, number>;
  averageConfidence: number;
  totalTriples: number;
  uniqueEntities: number;
  mostConnectedEntity: string;
  dominantRelationType: ItalianPredicateType;
}

// Export formats
export interface TripleExport {
  format: 'json' | 'csv' | 'rdf' | 'turtle';
  data: string;
  filename: string;
}
