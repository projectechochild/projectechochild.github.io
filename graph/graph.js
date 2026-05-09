const CharacterGraph = (function () {
  'use strict'

  const characters = [
    { id: 'jesse', type: 'character', name: 'Jesse',            image: 'assets/images/Jesse.jpg',                color: '#4fc3f7', group: 'family' },
    { id: 'shasha', type: 'character', name: 'Shasha',          image: 'assets/images/Shasha.jpg',               color: '#81c784', group: 'family' },
    { id: 'david', type: 'character', name: 'David',            image: 'assets/images/David.jpg',                color: '#ffb74d', group: 'family' },
    { id: 'tom',   type: 'character', name: 'Tom "The Beast"',  image: 'assets/images/Tom The Beast Wilmington.jpg', color: '#e94560', group: 'antagonist', deceased: true },
    { id: 'veil',  type: 'character', name: 'The Veil',         image: 'assets/images/The woman with the veil.jpg', color: '#ce93d8', group: 'mystery' },
    { id: 'govt-spy', type: 'character', name: 'Government Spy', image: null,                                     color: '#2a2a2a', group: 'mystery' },
  ]

  const pieces = [
    { id: 'piece-knight', type: 'piece', name: 'Knight',    symbol: '\u2658', boardLabel: 'Jesse',           color: '#4a6a8a', group: 'piece' },
    { id: 'piece-bishop', type: 'piece', name: 'Bishop',    symbol: '\u2657', boardLabel: 'Shasha',          color: '#4a7a5a', group: 'piece' },
    { id: 'piece-rook',   type: 'piece', name: 'Rook',      symbol: '\u2656', boardLabel: 'David',           color: '#7a5a4a', group: 'piece' },
    { id: 'piece-queen',  type: 'piece', name: 'Queen',     symbol: '\u2655', boardLabel: 'The Veil',        color: '#5a4a8a', group: 'piece' },
    { id: 'piece-king',   type: 'piece', name: 'King',      symbol: '\u2654', boardLabel: 'Tom',             color: '#8a3a3a', group: 'piece' },
    { id: 'piece-pawn',   type: 'piece', name: 'Pawn',      symbol: '\u2659', boardLabel: 'Government Spy',  color: '#666666', group: 'piece' },
  ]

  const characterRels = [
    { source: 'jesse', target: 'shasha', label: 'Mother & Daughter',     strength: 0.8 },
    { source: 'jesse', target: 'david',  label: 'Father & Daughter',     strength: 0.6 },
    { source: 'shasha', target: 'david', label: 'Husband & Wife',        strength: 0.5 },
    { source: 'veil',   target: 'tom',   label: 'Father & Daughter',     strength: 0.6 },
    { source: 'veil',   target: 'jesse', label: 'Mysterious Connection',  strength: 0.7 },
    { source: 'veil',   target: 'shasha', label: 'Shelter',              strength: 0.3 },
    { source: 'veil',   target: 'david',  label: 'Shelter',              strength: 0.3 },
    { source: 'govt-spy', target: 'tom',  label: 'Under Investigation',  strength: 0.4 },
    { source: 'govt-spy', target: 'jesse', label: 'Watched',             strength: 0.5 },
  ]

  const pieceRels = [
    { source: 'jesse',    target: 'piece-knight', label: '', strength: 0.6 },
    { source: 'shasha',   target: 'piece-bishop', label: '', strength: 0.6 },
    { source: 'david',    target: 'piece-rook',   label: '', strength: 0.6 },
    { source: 'veil',     target: 'piece-queen',  label: '', strength: 0.6 },
    { source: 'tom',      target: 'piece-king',   label: '', strength: 0.6 },
    { source: 'govt-spy', target: 'piece-pawn',   label: '', strength: 0.6 },
  ]

  const allNodes = characters.concat(pieces)
  const allLinks = characterRels.concat(pieceRels)

  let simulation, svg, link, node, linkLabel, width, height
  let tooltip, container

  function boardToGraph(file, rank) {
    const padX = 80
    const padY = 60
    const cols = 7
    const rows = 7
    const cellW = (width - padX * 2) / cols
    const cellH = (height - padY * 2) / rows
    return {
      x: padX + file * cellW + (Math.random() - 0.5) * 6,
      y: padY + (7 - rank) * cellH + (Math.random() - 0.5) * 6
    }
  }

  function pinNodeToBoard(d, file, rank) {
    const pos = boardToGraph(file, rank)
    d.fx = pos.x
    d.fy = pos.y
    d.x = pos.x
    d.y = pos.y
  }

  function renderNode(g, d) {
    if (d.type === 'character') {
      g.append('circle')
        .attr('r', 30)
        .attr('fill', d.color)
        .attr('stroke', d.id === 'govt-spy' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)')
        .attr('stroke-width', d.id === 'govt-spy' ? 1 : 2)
        .attr('stroke-dasharray', d.id === 'govt-spy' ? '4,3' : null)
        .attr('class', 'graph-node-circle')

      if (d.image) {
        g.append('image')
          .attr('width', 56)
          .attr('height', 56)
          .attr('x', -28)
          .attr('y', -28)
          .attr('clip-path', 'url(#clip-' + d.id + ')')
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .attr('class', 'graph-node-image')
          .attr('href', d.image)
          .on('error', function () {
            d3.select(this).remove()
            g.append('text')
              .text(d.name.charAt(0))
              .attr('text-anchor', 'middle')
              .attr('dy', '0.35em')
              .attr('fill', '#050505')
              .attr('font-size', '18px')
              .attr('font-weight', 'bold')
              .attr('class', 'graph-node-initial')
          })
      } else {
        g.append('text')
          .text(d.id === 'govt-spy' ? '?' : d.name.charAt(0))
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', d.id === 'govt-spy' ? 'rgba(255,255,255,0.4)' : '#050505')
          .attr('font-size', d.id === 'govt-spy' ? '22px' : '18px')
          .attr('font-weight', 'bold')
          .attr('class', 'graph-node-initial')
      }

      g.append('text')
        .text(d.deceased ? d.name + ' (Deceased)' : d.name)
        .attr('text-anchor', 'middle')
        .attr('dy', '45')
        .attr('fill', '#ffffff')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('class', 'graph-node-label')

      if (d.deceased) {
        g.attr('opacity', 0.5)
      }
    } else {
      g.append('circle')
        .attr('r', 22)
        .attr('fill', d.color)
        .attr('stroke', 'rgba(255,255,255,0.2)')
        .attr('stroke-width', 2)
        .attr('class', 'graph-node-circle')

      g.append('text')
        .text(d.symbol)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#ffffff')
        .attr('font-size', '22px')
        .attr('class', 'graph-piece-symbol')

      g.append('text')
        .text(d.id === 'piece-pawn' ? 'Government Spy' : d.name)
        .attr('text-anchor', 'middle')
        .attr('dy', '36')
        .attr('fill', '#aaaaaa')
        .attr('font-size', '11px')
        .attr('font-weight', '400')
        .attr('class', 'graph-node-label')
    }
  }

  function init(boardPositions) {
    container = document.getElementById('character-graph')
    if (!container || typeof d3 === 'undefined') return

    const rect = container.getBoundingClientRect()
    width = rect.width || 800
    height = rect.height || 600

    container.innerHTML = ''

    tooltip = document.createElement('div')
    tooltip.className = 'graph-tooltip'
    tooltip.style.display = 'none'
    container.appendChild(tooltip)

    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])

    const defs = svg.append('defs')

    characters.forEach(function (c) {
      defs.append('clipPath')
        .attr('id', 'clip-' + c.id)
        .append('circle')
        .attr('r', 28)
        .attr('cx', 0)
        .attr('cy', 0)
    })

    allLinks.forEach(function (r) {
      const id = 'marker-' + r.source + '-' + r.target
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', [0, 0, 8, 8])
        .attr('refX', 28)
        .attr('refY', 4)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0 L8,4 L0,8 Z')
        .attr('fill', 'rgba(255,255,255,0.15)')
    })

    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', function (event) {
        svg.selectAll('g.graph-content').attr('transform', event.transform)
      })

    svg.call(zoom)

    const content = svg.append('g').attr('class', 'graph-content')

    link = content.append('g').attr('class', 'links')
      .selectAll('line')
      .data(allLinks)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', function (d) {
        return d.label ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'
      })
      .attr('stroke-width', function (d) { return d.label ? Math.max(1, d.strength * 3) : 1 })
      .attr('stroke-dasharray', function (d) { return d.label ? null : '4,3' })
      .attr('marker-end', function (d) { return 'url(#marker-' + d.source + '-' + d.target + ')' })

    linkLabel = content.append('g').attr('class', 'link-labels')
      .selectAll('text')
      .data(characterRels)
      .join('text')
      .attr('class', 'graph-link-label')
      .text(function (d) { return d.label })
      .attr('fill', 'rgba(255,255,255,0.25)')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', '-6')

    node = content.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(allNodes)
      .join('g')
      .attr('class', function (d) { return d.type === 'character' ? 'graph-node' : 'graph-node graph-piece' })
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
      )

    node.each(function (d) {
      if (boardPositions && boardPositions[d.id]) {
        const bp = boardPositions[d.id]
        const pos = boardToGraph(bp.file, bp.rank)
        d.x = pos.x
        d.y = pos.y
        d.fx = pos.x
        d.fy = pos.y
      }
      renderNode(d3.select(this), d)
    })

    node.on('mouseenter', function (event, d) {
      highlightConnections(d)
      showTooltip(event, d)
    })

    node.on('mouseleave', function () {
      resetHighlight()
      hideTooltip()
    })

    node.on('click', function (event, d) {
      showTooltip(event, d, true)
    })

    simulation = d3.forceSimulation(allNodes)
      .force('link', d3.forceLink(allLinks)
        .id(function (d) { return d.id })
        .distance(function (d) { return d.label ? 180 - d.strength * 100 : 120 })
        .strength(function (d) { return d.strength })
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(function (d) { return d.type === 'character' ? 50 : 35 }))
      .alphaDecay(0.02)
      .on('tick', ticked)

    svg.on('click', function () {
      hideTooltip()
    })

    window.addEventListener('resize', resize)

    simulation.alpha(0.5).restart()
    setTimeout(function () { simulation.alphaTarget(0) }, 2000)
  }

  function updatePositions(positions, capturedIds) {
    if (!simulation) return

    allNodes.forEach(function (d) {
      if (positions && positions[d.id]) {
        const pos = boardToGraph(positions[d.id].file, positions[d.id].rank)
        d.fx = pos.x
        d.fy = pos.y
      } else if (capturedIds && capturedIds.indexOf(d.id) >= 0) {
        d.fx = null
        d.fy = null
        const el = node.filter(function (n) { return n.id === d.id })
        el.select('.graph-node-circle')
          .transition().duration(400)
          .attr('opacity', 0.2)
        el.select('.graph-node-image')
          .transition().duration(400)
          .attr('opacity', 0.2)
        el.select('.graph-node-label')
          .transition().duration(400)
          .attr('opacity', 0.15)
        el.select('.graph-node-initial')
          .transition().duration(400)
          .attr('opacity', 0.2)
        el.select('.graph-piece-symbol')
          .transition().duration(400)
          .attr('opacity', 0.2)
      }
    })

    simulation.alpha(0.3).restart()
  }

  function ticked() {
    link
      .attr('x1', function (d) { return d.source.x })
      .attr('y1', function (d) { return d.source.y })
      .attr('x2', function (d) { return d.target.x })
      .attr('y2', function (d) { return d.target.y })

    linkLabel
      .attr('x', function (d) { return (d.source.x + d.target.x) / 2 })
      .attr('y', function (d) { return (d.source.y + d.target.y) / 2 })

    node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
  }

  function getConnectedIds(d) {
    const ids = new Set()
    ids.add(d.id)

    allLinks.forEach(function (r) {
      const sid = typeof r.source === 'object' ? r.source.id : r.source
      const tid = typeof r.target === 'object' ? r.target.id : r.target
      if (sid === d.id) ids.add(tid)
      if (tid === d.id) ids.add(sid)
    })

    return ids
  }

  function highlightConnections(d) {
    const connectedIds = getConnectedIds(d)

    node.each(function (n) {
      const el = d3.select(this)
      if (connectedIds.has(n.id)) {
        const r = n.type === 'character' ? 35 : 26
        el.select('.graph-node-circle')
          .transition().duration(200)
          .attr('r', r)
          .attr('stroke', n.color)
          .attr('stroke-width', 3)
        el.select('.graph-node-label')
          .transition().duration(200)
          .attr('opacity', 1)
      } else {
        const r = n.type === 'character' ? 30 : 22
        el.select('.graph-node-circle')
          .transition().duration(200)
          .attr('r', r)
          .attr('stroke', 'rgba(255,255,255,0.1)')
          .attr('stroke-width', 1)
        el.select('.graph-node-label')
          .transition().duration(200)
          .attr('opacity', 0.2)
      }
    })

    link.each(function (r) {
      const sid = typeof r.source === 'object' ? r.source.id : r.source
      const tid = typeof r.target === 'object' ? r.target.id : r.target
      const el = d3.select(this)
      if (sid === d.id || tid === d.id) {
        el.transition().duration(200)
          .attr('stroke', d.color || 'rgba(255,255,255,0.5)')
          .attr('stroke-width', Math.max(2, r.strength * 4))
          .attr('opacity', 0.8)
      } else {
        el.transition().duration(200)
          .attr('stroke', 'rgba(255,255,255,0.05)')
          .attr('stroke-width', 1)
          .attr('opacity', 0.3)
      }
    })

    linkLabel.each(function (r) {
      const sid = typeof r.source === 'object' ? r.source.id : r.source
      const tid = typeof r.target === 'object' ? r.target.id : r.target
      const el = d3.select(this)
      if (sid === d.id || tid === d.id) {
        el.transition().duration(200)
          .attr('fill', 'rgba(255,255,255,0.7)')
          .attr('font-size', '11px')
      }
    })
  }

  function resetHighlight() {
    node.each(function (n) {
      const el = d3.select(this)
      const r = n.type === 'character' ? 30 : 22
      el.select('.graph-node-circle')
        .transition().duration(200)
        .attr('r', r)
        .attr('stroke', 'rgba(255,255,255,0.3)')
        .attr('stroke-width', 2)
      el.select('.graph-node-label')
        .transition().duration(200)
        .attr('opacity', 1)
    })

    link.transition().duration(200)
      .attr('stroke', function (d) { return d.label ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)' })
      .attr('stroke-width', function (d) { return d.label ? Math.max(1, d.strength * 3) : 1 })
      .attr('opacity', 0.6)

    linkLabel.transition().duration(200)
      .attr('fill', 'rgba(255,255,255,0.25)')
      .attr('font-size', '10px')
  }

  function showTooltip(event, d) {
    let html = '<strong>' + d.name + '</strong>'
    if (d.deceased) {
      html += '<br><small style="color:#e94560">Deceased</small>'
    }
    if (d.type === 'character' && !d.deceased) {
      html += '<br><small>' + d.group.charAt(0).toUpperCase() + d.group.slice(1) + '</small>'
    } else if (d.type === 'character' && d.deceased) {
      html += '<br><small>' + d.group.charAt(0).toUpperCase() + d.group.slice(1) + ' &middot; Deceased</small>'
    }

    const rels = []
    allLinks.forEach(function (r) {
      const sid = typeof r.source === 'object' ? r.source.id : r.source
      const tid = typeof r.target === 'object' ? r.target.id : r.target
      if (sid === d.id || tid === d.id) {
        const other = sid === d.id ? tid : sid
        const otherNode = allNodes.find(function (n) { return n.id === other })
        if (otherNode) {
          if (d.type === 'piece') {
            rels.push('\u2192 Represents ' + otherNode.name)
          } else if (r.label) {
            rels.push(sid === d.id ? r.label + ' \u2192 ' + otherNode.name : otherNode.name + ' \u2192 ' + r.label)
          }
        }
      }
    })

    if (rels.length > 0) {
      html += '<div class="graph-tooltip-rels">' + rels.map(function (r) { return '<span>' + r + '</span>' }).join('') + '</div>'
    }

    tooltip.innerHTML = html

    const rect = container.getBoundingClientRect()
    const tx = event.clientX - rect.left + 15
    const ty = event.clientY - rect.top - 10

    tooltip.style.left = Math.min(tx, width - 220) + 'px'
    tooltip.style.top = Math.max(ty, 10) + 'px'
    tooltip.style.display = 'block'
    tooltip.style.zIndex = '100'
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none'
  }

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0)
  }

  function resize() {
    if (!container) return
    const rect = container.getBoundingClientRect()
    width = rect.width || 800
    height = rect.height || 600
    svg.attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height])
    simulation.force('center', d3.forceCenter(width / 2, height / 2))
    simulation.alpha(0.3).restart()
  }

  return { init: init, updatePositions: updatePositions }
})()
