/**
 * Types for Italian entity extraction and recognition
 */

export interface ItalianEntity {
  id: string;
  text: string;
  type: ItalianEntityType;
  startOffset: number;
  endOffset: number;
  confidence: number;
  wikipediaUrl?: string;
  dbpediaUrl?: string;
  metadata?: ItalianEntityMetadata;
}

export enum ItalianEntityType {
  // Persone
  PERSON = 'PERSON',
  HISTORICAL_FIGURE = 'HISTORICAL_FIGURE',
  POLITICIAN = 'POLITICIAN',
  ARTIST = 'ARTIST',
  WRITER = 'WRITER',
  SCIENTIST = 'SCIENTIST',

  // Organizzazioni
  ORGANIZATION = 'ORGANIZATION',
  COMPANY = 'COMPANY',
  INSTITUTION = 'INSTITUTION',
  POLITICAL_PARTY = 'POLITICAL_PARTY',
  UNIVERSITY = 'UNIVERSITY',
  MUSEUM = 'MUSEUM',

  // Luoghi italiani
  LOCATION = 'LOCATION',
  ITALIAN_CITY = 'ITALIAN_CITY',
  ITALIAN_REGION = 'ITALIAN_REGION',
  ITALIAN_PROVINCE = 'ITALIAN_PROVINCE',
  MONUMENT = 'MONUMENT',
  LANDMARK = 'LANDMARK',
  PIAZZA = 'PIAZZA',

  // Tempo
  DATE = 'DATE',
  TIME = 'TIME',
  PERIOD = 'PERIOD',
  ITALIAN_HOLIDAY = 'ITALIAN_HOLIDAY',
  HISTORICAL_EVENT = 'HISTORICAL_EVENT',

  // Valori
  MONETARY = 'MONETARY',
  PERCENTAGE = 'PERCENTAGE',
  NUMBER = 'NUMBER',

  // Eventi e cultura italiana
  CULTURAL_EVENT = 'CULTURAL_EVENT',
  FESTIVAL = 'FESTIVAL',
  TRADITION = 'TRADITION',
  CUISINE = 'CUISINE',

  // Prodotti e brand italiani
  ITALIAN_BRAND = 'ITALIAN_BRAND',
  ITALIAN_PRODUCT = 'ITALIAN_PRODUCT',

  // Altro
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export interface ItalianEntityMetadata {
  // Dati geografici per luoghi
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  region?: string;
  province?: string;

  // Dati temporali
  startDate?: string;
  endDate?: string;

  // Dati culturali
  culturalContext?: string;
  historicalPeriod?: string;

  // Collegamenti
  relatedEntities?: string[];

  // Metadata linguistici
  dialectalVariants?: string[];
  synonyms?: string[];

  // Valutazione
  relevanceScore?: number;
  popularityScore?: number;
}

export interface EntityExtractionResult {
  entities: ItalianEntity[];
  confidence: number;
  processingTime: number;
  textLength: number;
  language: 'it' | 'unknown';
}

export interface EntityHighlight {
  entityId: string;
  startOffset: number;
  endOffset: number;
  type: ItalianEntityType;
  cssClass: string;
}
