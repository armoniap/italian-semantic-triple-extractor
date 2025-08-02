/**
 * Export utilities for analysis results in various formats
 */

import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ItalianEntity } from '@/types/entities';
import { SemanticTriple, TripleAnalytics } from '@/types/triples';

export interface ExportOptions {
  format: 'json' | 'csv' | 'rdf' | 'turtle' | 'xml';
  includeMetadata: boolean;
  includeAnalytics: boolean;
  filename?: string;
  compression?: boolean;
}

export interface ExportData {
  entities: ItalianEntity[];
  triples: SemanticTriple[];
  analytics?: TripleAnalytics;
  metadata: {
    exportedAt: string;
    textLength: number;
    processingTime: number;
    confidence: number;
    language: string;
    tool: string;
    version: string;
  };
}

export class ExportService {
  private static readonly TOOL_NAME =
    'Estrattore di Triple Semantiche Italiane';
  private static readonly VERSION = '1.0.0';

  static async exportResults(
    entities: ItalianEntity[],
    triples: SemanticTriple[],
    options: ExportOptions,
    analytics?: TripleAnalytics,
    originalText?: string
  ): Promise<void> {
    const exportData = this.prepareItalianExportData(
      entities,
      triples,
      analytics,
      originalText
    );

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    switch (options.format) {
      case 'json':
        content = this.exportToItalianJSON(exportData, options);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;

      case 'csv':
        content = this.exportToCSV(exportData, options);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;

      case 'rdf':
        content = this.exportToRDF(exportData, options);
        mimeType = 'application/rdf+xml';
        fileExtension = 'rdf';
        break;

      case 'turtle':
        content = this.exportToTurtle(exportData, options);
        mimeType = 'text/turtle';
        fileExtension = 'ttl';
        break;

      case 'xml':
        content = this.exportToXML(exportData, options);
        mimeType = 'application/xml';
        fileExtension = 'xml';
        break;

      default:
        throw new Error(
          `Formato di esportazione non supportato: ${options.format}`
        );
    }

    const filename = options.filename || this.generateFilename(fileExtension);

    // Ensure proper UTF-8 encoding with BOM for Italian characters
    const utf8Bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const contentBytes = new TextEncoder().encode(content);
    const combinedArray = new Uint8Array(utf8Bom.length + contentBytes.length);
    combinedArray.set(utf8Bom);
    combinedArray.set(contentBytes, utf8Bom.length);

    const blob = new Blob([combinedArray], {
      type: mimeType + ';charset=utf-8',
    });

    saveAs(blob, filename);
  }

  private static prepareItalianExportData(
    entities: ItalianEntity[],
    triples: SemanticTriple[],
    analytics?: TripleAnalytics,
    originalText?: string
  ): ExportData & { italianMetadata?: any } {
    return {
      entities,
      triples,
      analytics,
      metadata: {
        exportedAt: new Date().toISOString(),
        textLength: originalText?.length || 0,
        processingTime: 0, // Would be passed from the analysis
        confidence: this.calculateOverallConfidence(entities, triples),
        language: 'it',
        tool: this.TOOL_NAME,
        version: this.VERSION,
      },
      italianMetadata: {
        linguisticFeatures: originalText
          ? originalText.match(/[àèìòù]/g)?.length || 0
          : 0,
        culturalRelevance:
          entities.filter(e => e.type.includes('ITALIAN')).length /
          Math.max(entities.length, 1),
        geographicScope: entities
          .filter(e => e.metadata?.region)
          .map(e => e.metadata?.region),
        historicalContext: entities.filter(e => e.type.includes('HISTORICAL'))
          .length,
        exportFormat: 'UTF-8 con BOM per caratteri italiani',
        vocabularyUsed: 'Ontologia italiana specializzata',
      },
    };
  }

  private static exportToItalianJSON(
    data: ExportData & { italianMetadata?: any },
    options: ExportOptions
  ): string {
    const exportObject: any = {
      entita: data.entities,
      triple: data.triples,
    };

    if (options.includeAnalytics && data.analytics) {
      exportObject.analisiStatistiche = data.analytics;
    }

    if (options.includeMetadata) {
      exportObject.metadati = {
        ...data.metadata,
        strumento: data.metadata.tool,
        lingua: 'italiano',
        esportatoIl: data.metadata.exportedAt,
      };

      if (data.italianMetadata) {
        exportObject.metadatiItaliani = data.italianMetadata;
      }
    }

    // Ensure proper JSON formatting for Italian characters
    return JSON.stringify(exportObject, null, 2);
  }

  private static exportToCSV(data: ExportData, options: ExportOptions): string {
    let csvContent = '';

    // Export entities
    csvContent += 'ENTITIES\n';
    const entitiesData = data.entities.map(entity => ({
      id: entity.id,
      text: entity.text,
      type: entity.type,
      confidence: entity.confidence,
      startOffset: entity.startOffset,
      endOffset: entity.endOffset,
      region: entity.metadata?.region || '',
      culturalContext: entity.metadata?.culturalContext || '',
      wikipediaUrl: entity.wikipediaUrl || '',
    }));

    csvContent += Papa.unparse(entitiesData) + '\n\n';

    // Export triples
    csvContent += 'SEMANTIC TRIPLES\n';
    const triplesData = data.triples.map(triple => ({
      id: triple.id,
      subject: triple.subject.text,
      predicate: triple.predicate.label,
      predicateType: triple.predicate.type,
      object: triple.object.text,
      confidence: triple.confidence,
      context: triple.context || '',
    }));

    csvContent += Papa.unparse(triplesData) + '\n\n';

    // Add metadata if requested
    if (options.includeMetadata) {
      csvContent += 'METADATA\n';
      const metadataArray = Object.entries(data.metadata).map(
        ([key, value]) => ({
          property: key,
          value: value?.toString() || '',
        })
      );
      csvContent += Papa.unparse(metadataArray);
    }

    return csvContent;
  }

  private static exportToRDF(
    data: ExportData,
    _options: ExportOptions
  ): string {
    const ns = {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      ite: 'http://italian-triple-extractor.org/ontology#',
      foaf: 'http://xmlns.com/foaf/0.1/',
      geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
      time: 'http://www.w3.org/2006/time#',
    };

    let rdf = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="${ns.rdf}"
  xmlns:rdfs="${ns.rdfs}"
  xmlns:ite="${ns.ite}"
  xmlns:foaf="${ns.foaf}"
  xmlns:geo="${ns.geo}"
  xmlns:time="${ns.time}">

`;

    // Export entities
    data.entities.forEach(entity => {
      const entityUri = `${ns.ite}entity/${encodeURIComponent(entity.id)}`;

      rdf += `  <ite:Entity rdf:about="${entityUri}">
    <rdfs:label>${this.escapeXML(entity.text)}</rdfs:label>
    <ite:entityType>${entity.type}</ite:entityType>
    <ite:confidence rdf:datatype="http://www.w3.org/2001/XMLSchema#float">${entity.confidence}</ite:confidence>
    <ite:startOffset rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${entity.startOffset}</ite:startOffset>
    <ite:endOffset rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${entity.endOffset}</ite:endOffset>
`;

      if (entity.metadata?.region) {
        rdf += `    <ite:region>${this.escapeXML(entity.metadata.region)}</ite:region>
`;
      }

      if (entity.wikipediaUrl) {
        rdf += `    <rdfs:seeAlso rdf:resource="${entity.wikipediaUrl}"/>
`;
      }

      rdf += `  </ite:Entity>

`;
    });

    // Export triples
    data.triples.forEach(triple => {
      const tripleUri = `${ns.ite}triple/${encodeURIComponent(triple.id)}`;
      const subjectUri = `${ns.ite}entity/${encodeURIComponent(triple.subject.id)}`;
      const objectUri = `${ns.ite}entity/${encodeURIComponent(triple.object.id)}`;

      rdf += `  <ite:SemanticTriple rdf:about="${tripleUri}">
    <ite:subject rdf:resource="${subjectUri}"/>
    <ite:predicate>${triple.predicate.type}</ite:predicate>
    <ite:object rdf:resource="${objectUri}"/>
    <ite:confidence rdf:datatype="http://www.w3.org/2001/XMLSchema#float">${triple.confidence}</ite:confidence>
`;

      if (triple.context) {
        rdf += `    <ite:context>${this.escapeXML(triple.context)}</ite:context>
`;
      }

      rdf += `  </ite:SemanticTriple>

`;
    });

    rdf += '</rdf:RDF>';
    return rdf;
  }

  private static exportToTurtle(
    data: ExportData,
    _options: ExportOptions
  ): string {
    const prefixes = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ite: <http://italian-triple-extractor.org/ontology#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .

`;

    let turtle = prefixes;

    // Export entities
    data.entities.forEach(entity => {
      const entityId = `ite:entity_${entity.id}`;

      turtle += `${entityId} a ite:Entity ;
  rdfs:label "${this.escapeTurtle(entity.text)}" ;
  ite:entityType "${entity.type}" ;
  ite:confidence ${entity.confidence} ;
  ite:startOffset ${entity.startOffset} ;
  ite:endOffset ${entity.endOffset}`;

      if (entity.metadata?.region) {
        turtle += ` ;
  ite:region "${this.escapeTurtle(entity.metadata.region)}"`;
      }

      if (entity.wikipediaUrl) {
        turtle += ` ;
  rdfs:seeAlso <${entity.wikipediaUrl}>`;
      }

      turtle += ' .\n\n';
    });

    // Export triples
    data.triples.forEach(triple => {
      const tripleId = `ite:triple_${triple.id}`;
      const subjectId = `ite:entity_${triple.subject.id}`;
      const objectId = `ite:entity_${triple.object.id}`;

      turtle += `${tripleId} a ite:SemanticTriple ;
  ite:subject ${subjectId} ;
  ite:predicate "${triple.predicate.type}" ;
  ite:object ${objectId} ;
  ite:confidence ${triple.confidence}`;

      if (triple.context) {
        turtle += ` ;
  ite:context "${this.escapeTurtle(triple.context)}"`;
      }

      turtle += ' .\n\n';
    });

    return turtle;
  }

  private static exportToXML(data: ExportData, options: ExportOptions): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ItalianTripleExtraction>
`;

    if (options.includeMetadata) {
      xml += `  <metadata>
    <exportedAt>${data.metadata.exportedAt}</exportedAt>
    <tool>${data.metadata.tool}</tool>
    <version>${data.metadata.version}</version>
    <language>${data.metadata.language}</language>
  </metadata>
`;
    }

    // Export entities
    xml += `  <entities count="${data.entities.length}">
`;
    data.entities.forEach(entity => {
      xml += `    <entity id="${entity.id}">
      <text>${this.escapeXML(entity.text)}</text>
      <type>${entity.type}</type>
      <confidence>${entity.confidence}</confidence>
      <position start="${entity.startOffset}" end="${entity.endOffset}"/>
`;

      if (entity.metadata?.region) {
        xml += `      <region>${this.escapeXML(entity.metadata.region)}</region>
`;
      }

      if (entity.wikipediaUrl) {
        xml += `      <wikipediaUrl>${this.escapeXML(entity.wikipediaUrl)}</wikipediaUrl>
`;
      }

      xml += `    </entity>
`;
    });
    xml += `  </entities>
`;

    // Export triples
    xml += `  <triples count="${data.triples.length}">
`;
    data.triples.forEach(triple => {
      xml += `    <triple id="${triple.id}">
      <subject id="${triple.subject.id}">${this.escapeXML(triple.subject.text)}</subject>
      <predicate type="${triple.predicate.type}">${this.escapeXML(triple.predicate.label)}</predicate>
      <object id="${triple.object.id}">${this.escapeXML(triple.object.text)}</object>
      <confidence>${triple.confidence}</confidence>
`;

      if (triple.context) {
        xml += `      <context>${this.escapeXML(triple.context)}</context>
`;
      }

      xml += `    </triple>
`;
    });
    xml += `  </triples>
`;

    xml += '</ItalianTripleExtraction>';
    return xml;
  }

  // Utility methods
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static escapeTurtle(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private static calculateOverallConfidence(
    entities: ItalianEntity[],
    triples: SemanticTriple[]
  ): number {
    const allConfidences = [
      ...entities.map(e => e.confidence),
      ...triples.map(t => t.confidence),
    ];

    if (allConfidences.length === 0) return 0;

    return (
      allConfidences.reduce((sum, conf) => sum + conf, 0) /
      allConfidences.length
    );
  }

  private static generateFilename(extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `italian-triple-extraction-${timestamp}.${extension}`;
  }

  // Quick export methods for common formats
  static async exportAsJSON(
    entities: ItalianEntity[],
    triples: SemanticTriple[]
  ): Promise<void> {
    await this.exportResults(entities, triples, {
      format: 'json',
      includeMetadata: true,
      includeAnalytics: false,
    });
  }

  static async exportAsCSV(
    entities: ItalianEntity[],
    triples: SemanticTriple[]
  ): Promise<void> {
    await this.exportResults(entities, triples, {
      format: 'csv',
      includeMetadata: true,
      includeAnalytics: false,
    });
  }

  static async exportAsRDF(
    entities: ItalianEntity[],
    triples: SemanticTriple[]
  ): Promise<void> {
    await this.exportResults(entities, triples, {
      format: 'rdf',
      includeMetadata: true,
      includeAnalytics: false,
    });
  }
}
