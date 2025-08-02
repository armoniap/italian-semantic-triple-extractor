import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { SemanticTriple } from '@/types/triples';
import { useApplication } from '@/store/ApplicationStore';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Filter,
} from 'lucide-react';

interface TripleGraphProps {
  triples: SemanticTriple[];
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

interface GraphNode {
  id: string;
  text: string;
  type: 'subject' | 'object';
  entityType?: string;
  connections: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  predicate: string;
  predicateType: string;
  confidence: number;
  tripleId: string;
}

const TripleGraph: React.FC<TripleGraphProps> = ({
  triples,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectEntity, selectTriple } = useApplication();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPredicateType, setSelectedPredicateType] =
    useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Get Italian labels for predicates
  const getItalianPredicateLabel = (type: string): string => {
    const labels: Record<string, string> = {
      LOCATED_IN: 'si trova in',
      BORN_IN: 'nato in',
      DIED_IN: 'morto in',
      FOUNDED: 'ha fondato',
      CREATED: 'ha creato',
      PAINTED: 'ha dipinto',
      WROTE: 'ha scritto',
      COMPOSED: 'ha composto',
      DIRECTED: 'ha diretto',
      ACTED_IN: 'ha recitato in',
      MAYOR_OF: 'sindaco di',
      CAPITAL_OF: 'capitale di',
      MEMBER_OF: 'membro di',
      WORKS_FOR: 'lavora per',
      PART_OF: 'parte di',
      BORDERS_WITH: 'confina con',
      NEAR: 'vicino a',
      FLOWS_THROUGH: 'attraversa',
      PATRON_SAINT_OF: 'santo patrono di',
      CELEBRATES: 'celebra',
      SPECIALTY_OF: 'specialità di',
      PRODUCED_IN: 'prodotto in',
    };
    return labels[type] || type.toLowerCase().replace('_', ' ');
  };

  // Prepare graph data
  const prepareGraphData = useCallback(() => {
    const filteredTriples = triples.filter(
      triple =>
        triple.confidence >= minConfidence &&
        (selectedPredicateType === 'all' ||
          triple.predicate.type === selectedPredicateType)
    );

    const nodeMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    filteredTriples.forEach(triple => {
      // Add subject node
      if (!nodeMap.has(triple.subject.id)) {
        nodeMap.set(triple.subject.id, {
          id: triple.subject.id,
          text: triple.subject.text,
          type: 'subject',
          entityType: triple.subject.type,
          connections: 0,
        });
      }

      // Add object node
      if (!nodeMap.has(triple.object.id)) {
        nodeMap.set(triple.object.id, {
          id: triple.object.id,
          text: triple.object.text,
          type: 'object',
          entityType: triple.object.type,
          connections: 0,
        });
      }

      // Increment connections
      nodeMap.get(triple.subject.id)!.connections++;
      nodeMap.get(triple.object.id)!.connections++;

      // Add link
      links.push({
        source: triple.subject.id,
        target: triple.object.id,
        predicate: getItalianPredicateLabel(triple.predicate.type),
        predicateType: triple.predicate.type,
        confidence: triple.confidence,
        tripleId: triple.id,
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }, [triples, selectedPredicateType, minConfidence]);

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!svgRef.current || triples.length === 0) return;

    const { nodes, links } = prepareGraphData();
    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const currentWidth = isFullscreen ? window.innerWidth - 40 : width;
    const currentHeight = isFullscreen ? window.innerHeight - 200 : height;

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', event => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    const container = svg.append('g');

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id(d => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(currentWidth / 2, currentHeight / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow markers for directed edges
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    // Create links
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('g')
      .data(links)
      .join('g')
      .attr('class', 'link-group');

    // Link lines
    const linkLines = link
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', d => Math.sqrt(d.confidence * 4))
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onEdgeClick) {
          onEdgeClick(d.tripleId);
        }
        // Find and select the corresponding triple
        const triple = triples.find(t => t.id === d.tripleId);
        if (triple) {
          selectTriple(triple);
        }
      })
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#009246').attr('stroke-width', 3);

        // Show tooltip
        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000').html(`
            <div><strong>${d.predicate}</strong></div>
            <div>Confidenza: ${Math.round(d.confidence * 100)}%</div>
          `);

        if (event && 'pageX' in event && 'pageY' in event) {
          tooltip
            .style('left', (event as MouseEvent).pageX + 10 + 'px')
            .style('top', (event as MouseEvent).pageY - 10 + 'px');
        }
      })
      .on('mouseout', function (_event, d) {
        d3.select(this)
          .attr('stroke', '#999')
          .attr('stroke-width', Math.sqrt(d.confidence * 4));
        d3.selectAll('.graph-tooltip').remove();
      });

    // Link labels (predicates)
    const linkLabels = link
      .append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('pointer-events', 'none')
      .text(d => d.predicate);

    // Create nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node circles
    node
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(20, d.connections * 3)))
      .attr('fill', d => {
        // Italian-themed colors based on entity type
        if (d.entityType?.includes('ITALIAN')) return '#009246'; // Italian green
        if (d.entityType?.includes('PERSON')) return '#3B82F6'; // Blue
        if (d.entityType?.includes('LOCATION')) return '#10B981'; // Green
        if (d.entityType?.includes('ORGANIZATION')) return '#8B5CF6'; // Purple
        if (d.entityType?.includes('DATE') || d.entityType?.includes('TIME'))
          return '#F59E0B'; // Amber
        if (d.entityType?.includes('EVENT')) return '#EC4899'; // Pink
        return '#6B7280'; // Gray default
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        }
        // Find and select the corresponding entity
        const allEntities = [
          ...triples.map(t => t.subject),
          ...triples.map(t => t.object),
        ];
        const entity = allEntities.find(e => e.id === d.id);
        if (entity && entity.entityRef) {
          selectEntity(entity.entityRef);
        }
      })
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#CE2B37').attr('stroke-width', 3); // Italian red

        // Show tooltip
        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000').html(`
            <div><strong>${d.text}</strong></div>
            <div>Tipo: ${d.entityType || 'N/A'}</div>
            <div>Connessioni: ${d.connections}</div>
          `);

        if (event && 'pageX' in event && 'pageY' in event) {
          tooltip
            .style('left', (event as MouseEvent).pageX + 10 + 'px')
            .style('top', (event as MouseEvent).pageY - 10 + 'px');
        }
      })
      .on('mouseout', function (_event, _d) {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2);
        d3.selectAll('.graph-tooltip').remove();
      });

    // Node labels
    node
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text(d =>
        d.text.length > 12 ? d.text.substring(0, 12) + '...' : d.text
      );

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkLines
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      linkLabels
        .attr(
          'x',
          d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2
        )
        .attr(
          'y',
          d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2
        );

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cleanup function
    return () => {
      simulation.stop();
      d3.selectAll('.graph-tooltip').remove();
    };
  }, [
    triples,
    prepareGraphData,
    width,
    height,
    isFullscreen,
    onNodeClick,
    onEdgeClick,
    selectEntity,
    selectTriple,
  ]);

  // Get unique predicate types for filter
  const predicateTypes = Array.from(
    new Set(triples.map(t => t.predicate.type))
  );

  // Reset visualization
  const resetGraph = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = d3.zoom<SVGSVGElement, unknown>();
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }, []);

  // Export graph as SVG
  const exportGraph = useCallback(() => {
    if (svgRef.current) {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgElement);
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grafo-triple-semantiche.svg';
      link.click();
    }
  }, []);

  if (triples.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <div className="text-gray-600">Nessuna tripla da visualizzare</div>
          <div className="text-xs text-gray-500 mt-2">
            Analizza del testo per vedere le relazioni semantiche
          </div>
        </div>
      </div>
    );
  }

  const currentWidth = isFullscreen ? window.innerWidth - 40 : width;
  const currentHeight = isFullscreen ? window.innerHeight - 200 : height;

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-lg border ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : 'p-4'
      }`}
    >
      {/* Header */}
      <div
        className={`${isFullscreen ? 'p-4 border-b' : 'mb-4'} flex items-center justify-between`}
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-2xl mr-2">🇮🇹</span>
            Grafo delle Relazioni Semantiche Italiane
          </h3>
          <p className="text-sm text-gray-600">
            Visualizzazione interattiva D3.js delle triple estratte
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetGraph}
            className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
            title="Reset Vista"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={exportGraph}
            className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
            title="Esporta SVG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
            title={isFullscreen ? 'Esci da Schermo Intero' : 'Schermo Intero'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`${isFullscreen ? 'px-4 pb-4 border-b' : 'mb-4'} flex items-center space-x-4 text-sm`}
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="text-gray-700">Tipo Relazione:</label>
          <select
            value={selectedPredicateType}
            onChange={e => setSelectedPredicateType(e.target.value)}
            className="form-input text-xs py-1 px-2 h-8"
          >
            <option value="all">Tutte</option>
            {predicateTypes.map(type => (
              <option key={type} value={type}>
                {getItalianPredicateLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-gray-700">Confidenza min:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minConfidence}
            onChange={e => setMinConfidence(parseFloat(e.target.value))}
            className="w-20"
          />
          <span className="text-gray-600 w-8">
            {Math.round(minConfidence * 100)}%
          </span>
        </div>
      </div>

      {/* Graph container */}
      <div
        className={`border rounded-lg overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}
      >
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          className="w-full h-full"
          style={{ background: '#fafafa' }}
        />
      </div>

      {/* Graph legend and stats */}
      <div
        className={`${isFullscreen ? 'p-4 border-t' : 'mt-4'} flex items-center justify-between text-sm text-gray-500`}
      >
        <div className="flex items-center space-x-4">
          <span>
            {
              triples.filter(
                t =>
                  t.confidence >= minConfidence &&
                  (selectedPredicateType === 'all' ||
                    t.predicate.type === selectedPredicateType)
              ).length
            }{' '}
            relazioni visualizzate •{' '}
            {
              new Set([
                ...triples.map(t => t.subject.id),
                ...triples.map(t => t.object.id),
              ]).size
            }{' '}
            entità totali
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Persone</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Luoghi</span>
          </div>
          <div className="flex items-center space-x-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#009246' }}
            ></div>
            <span>Italiani</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Organizzazioni</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-gray-400"></div>
            <span>Relazioni</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        className={`${isFullscreen ? 'px-4 pb-4' : 'mt-2'} text-xs text-gray-500`}
      >
        <strong>Istruzioni:</strong> Trascina i nodi per riposizionarli • Clicca
        su nodi e collegamenti per selezionarli • Usa la rotella per zoom •
        Trascina per panoramica
      </div>
    </div>
  );
};

export default TripleGraph;
