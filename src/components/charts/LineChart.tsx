import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface LineChartData {
  index: number
  value: number
  label: string
}

interface LineChartProps {
  data: LineChartData[]
  color: string
  maxValue?: number
}

export function LineChart({ data, color, maxValue }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 40, bottom: 40, left: 60 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    // Create gradient for line
    const defs = svg.append('defs')
    
    const lineGradient = defs.append('linearGradient')
      .attr('id', `line-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
    
    lineGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.6)
    
    lineGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', color)
      .attr('stop-opacity', 1)
    
    lineGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.6)

    // Create gradient for area under line
    const areaGradient = defs.append('linearGradient')
      .attr('id', `area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
    
    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.4)
    
    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0)

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', `line-glow-${color.replace(/[^a-zA-Z0-9]/g, '')}`)
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur')

    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width])

    const yMax = maxValue || d3.max(data, d => d.value) || 100
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([height, 0])

    // Draw grid lines with darker styling
    const yTicks = yScale.ticks(5)
    yTicks.forEach(tick => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', 'rgba(6, 182, 212, 0.1)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
    })

    // Draw area under curve
    const area = d3.area<LineChartData>()
      .x((_d, i) => xScale(i))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('fill', `url(#area-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`)
      .attr('d', area)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1)

    // Line generator
    const line = d3.line<LineChartData>()
      .x((_d, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Draw line with animation
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', `url(#line-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`)
      .attr('stroke-width', 3)
      .attr('filter', `url(#line-glow-${color.replace(/[^a-zA-Z0-9]/g, '')})`)
      .attr('d', line)

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0)

    // Draw data points with staggered animation
    data.forEach((d, i) => {
      const circle = g.append('circle')
        .attr('cx', xScale(i))
        .attr('cy', yScale(d.value))
        .attr('r', 0)
        .attr('fill', color)
        .attr('filter', `url(#line-glow-${color.replace(/[^a-zA-Z0-9]/g, '')})`)

      circle.transition()
        .duration(300)
        .delay(1500 + i * 80)
        .attr('r', 5)

      // Add outer ring
      g.append('circle')
        .attr('cx', xScale(i))
        .attr('cy', yScale(d.value))
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.5)
        .transition()
        .duration(300)
        .delay(1500 + i * 80)
        .attr('r', 8)
    })

    // Y-axis with better styling
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#94a3b8')

    // X-axis with better styling
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(data.length, 10))
      .tickFormat(d => `${Math.floor(d as number) + 1}`)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#64748b')

    // Style axis lines
    g.selectAll('.domain')
      .style('stroke', 'rgba(6, 182, 212, 0.2)')
      .style('stroke-width', '1.5')

    g.selectAll('.tick line')
      .style('stroke', 'rgba(6, 182, 212, 0.2)')
      .style('stroke-width', '1.5')

  }, [data, color, maxValue])

  return (
    <div ref={containerRef} className="relative h-48 bg-dark-900 rounded-lg p-4">
      <svg ref={svgRef} />
    </div>
  )
}
