import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface MuscleDistributionData {
  name: string
  value: number
}

interface MuscleDistributionChartProps {
  data: MuscleDistributionData[]
}

export function MuscleDistributionChart({ data }: MuscleDistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 500
    const height = 500
    const centerX = width / 2
    const centerY = height / 2
    const levels = 6

    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')

    // Create gradient for the data area
    const defs = svg.append('defs')
    
    const gradient = defs.append('radialGradient')
      .attr('id', 'muscle-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.8)
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0891b2')
      .attr('stop-opacity', 0.2)

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur')

    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Draw hexagon grid with darker styling
    for (let level = 0; level <= levels; level++) {
      const radius = 40 + level * 30
      const points: [number, number][] = []
      
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        points.push([x, y])
      }
      
      svg.append('polygon')
        .attr('points', points.map(p => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', level === levels ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.15)')
        .attr('stroke-width', level === levels ? 2 : 1)
    }

    // Draw radial lines from center
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const radius = 40 + levels * 30
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      
      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(6, 182, 212, 0.15)')
        .attr('stroke-width', 1)
    }

    // Draw data polygon with animation
    const dataPoints: [number, number][] = data.map((item, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const radius = 40 + (item.value / 100) * 150
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      return [x, y]
    })

    // Add filled polygon with gradient
    const polygon = svg.append('polygon')
      .attr('points', dataPoints.map(() => `${centerX},${centerY}`).join(' '))
      .attr('fill', 'url(#muscle-gradient)')
      .attr('opacity', 0)

    polygon.transition()
      .duration(1000)
      .attr('points', dataPoints.map(p => p.join(',')).join(' '))
      .attr('opacity', 1)

    // Add glowing stroke
    svg.append('polygon')
      .attr('points', dataPoints.map(() => `${centerX},${centerY}`).join(' '))
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 3)
      .attr('filter', 'url(#glow)')
      .transition()
      .duration(1000)
      .attr('points', dataPoints.map(p => p.join(',')).join(' '))

    // Add orange/yellow accent line
    const accentPoints: [number, number][] = data.map((item, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const radius = 40 + (item.value / 100) * 150 * 0.85 // 85% of main value
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      return [x, y]
    })

    svg.append('polygon')
      .attr('points', accentPoints.map(() => `${centerX},${centerY}`).join(' '))
      .attr('fill', 'none')
      .attr('stroke', '#fb923c')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .delay(200)
      .attr('points', accentPoints.map(p => p.join(',')).join(' '))
      .attr('opacity', 0.7)

    // Draw labels with better styling
    data.forEach((item, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const radius = 230
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '13px')
        .attr('font-weight', '500')
        .attr('opacity', 0)
        .text(item.name)
        .transition()
        .duration(500)
        .delay(800)
        .attr('opacity', 1)
    })

    // Add data points at vertices
    dataPoints.forEach((point, i) => {
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 0)
        .attr('fill', '#06b6d4')
        .attr('filter', 'url(#glow)')
        .transition()
        .duration(500)
        .delay(1000 + i * 100)
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 5)
    })
  }, [data])

  return (
    <div className="flex justify-center py-4">
      <svg ref={svgRef} className="w-full max-w-md" />
    </div>
  )
}
