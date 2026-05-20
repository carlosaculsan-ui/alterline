import { useState } from 'react'

const BRAND = '#1B6CA8'
const BRAND_LIGHT = '#BFDBFE'
const AMBER = '#F5A623'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'shop', label: 'My shop profile' },
  { id: 'services', label: 'Services & pricing' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'settings', label: 'Settings' },
]

const ORDER_STATUSES = [
  'Pending approval',
  'Accepted',
  'Pick-up scheduled',
  'Picked up',
  'Washing',
  'Drying',
  'Ready for pickup',
  'Out for delivery',
  'Completed',
]

const MOCK_ORDERS = [
  {
    id: 'ORD-001',
    customer: 'Maria Santos',
    time: '7:23 AM',
    service: 'Full-service wash',
    weight: '5 kg (est.)',
    detergent: 'Ariel pods',
    status: 'Pending approval',
  },
  {
    id: 'ORD-002',
    customer: 'Juan dela Cruz',
    time: '8:45 AM',
    service: 'Wash & fold',
    weight: '3 kg (est.)',
    detergent: 'Downy fabric softener',
    status: 'Pending approval',
  },
  {
    id: 'ORD-003',
    customer: 'Ana Reyes',
    time: '6:00 AM',
    service: 'Wash, dry & fold',
    weight: '7 kg (est.)',
    detergent: 'Tide powder',
    status: 'Washing',
  },
  {
    id: 'ORD-004',
    customer: 'Pedro Bautista',
    time: '5:30 AM',
    service: 'Delicate cycle',
    weight: '2 kg (est.)',
    detergent: 'Gentle wash',
    status: 'Drying',
  },
  {
    id: 'ORD-005',
    customer: 'Liza Mendoza',
    time: '4:00 AM',
    service: 'Wash & fold',
    weight: '6 kg (confirmed)',
    detergent: 'Ariel pods',
    status: 'Completed',
  },
]

const EARNINGS = [
  { day: 'Mon', amount: 1200 },
  { day: 'Tue', amount: 890 },
  { day: 'Wed', amount: 1450 },
  { day: 'Thu', amount: 2100 },
  { day: 'Fri', amount: 1800 },
  { day: 'Sat', amount: 2400 },
  { day: 'Sun', amount: 600 },
]

const MAX_EARNING = Math.max(...EARNINGS.map((e) => e.amount))
const TOTAL_WEEKLY = EARNINGS.reduce((s, e) => s + e.amount, 0)
const TODAY_IDX = 2 // Wed

const STATUS_STYLE = {
  'Pending approval': { bg: '#FEF9C3', color: '#854D0E' },
  Accepted: { bg: '#DCFCE7', color: '#166534' },
  'Pick-up scheduled': { bg: '#DBEAFE', color: '#1E40AF' },
  'Picked up': { bg: '#E0E7FF', color: '#3730A3' },
  Washing: { bg: '#DBEAFE', color: '#1B6CA8' },
  Drying: { bg: '#F0FDFA', color: '#0F766E' },
  'Ready for pickup': { bg: '#DCFCE7', color: '#166534' },
  'Out for delivery': { bg: '#FEF3C7', color: '#92400E' },
  Completed: { bg: '#F0FDF4', color: '#15803D' },
  Cancelled: { bg: '#FEE2E2', color: '#B91C1C' },
}

function NavIcon() {
  return (
    <div
      className="shrink-0 rounded"
      style={{ width: 20, height: 20, border: '1.5px dashed #CBD5E1', backgroundColor: '#F8FAFC' }}
    />
  )
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { bg: '#F1F5F9', color: '#475569' }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

const TABS = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled']

const STAT_CARDS = [
  { num: 5, label: "Today's orders" },
  { num: 2, label: 'Pending approval' },
  { num: 2, label: 'In progress' },
  { num: 1, label: 'Completed today' },
]

export default function MerchantDashboard() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [activeTab, setActiveTab] = useState('All')
  const [orderStatuses, setOrderStatuses] = useState(
    Object.fromEntries(MOCK_ORDERS.map((o) => [o.id, o.status]))
  )
  const [pendingSelects, setPendingSelects] = useState(
    Object.fromEntries(MOCK_ORDERS.map((o) => [o.id, o.status]))
  )
  const [actualWeight, setActualWeight] = useState(5)

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  function filteredOrders() {
    return MOCK_ORDERS.filter((o) => {
      const s = orderStatuses[o.id]
      if (activeTab === 'All') return true
      if (activeTab === 'Pending') return s === 'Pending approval'
      if (activeTab === 'In Progress') return s !== 'Pending approval' && s !== 'Completed' && s !== 'Cancelled'
      if (activeTab === 'Completed') return s === 'Completed'
      if (activeTab === 'Cancelled') return s === 'Cancelled'
      return true
    })
  }

  function accept(id) {
    setOrderStatuses((p) => ({ ...p, [id]: 'Accepted' }))
    setPendingSelects((p) => ({ ...p, [id]: 'Accepted' }))
  }

  function decline(id) {
    setOrderStatuses((p) => ({ ...p, [id]: 'Cancelled' }))
  }

  function updateStatus(id) {
    setOrderStatuses((p) => ({ ...p, [id]: pendingSelects[id] }))
  }

  const orders = filteredOrders()

  return (
    <div
      className="flex min-h-screen"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", backgroundColor: '#F4F7FA' }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        className="fixed inset-y-0 left-0 z-20 flex flex-col"
        style={{ width: 240, backgroundColor: '#fff', borderRight: '1px solid #E2E8F0' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: BRAND,
              letterSpacing: '-0.3px',
            }}
          >
            LabadaGo
          </div>
          <div
            className="mt-0.5"
            style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, letterSpacing: '0.04em' }}
          >
            Merchant portal
          </div>
        </div>

        {/* Shop status toggle */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: '#CBD5E1' }}
          >
            Shop status
          </div>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isOpen ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${isOpen ? '#BBF7D0' : '#FECACA'}`,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: isOpen ? '#22C55E' : '#EF4444',
                boxShadow: `0 0 0 3px ${isOpen ? '#DCFCE7' : '#FEE2E2'}`,
              }}
            />
            <span
              className="text-[13px] font-semibold"
              style={{ color: isOpen ? '#15803D' : '#B91C1C' }}
            >
              {isOpen ? 'Open for orders' : 'Shop closed'}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mb-0.5 text-left transition-all"
                style={{
                  color: active ? BRAND : '#64748B',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  backgroundColor: active ? '#EFF6FF' : 'transparent',
                  borderLeft: `3px solid ${active ? BRAND : 'transparent'}`,
                }}
              >
                <NavIcon />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Owner info */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center rounded-full text-center leading-tight"
              style={{
                width: 40,
                height: 40,
                border: '2px dashed #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: 7,
                color: '#94A3B8',
              }}
            >
              Owner photo
            </div>
            <div className="min-w-0">
              <div
                className="font-semibold truncate"
                style={{ fontSize: 13, color: '#1E293B' }}
              >
                Ate Linda's Lavanderia
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Shop owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-col flex-1" style={{ marginLeft: 240 }}>
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-8 py-4 shrink-0"
          style={{ backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0' }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: '#1E293B',
              }}
            >
              Good morning, Ate Linda
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{today}</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-50"
                style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff' }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: '#EF4444', border: '1.5px solid #fff' }}
              />
            </div>
            {/* Avatar */}
            <div
              className="shrink-0 rounded-full flex items-center justify-center text-center leading-tight"
              style={{
                width: 36,
                height: 36,
                border: '2px dashed #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: 7,
                color: '#94A3B8',
              }}
            >
              Owner avatar
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Stats row */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {STAT_CARDS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 36,
                    color: BRAND,
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </div>
                <div className="mt-2" style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── ORDERS SECTION ── */}
          <div
            className="rounded-2xl mb-6 overflow-hidden"
            style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
          >
            <div className="px-6 pt-5">
              <div
                className="mb-4"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#1E293B',
                }}
              >
                Today's orders
              </div>
              {/* Tabs */}
              <div className="flex" style={{ borderBottom: '1px solid #E2E8F0' }}>
                {TABS.map((tab) => {
                  const active = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 pb-3 pt-1 text-[13px] font-medium transition-all"
                      style={{
                        color: active ? BRAND : '#94A3B8',
                        borderBottom: `2px solid ${active ? BRAND : 'transparent'}`,
                        marginBottom: -1,
                      }}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Order cards */}
            <div className="p-4 flex flex-col gap-3">
              {orders.length === 0 ? (
                <div
                  className="py-14 text-center"
                  style={{ color: '#CBD5E1', fontSize: 13 }}
                >
                  No orders in this category
                </div>
              ) : (
                orders.map((order) => {
                  const status = orderStatuses[order.id]
                  const isPending = status === 'Pending approval'
                  const isCompleted = status === 'Completed' || status === 'Cancelled'
                  const isInProgress = !isPending && !isCompleted

                  return (
                    <div
                      key={order.id}
                      className="flex items-start gap-5 rounded-xl p-4"
                      style={{ border: '1px solid #E2E8F0', backgroundColor: '#FAFBFD' }}
                    >
                      {/* Left — ID + customer */}
                      <div style={{ minWidth: 140 }}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            style={{
                              fontFamily: "'Syne', sans-serif",
                              fontWeight: 700,
                              fontSize: 14,
                              color: '#1E293B',
                            }}
                          >
                            {order.id}
                          </span>
                          <StatusPill status={status} />
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          {order.customer}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          Placed at {order.time}
                        </div>
                      </div>

                      {/* Center — service details */}
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1.5"
                          style={{ backgroundColor: '#EFF6FF', color: BRAND }}
                        >
                          {order.service}
                        </span>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          <span className="font-semibold">{order.weight}</span>
                          {' · '}
                          {order.detergent}
                        </div>
                        <button
                          className="mt-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70"
                          style={{ color: BRAND }}
                        >
                          View details →
                        </button>
                      </div>

                      {/* Right — actions */}
                      <div className="flex flex-col items-stretch gap-2 shrink-0" style={{ minWidth: 170 }}>
                        {isPending && (
                          <>
                            <button
                              onClick={() => accept(order.id)}
                              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                              style={{ backgroundColor: '#16A34A' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => decline(order.id)}
                              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-90"
                              style={{
                                border: '1.5px solid #EF4444',
                                color: '#EF4444',
                                backgroundColor: 'transparent',
                              }}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {isInProgress && (
                          <>
                            <select
                              value={pendingSelects[order.id]}
                              onChange={(e) =>
                                setPendingSelects((p) => ({ ...p, [order.id]: e.target.value }))
                              }
                              className="rounded-lg px-2 py-1.5 text-[12px] outline-none"
                              style={{
                                border: '1px solid #E2E8F0',
                                color: '#1E293B',
                                backgroundColor: '#fff',
                              }}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => updateStatus(order.id)}
                              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                              style={{ backgroundColor: BRAND }}
                            >
                              Update status
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                            style={{
                              border: '1.5px solid #CBD5E1',
                              color: '#64748B',
                              backgroundColor: 'transparent',
                            }}
                          >
                            View receipt
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── WEIGHT CONFIRMATION ── */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${AMBER}`,
            }}
          >
            <div
              className="mb-4"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: '#1E293B',
              }}
            >
              Weight confirmations needed
            </div>

            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              {/* Order header */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#1E293B',
                  }}
                >
                  ORD-003
                </span>
                <span style={{ fontSize: 13, color: '#64748B' }}>Ana Reyes</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  Customer estimated: 5 kg
                </span>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Weight stepper */}
                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
                    style={{ color: '#92400E' }}
                  >
                    Actual weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActualWeight((w) => Math.max(0.5, parseFloat((w - 0.5).toFixed(1))))
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors hover:bg-slate-100"
                      style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#64748B' }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      min="0"
                      className="w-16 text-center text-[15px] font-bold rounded-lg py-1.5 outline-none"
                      style={{ border: '1px solid #E2E8F0', color: '#1E293B' }}
                    />
                    <button
                      onClick={() =>
                        setActualWeight((w) => parseFloat((w + 0.5).toFixed(1)))
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors hover:bg-blue-50"
                      style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff', color: BRAND }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: 13, color: '#64748B' }}>kg</span>
                  </div>
                </div>

                {/* Photo upload */}
                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
                    style={{ color: '#92400E' }}
                  >
                    Scale photo
                  </label>
                  <div
                    className="w-full rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-amber-100"
                    style={{
                      height: 96,
                      border: '2px dashed #FCD34D',
                      backgroundColor: '#FFFBEB',
                      fontSize: 10,
                      color: '#92400E',
                      textAlign: 'center',
                      padding: '0 12px',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={AMBER}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload scale photo — merchant uploads proof of actual weight
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-4 mt-4">
                <p style={{ fontSize: 11, color: '#92400E' }}>
                  Customer will be notified with updated price
                </p>
                <button
                  className="px-5 py-2 rounded-lg text-[13px] font-bold shrink-0 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: AMBER, color: '#1C1917' }}
                >
                  Confirm weight &amp; update invoice
                </button>
              </div>
            </div>
          </div>

          {/* ── EARNINGS SNAPSHOT ── */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}
          >
            <div className="flex items-baseline justify-between mb-5">
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: '#1E293B',
                }}
              >
                Earnings this week
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  color: BRAND,
                }}
              >
                ₱{TOTAL_WEEKLY.toLocaleString()}
              </div>
            </div>

            {/* Value labels */}
            <div className="flex gap-2 mb-1">
              {EARNINGS.map((e, i) => (
                <div
                  key={e.day}
                  className="flex-1 text-center"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: i === TODAY_IDX ? BRAND : '#94A3B8',
                  }}
                >
                  {e.amount >= 1000 ? `₱${(e.amount / 1000).toFixed(1)}k` : `₱${e.amount}`}
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="flex items-end gap-2" style={{ height: 80 }}>
              {EARNINGS.map((e, i) => (
                <div
                  key={e.day}
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${(e.amount / MAX_EARNING) * 100}%`,
                    backgroundColor: i === TODAY_IDX ? BRAND : BRAND_LIGHT,
                    minHeight: 4,
                  }}
                />
              ))}
            </div>

            {/* Day labels */}
            <div className="flex gap-2 mt-2">
              {EARNINGS.map((e, i) => (
                <div
                  key={e.day}
                  className="flex-1 text-center"
                  style={{
                    fontSize: 11,
                    fontWeight: i === TODAY_IDX ? 700 : 500,
                    color: i === TODAY_IDX ? BRAND : '#94A3B8',
                  }}
                >
                  {e.day}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
