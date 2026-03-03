import { Injectable } from '@angular/core';
import * as d3 from 'd3';

import type { ChordData, ChordLink, ChordNode } from '../../../shared/interfaces/chord-diagram';

interface LabeledChordGroup extends d3.ChordGroup {
  angle?: number;
}

@Injectable({ providedIn: 'root' })
export class ChordBuilder {
  private readonly colorPalette: string[] = [
    '#d62728',
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#aec7e8',
    '#ffbb78',
    '#98df8a',
    '#ff9896',
    '#c5b0d5',
    '#c49c94',
    '#f7b6d2',
    '#c7c7c7',
    '#bcbd22',
    '#dbdb8d',
    '#9edae5',
    '#e0d9e2',
  ];

  private colorScale: d3.ScaleOrdinal<string, string> = d3.scaleOrdinal();

  setGlobalColorDomain(input: ChordData | ChordData[]): void {
    const datasets = Array.isArray(input) ? input : [input];
    const allGroups = Array.from(
      new Set(datasets.flatMap((d) => d.nodes.map((n) => n.group))),
    ).sort();

    this.colorScale = d3.scaleOrdinal<string, string>().domain(allGroups).range(this.colorPalette);
  }

  getColor(group: string): string {
    return this.colorScale(group);
  }

  chunkData(data: ChordData, chunkSize: number): ChordData[] {
    const getKey = (node: ChordNode | { name: string; group: string }) =>
      `${node.name}|${node.group}`;

    const nodeMap = new Map<string, ChordNode>();
    data.nodes.forEach((node) => nodeMap.set(getKey(node), node));

    const adjacency = new Map<string, Set<string>>();
    data.links.forEach(({ source, target }) => {
      const sourceNodes = data.nodes.filter((n) => n.name === source);
      const targetNodes = data.nodes.filter((n) => n.name === target);

      for (const s of sourceNodes) {
        for (const t of targetNodes) {
          const sKey = getKey(s);
          const tKey = getKey(t);

          if (!adjacency.has(sKey)) adjacency.set(sKey, new Set());
          if (!adjacency.has(tKey)) adjacency.set(tKey, new Set());

          adjacency.get(sKey)!.add(tKey);
          adjacency.get(tKey)!.add(sKey);
        }
      }
    });

    const visited = new Set<string>();
    const components: { nodes: ChordNode[]; links: ChordLink[] }[] = [];

    for (const [key] of nodeMap) {
      if (visited.has(key)) continue;

      const queue = [key];
      const componentKeys = new Set<string>();

      while (queue.length) {
        const currentKey = queue.shift()!;
        if (visited.has(currentKey)) continue;

        visited.add(currentKey);
        componentKeys.add(currentKey);

        for (const neighbor of adjacency.get(currentKey) ?? []) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      const nodes = Array.from(componentKeys)
        .map((k) => nodeMap.get(k)!)
        .filter(Boolean);

      const nodeSet = new Set(nodes.map((n) => getKey(n)));
      const links = data.links.filter((link) => {
        const sources = data.nodes.filter((n) => n.name === link.source).map((n) => getKey(n));
        const targets = data.nodes.filter((n) => n.name === link.target).map((n) => getKey(n));
        return sources.some((s) => nodeSet.has(s)) && targets.some((t) => nodeSet.has(t));
      });

      components.push({ nodes, links });
    }

    const chunks: ChordData[] = [];
    let currentNodes: ChordNode[] = [];
    let currentLinks: ChordLink[] = [];
    let currentSize = 0;

    for (const component of components) {
      const size = component.nodes.length;
      if (currentSize + size > chunkSize && currentNodes.length > 0) {
        chunks.push({ nodes: currentNodes, links: currentLinks });
        currentNodes = [];
        currentLinks = [];
        currentSize = 0;
      }

      currentNodes.push(...component.nodes);
      currentLinks.push(...component.links);
      currentSize += size;
    }

    if (currentNodes.length > 0) {
      chunks.push({ nodes: currentNodes, links: currentLinks });
    }

    return chunks;
  }

  // Passing the container element directly resolves the DOM query anti-pattern
  createChordDiagram(containerElement: HTMLElement, data: ChordData): void {
    const svg = d3.select(containerElement).select<SVGSVGElement>('svg');
    svg.selectAll('*').remove();

    const width = 800;
    const height = 800;
    const outerRadius = Math.min(width, height) * 0.4 - 100;
    const innerRadius = outerRadius - 0.1;

    const nodes = this.prepareNodes(data);
    const matrix = this.buildMatrix(nodes, data.links);
    const chords = d3.chord().padAngle(0.06).sortSubgroups(d3.descending)(matrix);

    const svgGroup = this.initSvgGroup(svg, width, height);

    const grouped = this.groupChordGroupsByName(chords.groups, nodes);
    this.drawGroupArcs(svgGroup, grouped, outerRadius);
    this.drawGroupLabels(svgGroup, grouped, outerRadius);
    this.drawNodeLabels(svgGroup, chords, nodes, outerRadius);
    this.drawRibbons(svgGroup, chords, innerRadius);
  }

  private prepareNodes(data: ChordData): ChordNode[] {
    return data.nodes
      .map((node: ChordNode) => ({ ...node, id: `${node.name}_${node.group}` }))
      .sort((a, b) => a.group.localeCompare(b.group));
  }

  private buildMatrix(nodes: ChordNode[], links: ChordLink[]): number[][] {
    const nodeIndex = new Map(nodes.map((node: ChordNode, i: number) => [node.id, i]));
    const matrix = Array(nodes.length)
      .fill(0)
      .map(() => Array(nodes.length).fill(0));

    links.forEach((link) => {
      const sourceNodes = nodes.filter((n) => n.name === link.source);
      const targetNodes = nodes.filter((n) => n.name === link.target);

      sourceNodes.forEach((s) => {
        targetNodes.forEach((t) => {
          if (s.group !== t.group) {
            const i = nodeIndex.get(s.id!);
            const j = nodeIndex.get(t.id!);
            if (i !== undefined && j !== undefined) {
              matrix[i][j] = 1;
              matrix[j][i] = 1;
            }
          }
        });
      });
    });

    return matrix;
  }

  private groupChordGroupsByName(
    groups: d3.ChordGroup[],
    nodes: ChordNode[],
  ): [string, d3.ChordGroup[]][] {
    return d3.groups(groups, (d) => nodes[d.index].group);
  }

  private initSvgGroup(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number,
  ) {
    const extraPadding = 200;
    return svg
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width + extraPadding} ${height + extraPadding}`)
      .style('overflow', 'visible')
      .append('g')
      .attr('transform', `translate(${(width + extraPadding) / 2},${(height + extraPadding) / 2})`);
  }

  private drawGroupArcs(
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    grouped: [string, d3.ChordGroup[]][],
    outerRadius: number,
  ) {
    const arc = d3
      .arc<d3.ChordGroup>()
      .innerRadius(outerRadius + 5)
      .outerRadius(outerRadius + 30);

    svgGroup
      .append('g')
      .attr('class', 'group-highlight')
      .selectAll('path')
      .data(grouped)
      .enter()
      .append('path')
      .attr('d', ([, groupChords]) => {
        const startAngle = d3.min(groupChords, (d) => d.startAngle)!;
        const endAngle = d3.max(groupChords, (d) => d.endAngle)!;
        return arc({
          startAngle,
          endAngle,
          value: 1,
          index: 0,
        } as d3.ChordGroup)!;
      })
      .attr('fill', ([group]) => this.getColor(group));
  }

  private drawGroupLabels(
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    grouped: [string, d3.ChordGroup[]][],
    outerRadius: number,
  ) {
    // Fixed D3 structural bug by generating container nodes
    const groupContainers = svgGroup
      .append('g')
      .attr('class', 'group-labels')
      .selectAll('g.group-label-container')
      .data(grouped)
      .enter()
      .append('g')
      .attr('class', 'group-label-container');

    groupContainers
      .append('path')
      .attr('id', (d, i) => `groupLabelArc-${i}`)
      .attr('d', ([, groupChords]) => {
        const startAngle = d3.min(groupChords, (d) => d.startAngle)!;
        const endAngle = d3.max(groupChords, (d) => d.endAngle)!;
        const radius = outerRadius + 17.5;

        const arcGenerator = d3
          .arc<null>()
          .innerRadius(radius)
          .outerRadius(radius)
          .startAngle(startAngle)
          .endAngle(endAngle);

        return arcGenerator(null)!;
      })
      .style('fill', 'none');

    groupContainers
      .append('text')
      .attr('dy', '5px')
      .append('textPath')
      .attr('xlink:href', (d, i) => `#groupLabelArc-${i}`)
      .attr('startOffset', '25%')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'black')
      .text(([groupName]) => groupName);
  }

  private drawNodeLabels(
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    chords: d3.Chords,
    nodes: ChordNode[],
    outerRadius: number,
  ) {
    const arc = d3
      .arc<d3.ChordGroup>()
      .innerRadius(outerRadius - 0.1)
      .outerRadius(outerRadius);

    const group = svgGroup.append('g').selectAll('g').data(chords.groups).enter().append('g');

    group.append('path').style('fill', '#e0e0e0').style('stroke', '#bdbdbd').attr('d', arc);

    group
      .append('text')
      .each((d: LabeledChordGroup) => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr(
        'transform',
        (d: LabeledChordGroup) => `
        rotate(${(d.angle! * 180) / Math.PI - 90})
        translate(${outerRadius + 50})
        ${d.angle! > Math.PI ? 'rotate(180)' : ''}`,
      )
      .style('text-anchor', (d: LabeledChordGroup) => (d.angle! > Math.PI ? 'end' : null))
      .style('font-size', (d: d3.ChordGroup) => {
        const label = nodes[d.index].name;
        if (label.length > 60) return '10px';
        if (label.length > 50) return '11px';
        if (label.length > 40) return '12px';
        if (label.length > 30) return '13px';
        if (label.length > 20) return '14px';
        return '15px';
      })
      .text((d: d3.ChordGroup) => nodes[d.index].name)
      .on('mouseover', function (event: MouseEvent, d: d3.ChordGroup) {
        const index = d.index;
        svgGroup
          .selectAll<SVGPathElement, d3.Chord>('path.ribbon')
          .filter((r: d3.Chord) => r.source.index === index || r.target.index === index)
          .transition()
          .duration(200)
          .style('fill', 'black')
          .style('stroke', 'black')
          .style('opacity', 0.8);
      })
      .on('mouseout', () => {
        svgGroup
          .selectAll<SVGPathElement, d3.Chord>('path.ribbon')
          .transition()
          .duration(200)
          .style('filter', null)
          .style('fill', '#0066cc')
          .style('stroke', 'white')
          .style('opacity', 0.9);
      });
  }

  private drawRibbons(
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    chords: d3.Chords,
    innerRadius: number,
  ) {
    const ribbon = d3.ribbon<unknown, d3.Chord>().radius(innerRadius);

    svgGroup
      .append('g')
      .attr('cursor', 'pointer')
      .selectAll<SVGPathElement, d3.Chord>('path')
      .data(chords)
      .enter()
      .append('path')
      .attr('class', 'ribbon')
      .style('filter', null)
      .attr('d', ribbon)
      .style('fill', '#0066cc')
      .style('stroke', 'white')
      .style('opacity', 0.9);
  }
}
