/**
 * Google Gemini API integration for Italian text processing
 * Specialized for Italian semantic triple extraction with cultural context
 */

import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

export interface APIQuotaStatus {
  requestsUsed: number;
  requestsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  resetTime: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerRequest: number;
  retryAttempts: number;
  baseDelayMs: number;
}

export class GeminiAPIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private rateLimitConfig: RateLimitConfig;
  private lastRequestTime = 0;
  private requestCount = 0;
  private quotaStatus: APIQuotaStatus;

  constructor(apiKey?: string, rateLimitConfig?: Partial<RateLimitConfig>) {
    this.rateLimitConfig = {
      maxRequestsPerMinute: 60,
      maxTokensPerRequest: 32768,
      retryAttempts: 3,
      baseDelayMs: 1000,
      ...rateLimitConfig,
    };

    this.quotaStatus = {
      requestsUsed: 0,
      requestsLimit: 1000,
      tokensUsed: 0,
      tokensLimit: 1000000,
      resetTime: Date.now() + 24 * 60 * 60 * 1000,
    };

    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string): void {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);

      // Configure model with Italian-optimized settings
      const generationConfig: GenerationConfig = {
        temperature: 0.3, // Lower temperature for more precise entity extraction
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        candidateCount: 1,
      };

      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro-latest',
        generationConfig,
      });

      console.log(
        'Gemini API initialized successfully for Italian text processing'
      );
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new Error('Invalid API key or initialization failed');
    }
  }

  isInitialized(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  async analyzeItalianText(
    text: string,
    analysisType: 'entities' | 'triples' | 'both' = 'both',
    chunkSize: number = 4000
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error(
        'Gemini API not initialized. Please provide a valid API key.'
      );
    }

    // Check text length and chunk if necessary
    if (text.length > chunkSize) {
      return this.analyzeTextInChunks(text, analysisType, chunkSize);
    }

    const prompt = this.buildItalianAnalysisPrompt(text, analysisType);

    return this.withRetry(async () => {
      await this.enforceRateLimit();

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      // Check for safety issues
      if (response.promptFeedback?.blockReason) {
        throw new Error(
          `Content blocked: ${response.promptFeedback.blockReason}`
        );
      }

      const analysisResult = response.text();
      this.updateQuotaStatus(prompt, analysisResult);

      return this.parseAnalysisResponse(analysisResult, analysisType);
    });
  }

  private buildItalianAnalysisPrompt(
    text: string,
    analysisType: string
  ): string {
    const italianContext = this.getItalianContextualInstructions();

    const basePrompt = `Sei un esperto analista di testo semantico specializzato nella lingua e cultura italiana.

CONTESTO CULTURALE ITALIANO:
${italianContext}

TESTO DA ANALIZZARE:
"""
${text}
"""

ISTRUZIONI SPECIFICHE PER L'ANALISI:
- Applica una profonda conoscenza della geografia italiana (8000+ comuni, 20 regioni, 110 province)
- Riconosci personalità italiane storiche e contemporanee in tutti i settori
- Identifica istituzioni italiane (governo, università, enti culturali)
- Rileva eventi storici, culturali e tradizioni regionali italiane
- Distingui tra termini standard e varianti dialettali/regionali
- Considera il contesto storico e culturale italiano
- Mantieni alta precisione (confidenza minima 0.6) per evitare falsi positivi
- Fornisci metadati culturali e geografici quando rilevanti

FORMATO OUTPUT: JSON strutturato valido con encoding UTF-8 per caratteri italiani.
`;

    if (analysisType === 'entities') {
      return basePrompt + this.getAdvancedEntityExtractionInstructions();
    } else if (analysisType === 'triples') {
      return basePrompt + this.getAdvancedTripleExtractionInstructions();
    } else {
      return (
        basePrompt +
        this.getAdvancedEntityExtractionInstructions() +
        this.getAdvancedTripleExtractionInstructions()
      );
    }
  }

  private getAdvancedEntityExtractionInstructions(): string {
    return `
ESTRAZIONE ENTITÀ ITALIANE AVANZATA:
Restituisci un oggetto JSON con:
{
  "entities": [
    {
      "text": "testo esatto dell'entità",
      "type": "ITALIAN_CITY|ITALIAN_REGION|ITALIAN_PROVINCE|PERSON|HISTORICAL_FIGURE|POLITICIAN|ARTIST|WRITER|ORGANIZATION|COMPANY|INSTITUTION|UNIVERSITY|MONUMENT|LANDMARK|PIAZZA|DATE|HISTORICAL_EVENT|CULTURAL_EVENT|FESTIVAL|TRADITION|CUISINE|ITALIAN_BRAND|ITALIAN_PRODUCT|MISCELLANEOUS",
      "startOffset": numero_posizione_inizio,
      "endOffset": numero_posizione_fine,
      "confidence": 0.6-1.0,
      "metadata": {
        "region": "regione italiana se applicabile",
        "province": "provincia italiana se applicabile",
        "culturalContext": "contesto culturale specifico",
        "historicalPeriod": "periodo storico se rilevante",
        "coordinates": {"latitude": num, "longitude": num} /* solo per luoghi */,
        "dialectalVariants": ["varianti dialettali"],
        "synonyms": ["sinonimi comuni"],
        "relevanceScore": 0.0-1.0,
        "popularityScore": 0.0-1.0
      }
    }
  ]
}

TIPI DI ENTITÀ SPECIFICHE:
- ITALIAN_CITY: Roma, Milano, Napoli, Torino, Palermo, Genova, Bologna, Firenze, Bari, Catania...
- ITALIAN_REGION: Lombardia, Lazio, Campania, Sicilia, Veneto, Emilia-Romagna, Piemonte, Puglia...
- MONUMENT: Colosseo, Torre di Pisa, Duomo di Milano, Ponte di Rialto, Fontana di Trevi...
- CUISINE: pasta, pizza, risotto, gelato, prosciutto, parmigiano, mozzarella...
- FESTIVAL: Carnevale di Venezia, Palio di Siena, Festival di Sanremo...
`;
  }

  private getAdvancedTripleExtractionInstructions(): string {
    return `
ESTRAZIONE TRIPLE SEMANTICHE ITALIANE:
Restituisci un oggetto JSON con:
{
  "triples": [
    {
      "subject": "entità soggetto",
      "predicate": "TIPO_RELAZIONE_ITALIANA",
      "object": "entità oggetto",
      "confidence": 0.6-1.0,
      "context": "frase o contesto originale"
    }
  ]
}

RELAZIONI ITALIANE SPECIFICHE:
- GEOGRAFICHE: LOCATED_IN, CAPITAL_OF, BORDERS_WITH, PART_OF, NEAR
- PERSONALI: BORN_IN, DIED_IN, LIVED_IN, MAYOR_OF, PRESIDENT_OF, MINISTER_OF
- CULTURALI: CREATED, PAINTED, WROTE, COMPOSED, DESIGNED, BUILT, FOUNDED
- STORICHE: HAPPENED_IN, OCCURRED_DURING, GOVERNED, RULED
- RELIGIOSE: PATRON_SAINT_OF, CELEBRATES, TRADITIONAL_IN
- LINGUISTICHE: DIALECT_OF, VARIANT_OF
- ECONOMICHE: PRODUCES, EXPORTS, HEADQUARTERS_IN
- FAMILIARI: CHILD_OF, MARRIED_TO, DESCENDANT_OF
- ISTITUZIONALI: MEMBER_OF, WORKS_FOR, STUDIED_AT

ESEMPI DI PATTERN ITALIANI:
- "Leonardo da Vinci nacque a Vinci" → {"subject": "Leonardo da Vinci", "predicate": "BORN_IN", "object": "Vinci"}
- "Roma è la capitale d'Italia" → {"subject": "Roma", "predicate": "CAPITAL_OF", "object": "Italia"}
- "Michelangelo dipinse la Cappella Sistina" → {"subject": "Michelangelo", "predicate": "PAINTED", "object": "Cappella Sistina"}
`;
  }

  private getItalianContextualInstructions(): string {
    return `- L'Italia ha 20 regioni: Piemonte, Valle d'Aosta, Lombardia, Trentino-Alto Adige, Veneto, Friuli-Venezia Giulia, Liguria, Emilia-Romagna, Toscana, Umbria, Marche, Lazio, Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna
- Capoluoghi regionali: Roma (Lazio), Milano (Lombardia), Napoli (Campania), Torino (Piemonte), Palermo (Sicilia), Genova (Liguria), Bologna (Emilia-Romagna), Firenze (Toscana), Bari (Puglia), Catania (Sicilia), Venezia (Veneto), Verona (Veneto)
- Istituzioni: Governo italiano, Parlamento, Senato, Camera dei Deputati, Corte Costituzionale, Regioni, Province, Comuni
- Università storiche: Università di Bologna (1088), Università di Padova, Università di Roma La Sapienza, Università Bocconi, Politecnico di Milano
- Monumenti iconici: Colosseo, Torre di Pisa, Duomo di Milano, Ponte di Rialto, Fontana di Trevi, Ponte Vecchio, Arena di Verona
- Tradizioni culinarie regionali: pasta (vari formati regionali), pizza napoletana, risotto milanese, gelato, prosciutto di Parma, parmigiano reggiano, mozzarella di bufala
- Eventi culturali: Festival di Sanremo, Biennale di Venezia, Palio di Siena, Carnevale di Venezia, Festival del Cinema di Roma
- Personalità storiche: Leonardo da Vinci, Michelangelo, Dante Alighieri, Giuseppe Garibaldi, Giulio Cesare, Marco Polo, Cristoforo Colombo
- Brand italiani: Ferrari, Fiat, Alfa Romeo, Armani, Versace, Prada, Dolce & Gabbana, Ferragamo`;
  }

  private async analyzeTextInChunks(
    text: string,
    analysisType: 'entities' | 'triples' | 'both',
    chunkSize: number
  ): Promise<any> {
    const chunks = this.splitTextIntoChunks(text, chunkSize);
    const results = [];

    for (const chunk of chunks) {
      const result = await this.analyzeItalianText(
        chunk.text,
        analysisType,
        chunkSize
      );

      // Adjust offsets based on chunk position
      if (result.entities) {
        result.entities = result.entities.map((entity: any) => ({
          ...entity,
          startOffset: entity.startOffset + chunk.offset,
          endOffset: entity.endOffset + chunk.offset,
        }));
      }

      results.push(result);
    }

    // Merge results
    return this.mergeChunkResults(results, analysisType);
  }

  private splitTextIntoChunks(
    text: string,
    chunkSize: number
  ): Array<{ text: string; offset: number }> {
    const chunks = [];
    let offset = 0;

    while (offset < text.length) {
      let endOffset = Math.min(offset + chunkSize, text.length);

      // Try to break at sentence boundaries
      if (endOffset < text.length) {
        const lastSentenceEnd = text.lastIndexOf('.', endOffset);
        if (lastSentenceEnd > offset + chunkSize * 0.7) {
          endOffset = lastSentenceEnd + 1;
        }
      }

      chunks.push({
        text: text.substring(offset, endOffset),
        offset: offset,
      });

      offset = endOffset;
    }

    return chunks;
  }

  private mergeChunkResults(results: any[], analysisType: string): any {
    const merged: any = {};

    if (analysisType === 'entities' || analysisType === 'both') {
      merged.entities = results.flatMap(r => r.entities || []);
    }

    if (analysisType === 'triples' || analysisType === 'both') {
      merged.triples = results.flatMap(r => r.triples || []);
    }

    return merged;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.rateLimitConfig.maxRequestsPerMinute;

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private updateQuotaStatus(prompt: string, response: string): void {
    const promptTokens = Math.ceil(prompt.length / 4); // Rough estimation
    const responseTokens = Math.ceil(response.length / 4);

    this.quotaStatus.requestsUsed++;
    this.quotaStatus.tokensUsed += promptTokens + responseTokens;

    // Reset if past reset time
    if (Date.now() > this.quotaStatus.resetTime) {
      this.quotaStatus.requestsUsed = 0;
      this.quotaStatus.tokensUsed = 0;
      this.quotaStatus.resetTime = Date.now() + 24 * 60 * 60 * 1000;
    }
  }

  getQuotaStatus(): APIQuotaStatus {
    return { ...this.quotaStatus };
  }

  private parseAnalysisResponse(response: string, analysisType: string): any {
    try {
      // Remove markdown formatting if present
      let cleanResponse = response.replace(/```json\n?|\n?```/g, '');

      // Remove any text before the JSON
      const jsonStart = cleanResponse.indexOf('{');
      if (jsonStart > 0) {
        cleanResponse = cleanResponse.substring(jsonStart);
      }

      // Remove any text after the JSON
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonEnd !== -1) {
        cleanResponse = cleanResponse.substring(0, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleanResponse);

      // Validate and clean the response
      return this.validateAndCleanResponse(parsed, analysisType);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', response);

      // Try to extract partial data
      const partialData = this.extractPartialData(response, analysisType);
      if (partialData) {
        return partialData;
      }

      // Return empty structure based on analysis type
      if (analysisType === 'entities') {
        return { entities: [] };
      } else if (analysisType === 'triples') {
        return { triples: [] };
      } else {
        return { entities: [], triples: [] };
      }
    }
  }

  private validateAndCleanResponse(response: any, analysisType: string): any {
    const cleaned: any = {};

    if (
      (analysisType === 'entities' || analysisType === 'both') &&
      response.entities
    ) {
      cleaned.entities = response.entities.filter(
        (entity: any) =>
          entity.text &&
          entity.type &&
          typeof entity.confidence === 'number' &&
          entity.confidence >= 0.6 // Minimum confidence threshold
      );
    }

    if (
      (analysisType === 'triples' || analysisType === 'both') &&
      response.triples
    ) {
      cleaned.triples = response.triples.filter(
        (triple: any) =>
          triple.subject &&
          triple.predicate &&
          triple.object &&
          typeof triple.confidence === 'number' &&
          triple.confidence >= 0.6 // Minimum confidence threshold
      );
    }

    return cleaned;
  }

  private extractPartialData(
    response: string,
    analysisType: string
  ): any | null {
    try {
      // Try to extract entities using regex
      const entityMatches = response.match(/"entities":\s*\[(.*?)\]/s);
      const tripleMatches = response.match(/"triples":\s*\[(.*?)\]/s);

      const result: any = {};

      if (
        entityMatches &&
        (analysisType === 'entities' || analysisType === 'both')
      ) {
        try {
          result.entities = JSON.parse(`[${entityMatches[1]}]`);
        } catch {
          result.entities = [];
        }
      }

      if (
        tripleMatches &&
        (analysisType === 'triples' || analysisType === 'both')
      ) {
        try {
          result.triples = JSON.parse(`[${tripleMatches[1]}]`);
        } catch {
          result.triples = [];
        }
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempGenAI = new GoogleGenerativeAI(apiKey);
      const tempModel = tempGenAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const result = await tempModel.generateContent('Test');
      await result.response;

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Rate limiting and retry logic
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }

    throw new Error('All retry attempts failed');
  }
}
