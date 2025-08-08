/**
 * Italian Cultural Knowledge Base Service
 * Pre-populates vector database with Italian cultural, historical and geographical data
 */

import GeminiEmbeddingService from './embeddingService';
import ItalianVectorStore from './vectorStore';

export interface ItalianKnowledgeItem {
  id: string;
  text: string;
  category:
    | 'historical'
    | 'cultural'
    | 'geographical'
    | 'artistic'
    | 'culinary'
    | 'religious';
  subcategory?: string;
  region?: string;
  period?: string;
  importance: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export class ItalianKnowledgeBaseService {
  private embeddingService: GeminiEmbeddingService;
  private vectorStore: ItalianVectorStore;

  constructor(
    embeddingService: GeminiEmbeddingService,
    vectorStore: ItalianVectorStore
  ) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  /**
   * Pre-populate the knowledge base with Italian cultural data
   */
  async populateKnowledgeBase(): Promise<void> {
    console.log('Starting Italian knowledge base population...');

    try {
      const knowledgeItems = this.generateItalianKnowledgeItems();

      // Process in batches to avoid overwhelming the API
      const batchSize = 20;
      let processedCount = 0;

      for (let i = 0; i < knowledgeItems.length; i += batchSize) {
        const batch = knowledgeItems.slice(i, i + batchSize);

        console.log(
          `Processing knowledge batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(knowledgeItems.length / batchSize)}`
        );

        // Generate embeddings for the batch
        const texts = batch.map(item => item.text);
        const embeddingsResult = await this.embeddingService.embedTexts(
          texts,
          GeminiEmbeddingService.createConfig('document')
        );

        // Prepare documents for vector store
        const documents = batch.map((item, index) => {
          // Flatten metadata to ensure ChromaDB compatibility (no undefined values)
          const flatMetadata: Record<string, string | number | boolean | null> =
            {
              type: 'knowledge' as const,
              category: item.category,
              importance: item.importance,
              language: 'it' as const,
              createdAt: Date.now(),
            };

          // Add optional fields only if they exist
          if (item.subcategory) flatMetadata.subcategory = item.subcategory;
          if (item.region) flatMetadata.region = item.region;
          if (item.period) flatMetadata.period = item.period;

          // Flatten additional metadata
          if (item.metadata) {
            Object.entries(item.metadata).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                  flatMetadata[key] = JSON.stringify(value);
                } else if (Array.isArray(value)) {
                  flatMetadata[key] = value.join(', ');
                } else if (
                  typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean'
                ) {
                  flatMetadata[key] = value;
                }
              }
            });
          }

          return {
            id: item.id,
            document: item.text,
            embedding: embeddingsResult.embeddings[index].embedding,
            metadata: flatMetadata,
          };
        });

        // Add to vector store
        const collection = await this.vectorStore['createCollection'](
          'italian_knowledge_base',
          {
            description: 'Italian cultural and historical knowledge base',
            metadata: { language: 'italian', type: 'knowledge' },
          }
        );

        await collection.add({
          ids: documents.map(d => d.id),
          documents: documents.map(d => d.document),
          embeddings: documents.map(d => d.embedding),
          metadatas: documents.map(d => d.metadata),
        });

        processedCount += batch.length;
        console.log(
          `Processed ${processedCount}/${knowledgeItems.length} knowledge items`
        );

        // Rate limiting
        if (i + batchSize < knowledgeItems.length) {
          await this.delay(500); // 500ms between batches
        }
      }

      console.log(
        `Italian knowledge base populated with ${processedCount} items`
      );
    } catch (error) {
      console.error('Failed to populate knowledge base:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive Italian knowledge items
   */
  private generateItalianKnowledgeItems(): ItalianKnowledgeItem[] {
    const items: ItalianKnowledgeItem[] = [];

    // Historical figures
    items.push(...this.getHistoricalFigures());

    // Monuments and landmarks
    items.push(...this.getMonumentsAndLandmarks());

    // Cultural traditions
    items.push(...this.getCulturalTraditions());

    // Regional specialties
    items.push(...this.getRegionalSpecialties());

    // Religious sites and figures
    items.push(...this.getReligiousSites());

    // Artistic movements and works
    items.push(...this.getArtisticWorks());

    return items;
  }

  private getHistoricalFigures(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'leonardo_da_vinci',
        text: "Leonardo da Vinci nacque a Vinci nel 1452. Fu pittore, inventore, scienziato e ingegnere del Rinascimento. Dipinse la Gioconda e L'Ultima Cena. Morì in Francia nel 1519.",
        category: 'historical',
        subcategory: 'renaissance_artist',
        region: 'Toscana',
        period: 'Rinascimento',
        importance: 'high',
        metadata: {
          birthYear: 1452,
          deathYear: 1519,
          birthPlace: 'Vinci',
          occupation: ['pittore', 'inventore', 'scienziato'],
          famousWorks: ['Gioconda', 'Ultima Cena'],
        },
      },
      {
        id: 'michelangelo_buonarroti',
        text: 'Michelangelo Buonarroti nacque a Caprese nel 1475. Scultore, pittore e architetto del Rinascimento. Scolpì il David e la Pietà, dipinse la Cappella Sistina. Morì a Roma nel 1564.',
        category: 'historical',
        subcategory: 'renaissance_artist',
        region: 'Toscana',
        period: 'Rinascimento',
        importance: 'high',
        metadata: {
          birthYear: 1475,
          deathYear: 1564,
          birthPlace: 'Caprese',
          occupation: ['scultore', 'pittore', 'architetto'],
          famousWorks: ['David', 'Pietà', 'Cappella Sistina'],
        },
      },
      {
        id: 'dante_alighieri',
        text: 'Dante Alighieri nacque a Firenze nel 1265. Poeta e scrittore, padre della lingua italiana. Scrisse la Divina Commedia, capolavoro della letteratura mondiale. Morì a Ravenna nel 1321.',
        category: 'historical',
        subcategory: 'writer',
        region: 'Toscana',
        period: 'Medioevo',
        importance: 'high',
        metadata: {
          birthYear: 1265,
          deathYear: 1321,
          birthPlace: 'Firenze',
          occupation: ['poeta', 'scrittore'],
          famousWorks: ['Divina Commedia'],
          significance: 'padre della lingua italiana',
        },
      },
      {
        id: 'giuseppe_garibaldi',
        text: "Giuseppe Garibaldi nacque a Nizza nel 1807. Generale e patriota, eroe dell'unificazione italiana. Guidò la spedizione dei Mille per liberare il Sud Italia. Morì a Caprera nel 1882.",
        category: 'historical',
        subcategory: 'patriot',
        region: 'Sardegna',
        period: 'Risorgimento',
        importance: 'high',
        metadata: {
          birthYear: 1807,
          deathYear: 1882,
          birthPlace: 'Nizza',
          occupation: ['generale', 'patriota'],
          famousEvents: ['Spedizione dei Mille'],
          significance: "eroe dell'unificazione italiana",
        },
      },
    ];
  }

  private getMonumentsAndLandmarks(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'colosseo_roma',
        text: "Il Colosseo si trova nel centro di Roma. Anfiteatro romano costruito tra il 70 e l'80 d.C. Patrimonio UNESCO dal 1980. Simbolo di Roma e dell'Impero Romano.",
        category: 'geographical',
        subcategory: 'monument',
        region: 'Lazio',
        period: 'Romano',
        importance: 'high',
        metadata: {
          city: 'Roma',
          constructionPeriod: '70-80 d.C.',
          unescoSite: true,
          type: 'anfiteatro',
          emperor: 'Vespasiano',
        },
      },
      {
        id: 'torre_di_pisa',
        text: "La Torre di Pisa si trova in Piazza dei Miracoli a Pisa. Campanile pendente costruito nel XII secolo. Patrimonio UNESCO. Simbolo della Toscana e dell'architettura pisana.",
        category: 'geographical',
        subcategory: 'monument',
        region: 'Toscana',
        period: 'Medievale',
        importance: 'high',
        metadata: {
          city: 'Pisa',
          constructionPeriod: 'XII secolo',
          unescoSite: true,
          type: 'campanile',
          characteristic: 'pendente',
        },
      },
      {
        id: 'duomo_milano',
        text: 'Il Duomo di Milano si trova in Piazza del Duomo. Cattedrale gotica costruita tra il 1386 e il 1965. Simbolo di Milano con le sue guglie e la Madonnina. Terza chiesa cattolica al mondo per grandezza.',
        category: 'geographical',
        subcategory: 'religious_monument',
        region: 'Lombardia',
        period: 'Gotico',
        importance: 'high',
        metadata: {
          city: 'Milano',
          constructionStart: 1386,
          constructionEnd: 1965,
          style: 'gotico',
          ranking: 'terza chiesa cattolica per grandezza',
        },
      },
      {
        id: 'ponte_vecchio_firenze',
        text: 'Ponte Vecchio attraversa il fiume Arno a Firenze. Ponte medievale con botteghe di orafi. Unico ponte di Firenze risparmiato durante la Seconda Guerra Mondiale. Simbolo di Firenze.',
        category: 'geographical',
        subcategory: 'bridge',
        region: 'Toscana',
        period: 'Medievale',
        importance: 'high',
        metadata: {
          city: 'Firenze',
          river: 'Arno',
          type: 'ponte con botteghe',
          shops: 'orafi',
          warSurvival: true,
        },
      },
    ];
  }

  private getCulturalTraditions(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'carnevale_venezia',
        text: 'Il Carnevale di Venezia è una tradizione secolare. Si celebra ogni anno prima della Quaresima con maschere elaborate e costumi storici. Famoso in tutto il mondo per la sua eleganza.',
        category: 'cultural',
        subcategory: 'festival',
        region: 'Veneto',
        importance: 'high',
        metadata: {
          city: 'Venezia',
          period: 'prima della Quaresima',
          characteristics: ['maschere elaborate', 'costumi storici'],
          fame: 'mondiale',
        },
      },
      {
        id: 'palio_siena',
        text: "Il Palio di Siena si corre in Piazza del Campo due volte l'anno. Corsa di cavalli tra le contrade senesi. Tradizione medievale che risale al 1633. Simbolo dell'identità senese.",
        category: 'cultural',
        subcategory: 'palio',
        region: 'Toscana',
        period: 'Medievale',
        importance: 'high',
        metadata: {
          city: 'Siena',
          location: 'Piazza del Campo',
          frequency: "due volte l'anno",
          startYear: 1633,
          participants: 'contrade senesi',
        },
      },
      {
        id: 'opera_italiana',
        text: "L'opera italiana è nata nel XVI secolo. La Scala di Milano è il teatro più famoso. Compositori come Verdi e Puccini sono conosciuti in tutto il mondo. Patrimonio culturale italiano.",
        category: 'cultural',
        subcategory: 'music',
        importance: 'high',
        metadata: {
          origin: 'XVI secolo',
          famousVenue: 'La Scala di Milano',
          composers: ['Verdi', 'Puccini'],
          status: 'patrimonio culturale',
        },
      },
    ];
  }

  private getRegionalSpecialties(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'pizza_napoletana',
        text: 'La pizza napoletana è nata a Napoli nel XVIII secolo. Patrimonio UNESCO dal 2017. La Margherita fu creata in onore della Regina Margherita di Savoia nel 1889.',
        category: 'culinary',
        subcategory: 'dish',
        region: 'Campania',
        importance: 'high',
        metadata: {
          city: 'Napoli',
          origin: 'XVIII secolo',
          unescoStatus: '2017',
          famous_variant: 'Margherita',
          namedAfter: 'Regina Margherita di Savoia',
        },
      },
      {
        id: 'parmigiano_reggiano',
        text: 'Il Parmigiano Reggiano è prodotto in Emilia-Romagna e Lombardia. DOP dal 1996. Chiamato "Re dei formaggi". Invecchiato minimo 12 mesi, fino a 36 mesi per le stagionature superiori.',
        category: 'culinary',
        subcategory: 'cheese',
        region: 'Emilia-Romagna',
        importance: 'high',
        metadata: {
          regions: ['Emilia-Romagna', 'Lombardia'],
          dopYear: 1996,
          nickname: 'Re dei formaggi',
          aging: '12-36 mesi',
        },
      },
      {
        id: 'chianti_toscano',
        text: 'Il Chianti è un vino rosso toscano prodotto principalmente con uva Sangiovese. DOCG dal 1984. Prodotto nelle province di Firenze e Siena. Simbolo del vino italiano nel mondo.',
        category: 'culinary',
        subcategory: 'wine',
        region: 'Toscana',
        importance: 'high',
        metadata: {
          grape: 'Sangiovese',
          docgYear: 1984,
          provinces: ['Firenze', 'Siena'],
          status: 'simbolo del vino italiano',
        },
      },
    ];
  }

  private getReligiousSites(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'vaticano_roma',
        text: 'La Città del Vaticano è il più piccolo stato del mondo. Sede del Papa e centro della Chiesa Cattolica. La Basilica di San Pietro e la Cappella Sistina sono i luoghi più famosi.',
        category: 'religious',
        subcategory: 'vatican',
        region: 'Lazio',
        importance: 'high',
        metadata: {
          city: 'Roma',
          status: 'stato più piccolo del mondo',
          role: 'sede del Papa',
          famousSites: ['Basilica di San Pietro', 'Cappella Sistina'],
        },
      },
      {
        id: 'assisi_francesco',
        text: "Assisi è la città natale di San Francesco. Basilica di San Francesco patrimonio UNESCO. Meta di pellegrinaggio cristiano. Centro spirituale dell'Umbria.",
        category: 'religious',
        subcategory: 'pilgrimage_site',
        region: 'Umbria',
        importance: 'high',
        metadata: {
          saint: 'San Francesco',
          unescoSite: true,
          role: 'pellegrinaggio cristiano',
          significance: "centro spirituale dell'Umbria",
        },
      },
    ];
  }

  private getArtisticWorks(): ItalianKnowledgeItem[] {
    return [
      {
        id: 'gioconda_leonardo',
        text: 'La Gioconda di Leonardo da Vinci è conservata al Louvre di Parigi. Dipinta tra il 1503 e il 1519. Il sorriso enigmatico è famoso in tutto il mondo. Capolavoro del Rinascimento italiano.',
        category: 'artistic',
        subcategory: 'painting',
        region: 'Toscana',
        period: 'Rinascimento',
        importance: 'high',
        metadata: {
          artist: 'Leonardo da Vinci',
          location: 'Louvre, Parigi',
          painted: '1503-1519',
          characteristic: 'sorriso enigmatico',
        },
      },
      {
        id: 'david_michelangelo',
        text: "Il David di Michelangelo si trova alla Galleria dell'Accademia di Firenze. Scolpito nel marmo di Carrara tra il 1501 e il 1504. Alto 5,17 metri. Simbolo della Repubblica Fiorentina.",
        category: 'artistic',
        subcategory: 'sculpture',
        region: 'Toscana',
        period: 'Rinascimento',
        importance: 'high',
        metadata: {
          artist: 'Michelangelo',
          location: "Galleria dell'Accademia, Firenze",
          material: 'marmo di Carrara',
          created: '1501-1504',
          height: '5,17 metri',
        },
      },
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if knowledge base is already populated
   */
  async isKnowledgeBasePopulated(): Promise<boolean> {
    try {
      const stats = await this.vectorStore.getStats();
      const knowledgeStats = stats['italian_knowledge_base'];
      return knowledgeStats && knowledgeStats.count > 50; // Threshold for "populated"
    } catch (error) {
      console.warn('Could not check knowledge base status:', error);
      return false;
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(): Promise<Record<string, any>> {
    try {
      const stats = await this.vectorStore.getStats();
      return stats['italian_knowledge_base'] || { count: 0 };
    } catch (error) {
      console.error('Failed to get knowledge base stats:', error);
      return { error: error };
    }
  }
}

export default ItalianKnowledgeBaseService;
