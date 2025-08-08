/**
 * Italian Semantic Triple Extraction Service
 */

import {
  SemanticTriple,
  ItalianPredicate,
  ItalianPredicateType,
  TripleExtractionResult,
  TripleGraph,
  TripleNode,
  TripleEdge,
  TripleAnalytics,
} from '@/types/triples';
import { ItalianEntity } from '@/types/entities';
import { GeminiAPIService } from './geminiAPI';
import ItalianSemanticSearchService, { EnhancedTriple } from './semanticSearch';

export interface EnhancedTripleExtractionResult extends TripleExtractionResult {
  triples: EnhancedTriple[];
  semanticInsights: string[];
  culturalContext: string[];
}

export class ItalianTripleExtractor {
  private geminiService: GeminiAPIService;
  private predicateMap: Map<string, ItalianPredicate>;
  private semanticSearchService?: ItalianSemanticSearchService;
  private useSemanticEnhancement: boolean = false;

  constructor(
    geminiService: GeminiAPIService,
    semanticSearchService?: ItalianSemanticSearchService
  ) {
    this.geminiService = geminiService;
    this.predicateMap = this.initializeItalianPredicates();

    if (semanticSearchService) {
      this.semanticSearchService = semanticSearchService;
      this.useSemanticEnhancement = true;
    }
  }

  /**
   * Enable or disable semantic enhancement
   */
  setSemanticEnhancement(enabled: boolean): void {
    this.useSemanticEnhancement = enabled && !!this.semanticSearchService;
  }

  async extractTriples(
    text: string,
    entities?: ItalianEntity[]
  ): Promise<TripleExtractionResult> {
    if (this.useSemanticEnhancement && this.semanticSearchService?.isReady()) {
      return this.extractTriplesWithSemanticEnhancement(text, entities);
    } else {
      return this.extractTriplesStandard(text, entities);
    }
  }

  /**
   * Extract triples with semantic enhancement using vector search
   */
  async extractTriplesWithSemanticEnhancement(
    text: string,
    entities?: ItalianEntity[]
  ): Promise<EnhancedTripleExtractionResult> {
    const startTime = Date.now();

    try {
      console.log('Extracting triples with semantic enhancement...');

      // Step 1: Standard extraction
      const standardResult = await this.extractTriplesStandard(text, entities);

      // Step 2: Semantic enhancement
      if (!this.semanticSearchService) {
        throw new Error('Semantic search service not available');
      }

      // Get semantic analysis (this will enhance triples with vector search)
      const semanticAnalysis = await this.semanticSearchService.analyzeText(
        text,
        entities || [],
        standardResult.triples
      );

      // Step 3: Extract cultural insights for triples
      const culturalContext = await this.extractTripleCulturalContext(text);

      const processingTime = Date.now() - startTime;

      return {
        ...standardResult,
        triples: semanticAnalysis.triples,
        semanticInsights: semanticAnalysis.culturalInsights,
        culturalContext,
        processingTime,
      };
    } catch (error) {
      console.error('Semantic-enhanced triple extraction failed:', error);
      // Fallback to standard extraction with empty semantic data
      const standardResult = await this.extractTriplesStandard(text, entities);
      return {
        ...standardResult,
        semanticInsights: [],
        culturalContext: [],
      };
    }
  }

  /**
   * Standard triple extraction without semantic enhancement
   */
  private async extractTriplesStandard(
    text: string,
    entities?: ItalianEntity[]
  ): Promise<TripleExtractionResult> {
    const startTime = Date.now();

    try {
      // Pre-process text for Italian linguistic patterns
      const preprocessedText = this.preprocessItalianText(text);

      // Extract using AI
      const aiResult = await this.geminiService.analyzeItalianText(
        preprocessedText,
        'triples'
      );

      // Extract using Italian-specific patterns
      const patternBasedTriples = this.extractPatternBasedTriples(
        preprocessedText,
        entities
      );

      // Merge and validate triples
      const mergedTriples = this.mergeTripleResults(
        aiResult.triples || [],
        patternBasedTriples,
        text,
        entities
      );

      // Apply Italian cultural context scoring
      const contextScoredTriples = this.applyCulturalContextScoring(
        mergedTriples,
        entities
      );

      // Validate semantic consistency
      const validatedTriples =
        this.validateSemanticConsistency(contextScoredTriples);

      const confidence = this.calculateOverallConfidence(validatedTriples);
      const processingTime = Date.now() - startTime;

      return {
        triples: validatedTriples,
        confidence,
        processingTime,
        sourceText: text,
        extractedRelations: validatedTriples.length,
      };
    } catch (error) {
      console.error('Triple extraction failed:', error);
      throw new Error('Failed to extract semantic triples from text');
    }
  }

  private createSemanticTriple(
    rawTriple: any,
    index: number,
    originalText: string,
    entities?: ItalianEntity[]
  ): SemanticTriple | null {
    try {
      // Validate required fields
      if (!rawTriple.subject || !rawTriple.predicate || !rawTriple.object) {
        console.warn('Invalid triple data:', rawTriple);
        return null;
      }

      // Normalize predicate
      const predicate = this.normalizePredicate(rawTriple.predicate);

      // Create subject and object entities
      const subject = this.createTripleEntity(rawTriple.subject, entities);
      const object = this.createTripleEntity(rawTriple.object, entities);

      // Extract context from original text
      const context = this.extractContext(rawTriple, originalText);

      return {
        id: `triple_${index}_${Date.now()}`,
        subject,
        predicate,
        object,
        confidence: Math.min(Math.max(rawTriple.confidence || 0.5, 0), 1),
        context: rawTriple.context || context,
        source: this.findTripleSource(rawTriple, originalText),
      };
    } catch (error) {
      console.error('Failed to create semantic triple:', error);
      return null;
    }
  }

  private normalizePredicate(rawPredicate: string): ItalianPredicate {
    // Check if we have a predefined predicate
    const predicate = this.predicateMap.get(rawPredicate.toUpperCase());
    if (predicate) {
      return predicate;
    }

    // Create a custom predicate for Italian relationships
    return this.createCustomItalianPredicate(rawPredicate);
  }

  private createCustomItalianPredicate(rawPredicate: string): ItalianPredicate {
    // Enhanced Italian verb phrases mapping with semantic weights
    const italianPredicateMapping: Record<
      string,
      { type: ItalianPredicateType; weight: number }
    > = {
      // Birth and death relationships
      'nato a': { type: ItalianPredicateType.BORN_IN, weight: 0.95 },
      'nato in': { type: ItalianPredicateType.BORN_IN, weight: 0.95 },
      'nacque a': { type: ItalianPredicateType.BORN_IN, weight: 0.95 },
      'nacque in': { type: ItalianPredicateType.BORN_IN, weight: 0.95 },
      'morto a': { type: ItalianPredicateType.DIED_IN, weight: 0.9 },
      'morto in': { type: ItalianPredicateType.DIED_IN, weight: 0.9 },
      'morì a': { type: ItalianPredicateType.DIED_IN, weight: 0.9 },
      'morì in': { type: ItalianPredicateType.DIED_IN, weight: 0.9 },
      'deceduto a': { type: ItalianPredicateType.DIED_IN, weight: 0.85 },

      // Geographic relationships
      'situato a': { type: ItalianPredicateType.LOCATED_IN, weight: 0.9 },
      'situato in': { type: ItalianPredicateType.LOCATED_IN, weight: 0.9 },
      'si trova a': { type: ItalianPredicateType.LOCATED_IN, weight: 0.85 },
      'si trova in': { type: ItalianPredicateType.LOCATED_IN, weight: 0.85 },
      'ubicato a': { type: ItalianPredicateType.LOCATED_IN, weight: 0.8 },
      'posizionato in': { type: ItalianPredicateType.LOCATED_IN, weight: 0.75 },
      'confina con': { type: ItalianPredicateType.BORDERS_WITH, weight: 0.9 },
      'al confine con': {
        type: ItalianPredicateType.BORDERS_WITH,
        weight: 0.85,
      },
      'è vicino a': { type: ItalianPredicateType.NEAR, weight: 0.7 },
      'nelle vicinanze di': { type: ItalianPredicateType.NEAR, weight: 0.65 },

      // Administrative relationships
      'capitale di': { type: ItalianPredicateType.CAPITAL_OF, weight: 0.95 },
      'è la capitale di': {
        type: ItalianPredicateType.CAPITAL_OF,
        weight: 0.95,
      },
      'capoluogo di': { type: ItalianPredicateType.CAPITAL_OF, weight: 0.9 },
      'è parte di': { type: ItalianPredicateType.PART_OF, weight: 0.85 },
      'appartiene a': { type: ItalianPredicateType.PART_OF, weight: 0.8 },

      // Cultural and artistic relationships
      'ha fondato': { type: ItalianPredicateType.FOUNDED, weight: 0.9 },
      fondò: { type: ItalianPredicateType.FOUNDED, weight: 0.9 },
      'ha creato': { type: ItalianPredicateType.CREATED, weight: 0.85 },
      creò: { type: ItalianPredicateType.CREATED, weight: 0.85 },
      'ha dipinto': { type: ItalianPredicateType.PAINTED, weight: 0.9 },
      dipinse: { type: ItalianPredicateType.PAINTED, weight: 0.9 },
      'ha affrescato': { type: ItalianPredicateType.PAINTED, weight: 0.85 },
      'ha scritto': { type: ItalianPredicateType.WROTE, weight: 0.9 },
      scrisse: { type: ItalianPredicateType.WROTE, weight: 0.9 },
      'ha composto': { type: ItalianPredicateType.COMPOSED, weight: 0.85 },
      compose: { type: ItalianPredicateType.COMPOSED, weight: 0.85 },
      'ha progettato': { type: ItalianPredicateType.DESIGNED, weight: 0.8 },
      progettò: { type: ItalianPredicateType.DESIGNED, weight: 0.8 },
      'ha costruito': { type: ItalianPredicateType.BUILT, weight: 0.85 },
      costruì: { type: ItalianPredicateType.BUILT, weight: 0.85 },

      // Political and institutional relationships
      'è sindaco di': { type: ItalianPredicateType.MAYOR_OF, weight: 0.95 },
      'sindaco di': { type: ItalianPredicateType.MAYOR_OF, weight: 0.95 },
      'è presidente di': {
        type: ItalianPredicateType.PRESIDENT_OF,
        weight: 0.95,
      },
      'presidente di': {
        type: ItalianPredicateType.PRESIDENT_OF,
        weight: 0.95,
      },
      'è ministro di': { type: ItalianPredicateType.MINISTER_OF, weight: 0.9 },
      'ministro di': { type: ItalianPredicateType.MINISTER_OF, weight: 0.9 },
      governò: { type: ItalianPredicateType.GOVERNED, weight: 0.85 },
      'ha governato': { type: ItalianPredicateType.GOVERNED, weight: 0.85 },

      // Professional relationships
      'lavora per': { type: ItalianPredicateType.WORKS_FOR, weight: 0.8 },
      'lavorò per': { type: ItalianPredicateType.WORKS_FOR, weight: 0.8 },
      'è membro di': { type: ItalianPredicateType.MEMBER_OF, weight: 0.75 },
      'membro di': { type: ItalianPredicateType.MEMBER_OF, weight: 0.75 },

      // Religious and cultural relationships
      'santo patrono di': {
        type: ItalianPredicateType.PATRON_SAINT_OF,
        weight: 0.95,
      },
      'patrono di': { type: ItalianPredicateType.PATRON_SAINT_OF, weight: 0.9 },
      'si celebra a': { type: ItalianPredicateType.CELEBRATES, weight: 0.75 },
      'tradizionale di': {
        type: ItalianPredicateType.TRADITIONAL_IN,
        weight: 0.7,
      },
      'tipico di': { type: ItalianPredicateType.TRADITIONAL_IN, weight: 0.7 },

      // Temporal relationships
      'avvenne a': { type: ItalianPredicateType.HAPPENED_IN, weight: 0.85 },
      'avvenne in': { type: ItalianPredicateType.HAPPENED_IN, weight: 0.85 },
      'ebbe luogo a': { type: ItalianPredicateType.HAPPENED_IN, weight: 0.8 },
      'si svolse a': { type: ItalianPredicateType.HAPPENED_IN, weight: 0.8 },
      'durante il': { type: ItalianPredicateType.OCCURRED_DURING, weight: 0.7 },
      'nel periodo di': {
        type: ItalianPredicateType.OCCURRED_DURING,
        weight: 0.7,
      },
    };

    const mapping = italianPredicateMapping[rawPredicate.toLowerCase()];
    const predicateType = mapping?.type || ItalianPredicateType.ASSOCIATED_WITH;
    const semanticWeight = mapping?.weight || 0.5;

    return {
      id: `predicate_${Date.now()}`,
      label: rawPredicate,
      type: predicateType,
      semanticWeight,
    };
  }

  private createTripleEntity(
    rawEntity: string,
    knownEntities?: ItalianEntity[]
  ) {
    // Try to match with known entities first
    if (knownEntities) {
      const matchedEntity = knownEntities.find(
        entity => entity.text.toLowerCase() === rawEntity.toLowerCase()
      );

      if (matchedEntity) {
        return {
          id: matchedEntity.id,
          text: matchedEntity.text,
          type: matchedEntity.type,
          entityRef: matchedEntity,
        };
      }
    }

    // Create new entity reference
    return {
      id: `entity_${Date.now()}_${Math.random()}`,
      text: rawEntity.trim(),
      type: 'UNKNOWN',
    };
  }

  private extractContext(rawTriple: any, originalText: string): string {
    // Try to find the sentence containing the triple
    const sentences = originalText.split(/[.!?]+/);

    for (const sentence of sentences) {
      const normalizedSentence = sentence.toLowerCase();
      const hasSubject = normalizedSentence.includes(
        rawTriple.subject.toLowerCase()
      );
      const hasObject = normalizedSentence.includes(
        rawTriple.object.toLowerCase()
      );

      if (hasSubject && hasObject) {
        return sentence.trim();
      }
    }

    return '';
  }

  private findTripleSource(rawTriple: any, originalText: string) {
    const context = this.extractContext(rawTriple, originalText);
    if (context) {
      const startOffset = originalText.indexOf(context);
      return {
        text: context,
        startOffset,
        endOffset: startOffset + context.length,
      };
    }
    return undefined;
  }

  private calculateOverallConfidence(triples: SemanticTriple[]): number {
    if (triples.length === 0) return 0;

    const totalConfidence = triples.reduce(
      (sum, triple) => sum + triple.confidence,
      0
    );
    return totalConfidence / triples.length;
  }

  private initializeItalianPredicates(): Map<string, ItalianPredicate> {
    const predicates = new Map<string, ItalianPredicate>();

    // Define Italian-specific predicates
    const italianPredicates: ItalianPredicate[] = [
      {
        id: 'located_in',
        label: 'si trova in',
        type: ItalianPredicateType.LOCATED_IN,
        inverse: 'contiene',
        semanticWeight: 0.9,
      },
      {
        id: 'born_in',
        label: 'nato in',
        type: ItalianPredicateType.BORN_IN,
        semanticWeight: 0.95,
      },
      {
        id: 'founded',
        label: 'ha fondato',
        type: ItalianPredicateType.FOUNDED,
        inverse: 'fondato da',
        semanticWeight: 0.85,
      },
      {
        id: 'created',
        label: 'ha creato',
        type: ItalianPredicateType.CREATED,
        inverse: 'creato da',
        semanticWeight: 0.8,
      },
      {
        id: 'mayor_of',
        label: 'sindaco di',
        type: ItalianPredicateType.MAYOR_OF,
        semanticWeight: 0.9,
      },
      {
        id: 'capital_of',
        label: 'capitale di',
        type: ItalianPredicateType.CAPITAL_OF,
        semanticWeight: 0.95,
      },
    ];

    italianPredicates.forEach(predicate => {
      predicates.set(predicate.type, predicate);
    });

    return predicates;
  }

  /**
   * Extract cultural context for triples using Italian knowledge
   */
  private async extractTripleCulturalContext(text: string): Promise<string[]> {
    const culturalKeywords = [
      'tradizione',
      'cultura',
      'storia',
      'arte',
      'rinascimento',
      'romano',
      'patrimonio',
      'unesco',
      'monumento',
      'teatro',
      'opera',
      'festival',
      'festa',
      'patrono',
      'santo',
      'diocesi',
      'piazza',
      'palazzo',
      'castello',
      'duomo',
      'basilica',
      'museo',
      'galleria',
    ];

    const context: string[] = [];
    const lowercaseText = text.toLowerCase();

    culturalKeywords.forEach(keyword => {
      if (lowercaseText.includes(keyword)) {
        // Add contextual information based on cultural keywords found in triples
        switch (keyword) {
          case 'rinascimento':
            context.push(
              'Periodo di rinnovamento culturale italiano (XIV-XVI secolo)'
            );
            break;
          case 'romano':
            context.push(
              "Relativo all'Impero Romano o all'architettura romana"
            );
            break;
          case 'unesco':
            context.push("Siti del Patrimonio Mondiale dell'Umanità UNESCO");
            break;
          case 'patrono':
          case 'santo':
            context.push('Tradizioni religiose e santi patroni italiani');
            break;
          case 'teatro':
          case 'opera':
            context.push('Tradizione teatrale e operistica italiana');
            break;
          case 'duomo':
          case 'basilica':
            context.push('Architettura religiosa italiana');
            break;
          case 'museo':
          case 'galleria':
            context.push('Patrimonio artistico e culturale italiano');
            break;
          default:
            context.push(`Contesto culturale italiano: ${keyword}`);
        }
      }
    });

    return [...new Set(context)]; // Remove duplicates
  }

  // Graph generation methods
  generateTripleGraph(triples: SemanticTriple[]): TripleGraph {
    const nodes = this.generateNodes(triples);
    const edges = this.generateEdges(triples);

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        density: this.calculateGraphDensity(nodes.length, edges.length),
        components: this.countConnectedComponents(nodes, edges),
      },
    };
  }

  private generateNodes(triples: SemanticTriple[]): TripleNode[] {
    const nodeMap = new Map<string, TripleNode>();

    triples.forEach(triple => {
      // Add subject node
      if (!nodeMap.has(triple.subject.id)) {
        nodeMap.set(triple.subject.id, {
          id: triple.subject.id,
          label: triple.subject.text,
          type: triple.subject.type,
          entityType: triple.subject.entityRef?.type,
          size: 1,
          color: this.getNodeColor(triple.subject.type),
        });
      } else {
        // Increase size for existing nodes
        const node = nodeMap.get(triple.subject.id)!;
        node.size += 1;
      }

      // Add object node
      if (!nodeMap.has(triple.object.id)) {
        nodeMap.set(triple.object.id, {
          id: triple.object.id,
          label: triple.object.text,
          type: triple.object.type,
          entityType: triple.object.entityRef?.type,
          size: 1,
          color: this.getNodeColor(triple.object.type),
        });
      } else {
        const node = nodeMap.get(triple.object.id)!;
        node.size += 1;
      }
    });

    return Array.from(nodeMap.values());
  }

  private generateEdges(triples: SemanticTriple[]): TripleEdge[] {
    return triples.map(triple => ({
      id: triple.id,
      source: triple.subject.id,
      target: triple.object.id,
      label: triple.predicate.label,
      predicateType: triple.predicate.type,
      weight: triple.confidence,
      color: this.getEdgeColor(triple.predicate.type),
    }));
  }

  private getNodeColor(entityType: string): string {
    const colorMap: Record<string, string> = {
      PERSON: '#3B82F6',
      LOCATION: '#10B981',
      ORGANIZATION: '#8B5CF6',
      EVENT: '#EC4899',
      DATE: '#F59E0B',
      UNKNOWN: '#6B7280',
    };

    return colorMap[entityType] || '#6B7280';
  }

  private getEdgeColor(predicateType: ItalianPredicateType): string {
    const colorMap: Record<ItalianPredicateType, string> = {
      [ItalianPredicateType.LOCATED_IN]: '#10B981',
      [ItalianPredicateType.BORN_IN]: '#3B82F6',
      [ItalianPredicateType.FOUNDED]: '#8B5CF6',
      [ItalianPredicateType.CREATED]: '#EC4899',
      [ItalianPredicateType.MAYOR_OF]: '#F59E0B',
      [ItalianPredicateType.CAPITAL_OF]: '#EF4444',
    } as Record<ItalianPredicateType, string>;

    return colorMap[predicateType] || '#6B7280';
  }

  private calculateGraphDensity(nodeCount: number, edgeCount: number): number {
    if (nodeCount <= 1) return 0;
    const maxEdges = nodeCount * (nodeCount - 1);
    return edgeCount / maxEdges;
  }

  private countConnectedComponents(
    nodes: TripleNode[],
    edges: TripleEdge[]
  ): number {
    // Simple connected components calculation
    const visited = new Set<string>();
    let components = 0;

    const adjacencyList = new Map<string, string[]>();
    nodes.forEach(node => adjacencyList.set(node.id, []));
    edges.forEach(edge => {
      adjacencyList.get(edge.source)?.push(edge.target);
      adjacencyList.get(edge.target)?.push(edge.source);
    });

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      adjacencyList.get(nodeId)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      });
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        components++;
      }
    });

    return components;
  }

  // Italian-specific enhancement methods
  private preprocessItalianText(text: string): string {
    // Normalize Italian text for better pattern matching
    let processed = text
      .replace(/['`]/g, "'") // Normalize apostrophes
      .replace(/[\u2018\u2019]/g, "'") // Curly apostrophes
      .replace(/[\u201c\u201d]/g, '"'); // Curly quotes

    // Normalize common Italian verb contractions
    processed = processed
      .replace(/\bl'ha\b/gi, "l'ha")
      .replace(/\bdell'ha\b/gi, "dell'ha")
      .replace(/\bnell'ha\b/gi, "nell'ha");

    return processed;
  }

  private extractPatternBasedTriples(
    text: string,
    _entities?: ItalianEntity[]
  ): any[] {
    const triples: any[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach(sentence => {
      // Extract triples using Italian linguistic patterns
      const sentenceTriples = this.extractTriplesFromSentence(
        sentence.trim(),
        _entities
      );
      triples.push(...sentenceTriples);
    });

    return triples;
  }

  private extractTriplesFromSentence(
    sentence: string,
    _entities?: ItalianEntity[]
  ): any[] {
    const triples: any[] = [];

    // Geographic pattern: "X si trova in Y" / "X è situato in Y"
    this.extractGeographicTriples(sentence, triples);

    // Historical pattern: "X nacque a Y" / "X morì in Y"
    this.extractBiographicalTriples(sentence, triples);

    // Cultural pattern: "X ha creato Y" / "X dipinse Y"
    this.extractCulturalTriples(sentence, triples);

    // Administrative pattern: "X è sindaco di Y" / "X è capitale di Y"
    this.extractAdministrativeTriples(sentence, triples);

    return triples;
  }

  private extractGeographicTriples(sentence: string, triples: any[]): void {
    // Pattern: Entity + geographic verb + Location
    const patterns = [
      /(\w+(?:\s+\w+)*)\s+(?:si trova|è situato|è ubicato|è posizionato)\s+(?:a|in|nella|nel|presso)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:confina con|al confine con)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:è vicino a|nelle vicinanze di)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:è la capitale di|capitale di|capoluogo di)\s+(\w+(?:\s+\w+)*)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const predicateType = this.determineGeographicPredicateType(match[0]);
        triples.push({
          subject: match[1].trim(),
          predicate: predicateType,
          object: match[2].trim(),
          confidence: 0.8,
          context: sentence,
        });
      }
    });
  }

  private extractBiographicalTriples(sentence: string, triples: any[]): void {
    // Biographical patterns
    const patterns = [
      /(\w+(?:\s+\w+)*)\s+(?:nacque|nato|nata)\s+(?:a|in|nella|nel)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:morì|morto|morta|deceduto|deceduta)\s+(?:a|in|nella|nel)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:visse|abitò|risiedette)\s+(?:a|in|nella|nel)\s+(\w+(?:\s+\w+)*)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const predicateType = this.determineBiographicalPredicateType(match[0]);
        triples.push({
          subject: match[1].trim(),
          predicate: predicateType,
          object: match[2].trim(),
          confidence: 0.85,
          context: sentence,
        });
      }
    });
  }

  private extractCulturalTriples(sentence: string, triples: any[]): void {
    // Cultural creation patterns
    const patterns = [
      /(\w+(?:\s+\w+)*)\s+(?:ha dipinto|dipinse|affrescò)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:ha scritto|scrisse|compose)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:ha creato|creò|ha fondato|fondò)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:ha progettato|progettò|ha costruito|costruì)\s+(\w+(?:\s+\w+)*)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const predicateType = this.determineCulturalPredicateType(match[0]);
        triples.push({
          subject: match[1].trim(),
          predicate: predicateType,
          object: match[2].trim(),
          confidence: 0.8,
          context: sentence,
        });
      }
    });
  }

  private extractAdministrativeTriples(sentence: string, triples: any[]): void {
    // Administrative and political patterns
    const patterns = [
      /(\w+(?:\s+\w+)*)\s+(?:è sindaco di|sindaco di)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:è presidente di|presidente di)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:è ministro di|ministro di)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:governò|ha governato)\s+(\w+(?:\s+\w+)*)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const predicateType = this.determineAdministrativePredicateType(
          match[0]
        );
        triples.push({
          subject: match[1].trim(),
          predicate: predicateType,
          object: match[2].trim(),
          confidence: 0.85,
          context: sentence,
        });
      }
    });
  }

  private determineGeographicPredicateType(
    matchText: string
  ): ItalianPredicateType {
    const text = matchText.toLowerCase();
    if (text.includes('capitale') || text.includes('capoluogo')) {
      return ItalianPredicateType.CAPITAL_OF;
    } else if (text.includes('confina') || text.includes('confine')) {
      return ItalianPredicateType.BORDERS_WITH;
    } else if (text.includes('vicino') || text.includes('vicinanze')) {
      return ItalianPredicateType.NEAR;
    } else {
      return ItalianPredicateType.LOCATED_IN;
    }
  }

  private determineBiographicalPredicateType(
    matchText: string
  ): ItalianPredicateType {
    const text = matchText.toLowerCase();
    if (
      text.includes('nacque') ||
      text.includes('nato') ||
      text.includes('nata')
    ) {
      return ItalianPredicateType.BORN_IN;
    } else if (
      text.includes('morì') ||
      text.includes('morto') ||
      text.includes('morta') ||
      text.includes('deceduto')
    ) {
      return ItalianPredicateType.DIED_IN;
    } else {
      return ItalianPredicateType.LIVED_IN;
    }
  }

  private determineCulturalPredicateType(
    matchText: string
  ): ItalianPredicateType {
    const text = matchText.toLowerCase();
    if (
      text.includes('dipinto') ||
      text.includes('dipinse') ||
      text.includes('affrescò')
    ) {
      return ItalianPredicateType.PAINTED;
    } else if (text.includes('scritto') || text.includes('scrisse')) {
      return ItalianPredicateType.WROTE;
    } else if (text.includes('compose') || text.includes('composto')) {
      return ItalianPredicateType.COMPOSED;
    } else if (text.includes('progettò') || text.includes('progettato')) {
      return ItalianPredicateType.DESIGNED;
    } else if (text.includes('costruì') || text.includes('costruito')) {
      return ItalianPredicateType.BUILT;
    } else if (text.includes('fondò') || text.includes('fondato')) {
      return ItalianPredicateType.FOUNDED;
    } else {
      return ItalianPredicateType.CREATED;
    }
  }

  private determineAdministrativePredicateType(
    matchText: string
  ): ItalianPredicateType {
    const text = matchText.toLowerCase();
    if (text.includes('sindaco')) {
      return ItalianPredicateType.MAYOR_OF;
    } else if (text.includes('presidente')) {
      return ItalianPredicateType.PRESIDENT_OF;
    } else if (text.includes('ministro')) {
      return ItalianPredicateType.MINISTER_OF;
    } else {
      return ItalianPredicateType.GOVERNED;
    }
  }

  private mergeTripleResults(
    aiTriples: any[],
    patternTriples: any[],
    _originalText: string,
    _entities?: ItalianEntity[]
  ): any[] {
    const merged = [...aiTriples];
    const existingTripleKeys = new Set(
      aiTriples.map(
        t =>
          `${t.subject?.toLowerCase()}-${t.predicate?.toLowerCase()}-${t.object?.toLowerCase()}`
      )
    );

    // Add pattern-based triples that don't duplicate AI results
    patternTriples.forEach(patternTriple => {
      const key = `${patternTriple.subject.toLowerCase()}-${patternTriple.predicate.toLowerCase()}-${patternTriple.object.toLowerCase()}`;
      if (!existingTripleKeys.has(key)) {
        merged.push(patternTriple);
        existingTripleKeys.add(key);
      }
    });

    return merged;
  }

  private applyCulturalContextScoring(
    triples: any[],
    entities?: ItalianEntity[]
  ): SemanticTriple[] {
    return triples
      .map((triple, index) => {
        let confidence = triple.confidence || 0.5;

        // Boost confidence for culturally significant Italian relationships
        if (
          this.isItalianCulturallyRelevant(
            triple.subject,
            triple.object,
            triple.predicate
          )
        ) {
          confidence = Math.min(confidence + 0.15, 1.0);
        }

        // Boost confidence for historically verified relationships
        if (
          this.isHistoricallyVerifiable(
            triple.subject,
            triple.predicate,
            triple.object
          )
        ) {
          confidence = Math.min(confidence + 0.1, 1.0);
        }

        return this.createSemanticTriple(
          {
            ...triple,
            confidence,
          },
          index,
          '',
          entities
        );
      })
      .filter(triple => triple !== null) as SemanticTriple[];
  }

  private validateSemanticConsistency(
    triples: SemanticTriple[]
  ): SemanticTriple[] {
    return triples.filter(triple => {
      // Remove triples with very low confidence
      if (triple.confidence < 0.3) return false;

      // Validate geographic consistency
      if (this.isGeographicPredicate(triple.predicate.type)) {
        return this.validateGeographicConsistency(triple);
      }

      // Validate temporal consistency
      if (this.isTemporalPredicate(triple.predicate.type)) {
        return this.validateTemporalConsistency(triple);
      }

      return true;
    });
  }

  private isItalianCulturallyRelevant(
    subject: string,
    object: string,
    _predicate: string
  ): boolean {
    const italianCities = [
      'roma',
      'milano',
      'napoli',
      'firenze',
      'venezia',
      'bologna',
      'torino',
      'palermo',
      'genova',
      'bari',
    ];
    const italianRegions = [
      'lazio',
      'lombardia',
      'campania',
      'toscana',
      'veneto',
      'emilia-romagna',
      'piemonte',
      'sicilia',
      'liguria',
      'puglia',
    ];
    const italianPersonalities = [
      'leonardo da vinci',
      'michelangelo',
      'dante',
      'galileo',
      'giuseppe verdi',
      'federico fellini',
    ];

    const subjectLower = subject.toLowerCase();
    const objectLower = object.toLowerCase();

    return (
      italianCities.some(
        city => subjectLower.includes(city) || objectLower.includes(city)
      ) ||
      italianRegions.some(
        region => subjectLower.includes(region) || objectLower.includes(region)
      ) ||
      italianPersonalities.some(
        person => subjectLower.includes(person) || objectLower.includes(person)
      )
    );
  }

  private isHistoricallyVerifiable(
    subject: string,
    predicate: string,
    object: string
  ): boolean {
    // This could be enhanced with a historical knowledge base
    // For now, we use simple heuristics for well-known historical facts
    const knownFacts = [
      { subject: 'leonardo da vinci', predicate: 'BORN_IN', object: 'vinci' },
      { subject: 'michelangelo', predicate: 'BORN_IN', object: 'caprese' },
      { subject: 'dante', predicate: 'BORN_IN', object: 'firenze' },
      { subject: 'roma', predicate: 'CAPITAL_OF', object: 'italia' },
      { subject: 'milano', predicate: 'CAPITAL_OF', object: 'lombardia' },
    ];

    return knownFacts.some(
      fact =>
        subject.toLowerCase().includes(fact.subject) &&
        predicate.includes(fact.predicate) &&
        object.toLowerCase().includes(fact.object)
    );
  }

  private isGeographicPredicate(type: ItalianPredicateType): boolean {
    return [
      ItalianPredicateType.LOCATED_IN,
      ItalianPredicateType.CAPITAL_OF,
      ItalianPredicateType.BORDERS_WITH,
      ItalianPredicateType.NEAR,
      ItalianPredicateType.PART_OF,
    ].includes(type);
  }

  private isTemporalPredicate(type: ItalianPredicateType): boolean {
    return [
      ItalianPredicateType.BORN_IN,
      ItalianPredicateType.DIED_IN,
      ItalianPredicateType.HAPPENED_IN,
      ItalianPredicateType.OCCURRED_DURING,
    ].includes(type);
  }

  private validateGeographicConsistency(_triple: SemanticTriple): boolean {
    // Basic geographic validation - could be enhanced with actual geographic data
    return true; // Placeholder for now
  }

  private validateTemporalConsistency(_triple: SemanticTriple): boolean {
    // Basic temporal validation - could be enhanced with historical timeline data
    return true; // Placeholder for now
  }

  // Analytics methods
  generateAnalytics(triples: SemanticTriple[]): TripleAnalytics {
    const entityFrequency: Record<string, number> = {};
    const predicateFrequency: Record<ItalianPredicateType, number> =
      {} as Record<ItalianPredicateType, number>;

    let totalConfidence = 0;
    const uniqueEntities = new Set<string>();

    triples.forEach(triple => {
      // Count entities
      entityFrequency[triple.subject.text] =
        (entityFrequency[triple.subject.text] || 0) + 1;
      entityFrequency[triple.object.text] =
        (entityFrequency[triple.object.text] || 0) + 1;

      uniqueEntities.add(triple.subject.text);
      uniqueEntities.add(triple.object.text);

      // Count predicates
      predicateFrequency[triple.predicate.type] =
        (predicateFrequency[triple.predicate.type] || 0) + 1;

      totalConfidence += triple.confidence;
    });

    // Find most connected entity
    const mostConnectedEntity =
      Object.entries(entityFrequency).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      '';

    // Find dominant relation type
    const dominantRelationType =
      (Object.entries(predicateFrequency).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] as ItalianPredicateType) ||
      ItalianPredicateType.ASSOCIATED_WITH;

    return {
      entityFrequency,
      predicateFrequency,
      averageConfidence:
        triples.length > 0 ? totalConfidence / triples.length : 0,
      totalTriples: triples.length,
      uniqueEntities: uniqueEntities.size,
      mostConnectedEntity,
      dominantRelationType,
    };
  }
}
