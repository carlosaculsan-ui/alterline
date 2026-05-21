import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ForceGraph2D from 'react-force-graph-2d'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'

function buildGraphData(entries, links, filter) {
  const connCount = {}
  for (const e of entries) connCount[e.id] = 0
  for (const l of links) {
    if (connCount[l.from_entry_id] !== undefined) connCount[l.from_entry_id]++
    if (connCount[l.to_entry_id] !== undefined) connCount[l.to_entry_id]++
  }

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.type === filter)

  const nodeIds = new Set(filtered.map(e => e.id))

  const nodes = filtered.map(e => ({
    id: e.id,
    label: e.title,
    type: e.type,
    color: e.categories?.color ?? (e.type === 'carlopedia' ? '#6366f1' : '#94a3b8'),
    radius: Math.min(4 + (connCount[e.id] ?? 0) * 1.5, 16),
  }))

  const graphLinks = links
    .filter(l => nodeIds.has(l.from_entry_id) && nodeIds.has(l.to_entry_id))
    .map(l => ({ source: l.from_entry_id, target: l.to_entry_id }))

  return { nodes, links: graphLinks }
}

function GraphSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-36 h-36">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] animate-pulse" />
          <div className="absolute top-3 left-8 w-6 h-6 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] animate-pulse [animation-delay:100ms]" />
          <div className="absolute bottom-4 left-3 w-5 h-5 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] animate-pulse [animation-delay:250ms]" />
          <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] animate-pulse [animation-delay:175ms]" />
          <div className="absolute bottom-3 right-5 w-5 h-5 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] animate-pulse [animation-delay:325ms]" />
        </div>
        <p className="text-[12px] text-gray-400 dark:text-[#555]">Building graph…</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center px-8">
        <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] select-none mb-1">◎</div>
        <p className="text-[14px] font-medium text-gray-900 dark:text-white">No connections yet</p>
        <p className="text-[13px] text-gray-500 dark:text-[#666] max-w-[320px] leading-relaxed">
          Link entries together or use @mentions in your stories — connections appear here as a map.
        </p>
      </div>
    </div>
  )
}

export default function GraphPage() {
  const navigate = useNavigate()
  const { activeWorldId } = useWorld()

  const [entries, setEntries] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('alterline-theme') !== 'light'
  )

  const containerRef = useRef(null)
  const [dims, setDims] = useState({ width: 800, height: 600 })

  // Live dark mode sync
  useEffect(() => {
    const mo = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  // Responsive canvas dimensions
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDims({ width: el.offsetWidth, height: el.offsetHeight })
    })
    ro.observe(el)
    setDims({ width: el.offsetWidth, height: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  // Data fetch
  useEffect(() => {
    if (!activeWorldId) return
    setLoading(true)
    async function load() {
      const { data: entriesData } = await supabase
        .from('entries')
        .select('id, title, type, categories(name, color)')
        .eq('world_id', activeWorldId)
        .is('deleted_at', null)

      const all = entriesData ?? []
      if (all.length === 0) {
        setEntries([])
        setLinks([])
        setLoading(false)
        return
      }

      const entryIds = all.map(e => e.id)
      const { data: linksData } = await supabase
        .from('entry_links')
        .select('id, from_entry_id, to_entry_id')
        .in('from_entry_id', entryIds)

      setEntries(all)
      setLinks(linksData ?? [])
      setLoading(false)
    }
    load()
  }, [activeWorldId])

  const graphData = useMemo(
    () => buildGraphData(entries, links, filter),
    [entries, links, filter]
  )

  const paintNode = useCallback((node, ctx, globalScale) => {
    const r = node.radius

    if (node === hoveredNode) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
      ctx.fillStyle = node.color + '33'
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = node.color
    ctx.fill()

    const fontSize = Math.max(10 / globalScale, 2.5)
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(node.label, node.x, node.y + r + 2)
  }, [hoveredNode, isDark])

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'story', label: 'Stories' },
    { key: 'carlopedia', label: 'Carlopedia' },
  ]

  return (
    <Layout wide>
      <div className="flex flex-col h-full">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e5e5] dark:border-[#1e1e1e] shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <span className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-[#555] font-medium select-none mr-1">
            Show
          </span>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                filter === key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-[#777] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-400 dark:text-[#555] select-none shrink-0 hidden sm:block">
            {graphData.nodes.length} {graphData.nodes.length === 1 ? 'entry' : 'entries'} · {graphData.links.length} {graphData.links.length === 1 ? 'connection' : 'connections'}
          </span>
        </div>

        {/* Canvas area */}
        <div className="flex-1 min-h-0" ref={containerRef}>
          {loading ? (
            <GraphSkeleton />
          ) : graphData.links.length === 0 ? (
            <EmptyState />
          ) : (
            <ForceGraph2D
              graphData={graphData}
              width={dims.width}
              height={dims.height}
              backgroundColor={isDark ? '#111111' : '#ffffff'}
              nodeCanvasObject={paintNode}
              nodeCanvasObjectMode={() => 'replace'}
              nodeVal={node => node.radius * node.radius}
              onNodeClick={node => navigate(node.type === 'carlopedia' ? `/carlopedia/${node.id}` : `/entry/${node.id}`)}
              onNodeHover={node => setHoveredNode(node ?? null)}
              linkColor={() => isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}
              linkWidth={1}
              nodeLabel="label"
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              cooldownTicks={120}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
