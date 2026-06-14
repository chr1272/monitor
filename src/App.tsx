import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Bar, BarChart } from 'recharts'
import { auth, db, firebaseEnvErrors } from './firebase'
import {
  getInitialLanguage,
  getTimeRangeOptions,
  LANGUAGE_LOCALES,
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  TRANSLATIONS,
  type Language,
  type Translation,
} from './i18n'

type Connectivity = 'Online' | 'Offline' | 'Unknown'

type TelemetryPoint = {
  id: string
  timestamp: Date
  hasTimestamp: boolean
  temp: number | null
  hum: number | null
  pres: number | null
  gas: number | null
  laeq1m: number | null
  raw: DocumentData
}

type TrafficEvent = {
  id: string
  timestamp: Date | null
  className: string
  speed: number | null
  direction: string
  peakDba: number | null
}

const radarStatusKeys = ['radarConnected', 'radar_status', 'radarOnline', 'radar']
const sonometerStatusKeys = ['sonometerConnected', 'sonometer_status', 'sonometerOnline', 'sonometer']
const telemetryTimestampKeys = ['timestamp', 'createdAt', 'ts', 'time', 'date', 'datetime', 'epoch']
const telemetryValueKeys = {
  temp: ['temp_c', 'temp', 'temperature', 'temperature_c', 'temperatureC', 'Temp'],
  hum: ['hum_pct', 'hum', 'humidity', 'Humidity', 'Hum'],
  pres: ['pres_hpa', 'pres', 'pressure', 'pressure_hpa', 'Pressure', 'Pres'],
  gas: ['gas_kohm', 'gas', 'gas_index', 'gasPpm', 'Gas'],
  laeq1m: ['avg_dba_1m', 'laeq1m', 'laeq_1m', 'LAeq_1m', 'peak_dba', 'LAeq_1m (dBA)', 'L_Aeq_1m'],
}
const trafficTimestampKeys = ['timestamp', 'createdAt', 'ts', 'time', 'date', 'datetime', 'epoch']
const trafficClassKeys = ['class', 'classification', 'vehicleClass', 'type']
const trafficSpeedKeys = ['speed', 'speed_kph', 'speedKmh', 'velocity']
const trafficDirectionKeys = ['direction', 'heading', 'dir']
const trafficPeakKeys = ['peak_dba', 'peakDbA', 'peak', 'laeq_1m', 'peak_dB', 'peakdba']
const ALL_RANGE_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000
const INACTIVITY_STANDBY_MS = 10 * 60 * 1000

type MetricKey = 'temp' | 'hum' | 'pres' | 'gas' | 'laeq1m'

type MetricDefinition = {
  key: MetricKey
  label: string
  color: string
  unit: string
}

type TimeRangeKey =
  | 'all'
  | 'last7Days'
  | 'last24Hours'
  | 'last6Hours'
  | 'thisWeek'
  | 'lastWeek'
  | 'today'
  | 'yesterday'



function describeAuthError(error: unknown, translation: Translation): string {
  if (error && typeof error === 'object') {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : null
    const message = 'message' in error && typeof error.message === 'string' ? error.message : null

    switch (code) {
      case 'auth/popup-closed-by-user':
        return translation.authErrors.popupClosed
      case 'auth/popup-blocked':
        return translation.authErrors.popupBlocked
      case 'auth/unauthorized-domain':
        return translation.authErrors.unauthorizedDomain
      case 'auth/operation-not-allowed':
        return translation.authErrors.operationNotAllowed
      case 'auth/invalid-api-key':
        return translation.authErrors.invalidApiKey
      default:
        if (code && message) {
          return `${message} (${code})`
        }
        if (code) {
          return `${translation.authErrors.failed} (${code})`
        }
        if (message) {
          return message
        }
    }
  }
  return translation.authErrors.failed
}

const telemetryMetrics: Omit<MetricDefinition, 'label'>[] = [
  { key: 'temp', color: '#0f766e', unit: '°C' },
  { key: 'hum', color: '#2563eb', unit: '%' },
  { key: 'pres', color: '#f97316', unit: 'hPa' },
  { key: 'gas', color: '#be123c', unit: 'kΩ' },
  { key: 'laeq1m', color: '#7c3aed', unit: 'dBA' },
]

function readNumber(data: DocumentData, keys: string[]): number | null {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return null
}

function readDate(data: DocumentData, keys: string[]): Date | null {
  for (const key of keys) {
    const value = data[key]
    if (value instanceof Timestamp) {
      return value.toDate()
    }
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate()
    }
    if (typeof value === 'string' || typeof value === 'number') {
      if (typeof value === 'number' && value > 1000000000000) {
        return new Date(value)
      }
      const parsedDate = new Date(value)
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate
      }
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      'seconds' in value &&
      typeof value.seconds === 'number'
    ) {
      return new Date(value.seconds * 1000)
    }
  }
  return null
}

function readText(data: DocumentData, keys: string[], fallback = 'Unknown'): string {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }
  return fallback
}

function parseTelemetryPoint(raw: DocumentData, id: string, fallbackTime: Date): TelemetryPoint {
  const timestamp = readDate(raw, telemetryTimestampKeys) || fallbackTime

  return {
    id,
    timestamp,
    hasTimestamp: Boolean(readDate(raw, telemetryTimestampKeys)),
    temp: readNumber(raw, telemetryValueKeys.temp),
    hum: readNumber(raw, telemetryValueKeys.hum),
    pres: readNumber(raw, telemetryValueKeys.pres),
    gas: readNumber(raw, telemetryValueKeys.gas),
    laeq1m: readNumber(raw, telemetryValueKeys.laeq1m),
    raw,
  }
}

function inferConnectivity(
  data: DocumentData | undefined,
  keys: string[],
  lastSeen: Date | null,
): Connectivity {
  if (!data) {
    return 'Unknown'
  }
  const explicit = readStatus(data, keys)
  if (explicit !== 'Unknown') {
    return explicit
  }
  if (!lastSeen) {
    return 'Unknown'
  }
  return Date.now() - lastSeen.getTime() < 5 * 60 * 1000 ? 'Online' : 'Offline'
}

function readStatus(data: DocumentData | undefined, keys: string[]): Connectivity {
  if (!data) {
    return 'Unknown'
  }
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'boolean') {
      return value ? 'Online' : 'Offline'
    }
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      if (['online', 'connected', 'ok', 'up', 'active'].some((token) => normalized.includes(token))) {
        return 'Online'
      }
      if (['offline', 'disconnected', 'down', 'inactive'].some((token) => normalized.includes(token))) {
        return 'Offline'
      }
    }
  }
  return 'Unknown'
}

const CET_TZ = 'Europe/Berlin'

function formatTime(input: Date | null, locale: string, notAvailable: string): string {
  if (!input) {
    return notAvailable
  }
  return input.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: CET_TZ,
  })
}

function formatDateTime(input: Date | null, locale: string, notAvailable: string): string {
  if (!input) {
    return notAvailable
  }
  const date = input.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: CET_TZ,
  })
  const time = formatTime(input, locale, notAvailable)
  return `${date} ${time}`
}

function startOfDay(input: Date): Date {
  const result = new Date(input)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfWeek(input: Date): Date {
  const result = startOfDay(input)
  const day = result.getDay()
  const diff = (day + 6) % 7
  result.setDate(result.getDate() - diff)
  return result
}

function getTimeRangeBounds(range: TimeRangeKey, reference = new Date()): { start: Date | null; end: Date | null } {
  const end = new Date(reference)
  const startOfToday = startOfDay(reference)

  switch (range) {
    case 'all':
      return { start: null, end: null }
    case 'last7Days':
      return { start: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000), end }
    case 'last24Hours':
      return { start: new Date(end.getTime() - 24 * 60 * 60 * 1000), end }
    case 'last6Hours':
      return { start: new Date(end.getTime() - 6 * 60 * 60 * 1000), end }
    case 'thisWeek':
      return { start: startOfWeek(reference), end }
    case 'lastWeek': {
      const thisWeekStart = startOfWeek(reference)
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      return { start: lastWeekStart, end: thisWeekStart }
    }
    case 'today':
      return { start: startOfToday, end }
    case 'yesterday': {
      const yesterdayStart = new Date(startOfToday)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      return { start: yesterdayStart, end: startOfToday }
    }
  }
}

function filterTelemetryByRange(points: TelemetryPoint[], range: TimeRangeKey): TelemetryPoint[] {
  if (range === 'all') {
    return points
  }

  const { start, end } = getTimeRangeBounds(range)
  if (!start || !end) {
    return points
  }

  return points.filter((point) => point.timestamp >= start && point.timestamp < end)
}

function getRangeBoundsMs(range: TimeRangeKey, reference = new Date()): { start: number; end: number } {
  const { start, end } = getTimeRangeBounds(range, reference)
  const endMs = end ? end.getTime() : reference.getTime()
  const startMs = start ? start.getTime() : endMs - ALL_RANGE_FALLBACK_MS
  return { start: startMs, end: endMs }
}

// Y-axis: data-driven min-5 / max+5, nice tick intervals, at least 3 ticks
const Y_STEP_CANDIDATES = [5000, 2500, 2000, 1000, 500, 250, 200, 100, 50, 25, 20, 10, 5, 2, 1]

function getMetricAxis(points: TelemetryPoint[], key: MetricKey): { domain: [number, number]; ticks: number[] } {
  const values = points.map((point) => point[key]).filter((value): value is number => value !== null)
  if (values.length === 0) {
    return { domain: [0, 10], ticks: [0, 5, 10] }
  }

  const minValue = Math.min(...values) - 5
  const maxValue = Math.max(...values) + 5

  // Pick smallest step that yields 2-8 intervals across the padded range
  let selectedStep = 1
  for (const step of [...Y_STEP_CANDIDATES].reverse()) {
    const intervals = Math.round((maxValue - minValue) / step)
    if (intervals >= 2 && intervals <= 8) {
      selectedStep = step
      break
    }
  }

  const domainMin = Math.floor(minValue / selectedStep) * selectedStep
  let domainMax = Math.ceil(maxValue / selectedStep) * selectedStep
  if (domainMin === domainMax) domainMax = domainMin + selectedStep

  const ticks: number[] = []
  for (let v = domainMin; v <= domainMax; v += selectedStep) {
    ticks.push(Math.round(v))
  }
  // Guarantee at least 3 ticks
  if (ticks.length < 3) {
    const mid = Math.round((domainMin + domainMax) / 2)
    const set = new Set([domainMin, mid, domainMax, ...ticks])
    return { domain: [domainMin, domainMax], ticks: [...set].sort((a, b) => a - b) }
  }

  return { domain: [domainMin, domainMax], ticks }
}

// X-axis: iterate largest→smallest time step, pick first giving 2-8 intervals (3-9 ticks)
const X_STEP_CANDIDATES_MS = [
  7 * 24 * 60 * 60 * 1000,
  2 * 24 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  3 * 60 * 60 * 1000,
  2 * 60 * 60 * 1000,
  60 * 60 * 1000,
  30 * 60 * 1000,
  15 * 60 * 1000,
  10 * 60 * 1000,
  5 * 60 * 1000,
  2 * 60 * 1000,
  60 * 1000,
]

function getTimeAxisTicks(startMs: number, endMs: number): number[] {
  const spanMs = endMs - startMs
  if (spanMs <= 0) return [startMs, endMs]

  let selectedStep = X_STEP_CANDIDATES_MS[X_STEP_CANDIDATES_MS.length - 1]
  for (const step of X_STEP_CANDIDATES_MS) {
    const intervals = Math.floor(spanMs / step)
    if (intervals >= 2 && intervals <= 8) {
      selectedStep = step
      break
    }
  }

  const firstTick = Math.ceil(startMs / selectedStep) * selectedStep
  const ticks: number[] = []
  for (let t = firstTick; t <= endMs; t += selectedStep) {
    ticks.push(t)
  }
  // Guarantee at least 3 ticks when span is smaller than any candidate
  if (ticks.length < 3) {
    const mid = Math.round((startMs + endMs) / 2)
    const set = new Set([startMs, mid, endMs, ...ticks])
    return [...set].sort((a, b) => a - b)
  }
  return ticks
}

function formatMetricValue(value: number | null, unit: string, notAvailable: string): string {
  if (value === null) {
    return notAvailable
  }
  return `${value.toFixed(2)} ${unit}`
}

function formatAxisValue(value: number, unit: string): string {
  const rounded = Math.round(value)
  if (unit === '°C') {
    return `${rounded}°C`
  }
  return `${rounded} ${unit}`
}

function formatTooltipValue(
  value: number | string | ReadonlyArray<number | string> | null | undefined,
  notAvailable: string,
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'number' && Number.isFinite(entry) ? entry.toFixed(2) : String(entry)))
      .join(', ')
  }
  if (value === null || value === undefined) {
    return notAvailable
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : String(value)
}

function pickBucketMs(spanMs: number): number {
  if (spanMs > 14 * 24 * 60 * 60 * 1000) return 24 * 60 * 60 * 1000
  if (spanMs > 4 * 24 * 60 * 60 * 1000) return 6 * 60 * 60 * 1000
  if (spanMs > 24 * 60 * 60 * 1000) return 60 * 60 * 1000
  if (spanMs > 6 * 60 * 60 * 1000) return 30 * 60 * 1000
  if (spanMs > 90 * 60 * 1000) return 15 * 60 * 1000
  if (spanMs > 20 * 60 * 1000) return 5 * 60 * 1000
  return 60 * 1000
}

type TrafficBucket = { label: string; t: number; count: number }

function formatBucketLabel(t: number, bucketMs: number, locale: string): string {
  const date = new Date(t)
  if (bucketMs >= 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', timeZone: CET_TZ })
  }
  if (bucketMs >= 6 * 60 * 60 * 1000) {
    const day = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', timeZone: CET_TZ })
    const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CET_TZ })
    return `${day} ${time}`
  }
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CET_TZ })
}

function buildTrafficBuckets(
  events: TrafficEvent[],
  startMs: number,
  endMs: number,
  bucketMs: number,
  locale: string,
): TrafficBucket[] {
  if (endMs <= startMs) return []
  const firstBucket = Math.floor(startMs / bucketMs) * bucketMs
  const numBuckets = Math.ceil((endMs - firstBucket) / bucketMs)
  const buckets: TrafficBucket[] = Array.from({ length: numBuckets }, (_, i) => {
    const t = firstBucket + i * bucketMs
    return { t, label: formatBucketLabel(t, bucketMs, locale), count: 0 }
  })
  for (const event of events) {
    if (!event.timestamp) continue
    const ts = event.timestamp.getTime()
    if (ts < startMs || ts >= endMs) continue
    const idx = Math.floor((ts - firstBucket) / bucketMs)
    if (idx >= 0 && idx < buckets.length) buckets[idx].count++
  }
  return buckets
}

// ── Per-metric chart card with independent range + Shift+scroll zoom ─────────

type MetricChartProps = {
  metric: MetricDefinition
  telemetry: TelemetryPoint[]
  latestPoint: TelemetryPoint | null
  fontSize: number
  locale: string
  translation: Translation
  selectedRange: TimeRangeKey
  zoomWindow: { start: Date; end: Date } | null
  onZoomChange: (w: { start: Date; end: Date } | null) => void
}

function MetricChart({
  metric,
  telemetry,
  latestPoint,
  fontSize,
  locale,
  translation,
  selectedRange,
  zoomWindow,
  onZoomChange,
}: MetricChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startMs: number; endMs: number } | null>(null)
  const rangeBounds = useMemo(() => getRangeBoundsMs(selectedRange), [selectedRange])

  const filteredByRange = useMemo(
    () => filterTelemetryByRange(telemetry, selectedRange),
    [telemetry, selectedRange],
  )

  // X window for rendering
  const xWindow = useMemo(() => {
    if (!zoomWindow) return null
    return {
      start: Math.max(zoomWindow.start.getTime(), rangeBounds.start),
      end: Math.min(zoomWindow.end.getTime(), rangeBounds.end),
    }
  }, [zoomWindow, rangeBounds])

  const visibleStart = xWindow?.start ?? rangeBounds.start
  const visibleEnd = xWindow?.end ?? rangeBounds.end

  const visibleData = useMemo(() => {
    return filteredByRange.filter(
      (p) => p.timestamp.getTime() >= visibleStart && p.timestamp.getTime() <= visibleEnd,
    )
  }, [filteredByRange, visibleStart, visibleEnd])

  // Y-axis always based on the full range selection (not the zoom window)
  const axis = useMemo(() => getMetricAxis(filteredByRange, metric.key), [filteredByRange, metric.key])
  const timeTicks = useMemo(() => getTimeAxisTicks(visibleStart, visibleEnd), [visibleStart, visibleEnd])

  // ── Shift+scroll: zoom X axis ─────────────────────────────────────────────
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.shiftKey) return
      event.preventDefault()
      const currentStart = xWindow?.start ?? rangeBounds.start
      const currentEnd = xWindow?.end ?? rangeBounds.end
      const centerMs = (currentStart + currentEnd) / 2
      const halfSpanMs = (currentEnd - currentStart) / 2
      const factor = event.deltaY > 0 ? 1.5 : 1 / 1.5
      const newHalfSpan = Math.max(halfSpanMs * factor, 60_000)
      onZoomChange({
        start: new Date(centerMs - newHalfSpan),
        end: new Date(centerMs + newHalfSpan),
      })
    },
    [xWindow, rangeBounds, onZoomChange],
  )

  // ── Left-drag: pan X axis when zoomed ────────────────────────────────────
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!xWindow || event.button !== 0) return
      dragRef.current = { startX: event.clientX, startMs: xWindow.start, endMs: xWindow.end }
    },
    [xWindow],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const drag = dragRef.current
      if (!drag || !containerRef.current) return
      const containerWidth = containerRef.current.getBoundingClientRect().width
      if (containerWidth === 0) return
      const spanMs = drag.endMs - drag.startMs
      const pxDelta = event.clientX - drag.startX
      // Pixels → milliseconds (negative: drag left shifts window right)
      const msDelta = -(pxDelta / containerWidth) * spanMs
      const newStart = Math.max(rangeBounds.start, drag.startMs + msDelta)
      const newEnd = Math.min(rangeBounds.end, drag.endMs + msDelta)
      if (newEnd - newStart > 60_000) {
        onZoomChange({ start: new Date(newStart), end: new Date(newEnd) })
      }
    },
    [rangeBounds, onZoomChange],
  )

  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  const xDomain: [number, number] = [visibleStart, visibleEnd]

  return (
    <article
      ref={containerRef}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      style={{ cursor: xWindow ? 'grab' : 'default' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{metric.label}</h3>
          <p className="text-sm text-slate-600">
            {translation.latest}: {formatMetricValue(latestPoint?.[metric.key] ?? null, metric.unit, translation.notAvailable)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${metric.color}14`, color: metric.color }}
          >
            {metric.unit}
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis
              type="number"
              scale="time"
              dataKey={(p: TelemetryPoint) => p.timestamp.getTime()}
              domain={xDomain}
              ticks={timeTicks}
              tickFormatter={(ms: number) => formatTime(new Date(ms), locale, translation.notAvailable)}
              stroke="#475569"
              tick={{ fontSize }}
            />
            <YAxis
              stroke="#475569"
              domain={axis.domain}
              ticks={axis.ticks}
              tickFormatter={(v) => formatAxisValue(Number(v), metric.unit)}
              width={72}
              tick={{ fontSize }}
            />
            <Tooltip
              labelFormatter={(ms) => formatDateTime(new Date(ms as number), locale, translation.notAvailable)}
              formatter={(value) => [formatTooltipValue(value, translation.notAvailable), metric.label]}
              contentStyle={{ fontSize }}
            />
            <Line
              type="monotone"
              dataKey={metric.key}
              name={metric.label}
              stroke={metric.color}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        {xWindow ? `${formatDateTime(new Date(xWindow.start), locale, translation.notAvailable)} – ${formatDateTime(new Date(xWindow.end), locale, translation.notAvailable)}` : translation.zoomHint}
      </p>
    </article>
  )
}

function TrafficHistogramChart({
  trafficEvents,
  selectedRange,
  zoomWindow,
  onZoomChange,
  locale,
  translation,
  fontSize,
}: {
  trafficEvents: TrafficEvent[]
  selectedRange: TimeRangeKey
  zoomWindow: { start: Date; end: Date } | null
  onZoomChange: (w: { start: Date; end: Date } | null) => void
  locale: string
  translation: Translation
  fontSize: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startMs: number; endMs: number } | null>(null)

  const rangeBounds = useMemo(() => {
    return getRangeBoundsMs(selectedRange)
  }, [selectedRange])

  const xWindow = useMemo(() => {
    if (!zoomWindow) return null
    return {
      start: Math.max(zoomWindow.start.getTime(), rangeBounds.start),
      end: Math.min(zoomWindow.end.getTime(), rangeBounds.end),
    }
  }, [zoomWindow, rangeBounds])

  const visibleStart = xWindow?.start ?? rangeBounds.start
  const visibleEnd = xWindow?.end ?? rangeBounds.end
  const spanMs = Math.max(visibleEnd - visibleStart, 60_000)
  const bucketMs = pickBucketMs(spanMs)

  const buckets = useMemo(
    () => buildTrafficBuckets(trafficEvents, visibleStart, visibleEnd, bucketMs, locale),
    [trafficEvents, visibleStart, visibleEnd, bucketMs, locale],
  )

  const tickInterval = Math.max(0, Math.ceil(buckets.length / 6) - 1)

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.shiftKey) return
      event.preventDefault()
      const currentStart = xWindow?.start ?? rangeBounds.start
      const currentEnd = xWindow?.end ?? rangeBounds.end
      const centerMs = (currentStart + currentEnd) / 2
      const halfSpanMs = (currentEnd - currentStart) / 2
      const factor = event.deltaY > 0 ? 1.5 : 1 / 1.5
      const newHalfSpan = Math.max(halfSpanMs * factor, 60_000)
      onZoomChange({ start: new Date(centerMs - newHalfSpan), end: new Date(centerMs + newHalfSpan) })
    },
    [xWindow, rangeBounds, onZoomChange],
  )

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!xWindow || event.button !== 0) return
      dragRef.current = { startX: event.clientX, startMs: xWindow.start, endMs: xWindow.end }
    },
    [xWindow],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const drag = dragRef.current
      if (!drag || !containerRef.current) return
      const containerWidth = containerRef.current.getBoundingClientRect().width
      if (containerWidth === 0) return
      const span = drag.endMs - drag.startMs
      const pxDelta = event.clientX - drag.startX
      const msDelta = -(pxDelta / containerWidth) * span
      const newStart = Math.max(rangeBounds.start, drag.startMs + msDelta)
      const newEnd = Math.min(rangeBounds.end, drag.endMs + msDelta)
      if (newEnd - newStart > 60_000) {
        onZoomChange({ start: new Date(newStart), end: new Date(newEnd) })
      }
    },
    [rangeBounds, onZoomChange],
  )

  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  return (
    <article
      ref={containerRef}
      className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      style={{ cursor: xWindow ? 'grab' : 'default' }}
    >
      <div>
        <h3 className="text-base font-semibold text-slate-900">{translation.trafficOverview}</h3>
        <p className="text-sm text-slate-600">{trafficEvents.length} {translation.eventCount}</p>
      </div>
      <div className="mt-4 h-48 w-full select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis dataKey="label" interval={tickInterval} stroke="#475569" tick={{ fontSize }} />
            <YAxis allowDecimals={false} stroke="#475569" tick={{ fontSize }} width={40} />
            <Tooltip formatter={(value) => [value, translation.eventCount]} contentStyle={{ fontSize }} />
            <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        {xWindow
          ? `${formatDateTime(new Date(xWindow.start), locale, translation.notAvailable)} – ${formatDateTime(new Date(xWindow.end), locale, translation.notAvailable)}`
          : translation.zoomHint}
      </p>
    </article>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage())
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('last24Hours')
  const [zoomWindow, setZoomWindow] = useState<{ start: Date; end: Date } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(auth))
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([])
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([])
  const [fontSize, setFontSize] = useState(16)
  const [isStandby, setIsStandby] = useState(false)
  const inactivityTimerRef = useRef<number | null>(null)
  const isAuthorized = Boolean(user)
  const translation = TRANSLATIONS[language]
  const locale = LANGUAGE_LOCALES[language]
  const stationLabel = `${translation.stationType} - ${translation.stationName}`
  const stationSiteName = `${stationLabel} Dashboard`

  const timeRangeOptions = useMemo(() => getTimeRangeOptions(translation), [translation])
  const localizedTelemetryMetrics: MetricDefinition[] = useMemo(
    () => telemetryMetrics.map((metric) => ({ ...metric, label: translation.metricLabels[metric.key] })),
    [translation],
  )

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.title = stationSiteName
    document.documentElement.lang = language
  }, [language, stationSiteName])

  useEffect(() => {
    if (!auth) {
      return () => undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (resolvedUser) => {
      setUser(resolvedUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAuthorized) {
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      return () => undefined
    }

    const resetStandbyTimer = () => {
      setIsStandby(false)
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current)
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setIsStandby(true)
      }, INACTIVITY_STANDBY_MS)
    }

    const events: Array<keyof WindowEventMap> = ['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown']
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetStandbyTimer, { passive: true })
    })
    document.addEventListener('change', resetStandbyTimer, true)
    resetStandbyTimer()

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetStandbyTimer)
      })
      document.removeEventListener('change', resetStandbyTimer, true)
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }
  }, [isAuthorized])

  useEffect(() => {
    if (!db || !isAuthorized || isStandby) {
      return () => undefined
    }

    const telemetryQuery = query(
      collection(db, 'telemetry_heartbeat'),
      where('timestamp', '>=', (() => {
        const { start } = getRangeBoundsMs(selectedRange)
        return new Date(start).toISOString()
      })()),
      orderBy('timestamp', 'asc'),
    )

    const unsubscribe = onSnapshot(telemetryQuery, (snapshot) => {
      const now = Date.now()
      const fallbackSpacing = 60 * 1000
      const points = snapshot.docs.map((docSnapshot, index) => {
        const raw = docSnapshot.data()
        const fallbackTime = new Date(now - (snapshot.docs.length - 1 - index) * fallbackSpacing)
        return parseTelemetryPoint(raw, docSnapshot.id, fallbackTime)
      })

      const actualTimestampPoints = points.filter((point) => point.hasTimestamp)
      if (actualTimestampPoints.length > 0) {
        actualTimestampPoints.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime())
        setTelemetry(actualTimestampPoints)
        return
      }

      setTelemetry(points)
    })

    return () => unsubscribe()
  }, [isAuthorized, isStandby, selectedRange])

  useEffect(() => {
    if (!db || !isAuthorized || isStandby) {
      return () => undefined
    }

    const trafficQuery = query(
      collection(db, 'traffic_events'),
      where('timestamp', '>=', (() => {
        const { start } = getTimeRangeBounds(selectedRange)
        return start
          ? start.toISOString()
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      })()),
      orderBy('timestamp', 'asc'),
    )

    const unsubscribe = onSnapshot(trafficQuery, (snapshot) => {
      const events = snapshot.docs.map((docSnapshot) => {
        const raw = docSnapshot.data()
        return {
          id: docSnapshot.id,
          timestamp: readDate(raw, trafficTimestampKeys),
          className: readText(raw, trafficClassKeys),
          speed: readNumber(raw, trafficSpeedKeys),
          direction: readText(raw, trafficDirectionKeys),
          peakDba: readNumber(raw, trafficPeakKeys),
        }
      })
      setTrafficEvents(events)
    })

    return () => unsubscribe()
  }, [isAuthorized, isStandby, selectedRange])

  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null
  const radarStatus = inferConnectivity(latestTelemetry?.raw, radarStatusKeys, latestTelemetry?.timestamp ?? null)
  const sonometerStatus = inferConnectivity(
    latestTelemetry?.raw,
    sonometerStatusKeys,
    latestTelemetry?.timestamp ?? null,
  )

  const provider = useMemo(() => new GoogleAuthProvider(), [])

  const handleLogin = async () => {
    if (!auth) {
      return
    }
    setAuthError(null)
    setAuthPending(true)
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      setAuthError(describeAuthError(error, translation))
    } finally {
      setAuthPending(false)
    }
  }

  const handleLogout = async () => {
    if (!auth) {
      return
    }
    await signOut(auth)
  }

  if (firebaseEnvErrors.length > 0) {
    return (
      <main className="mx-auto max-w-3xl p-6 md:p-10">
        <section className="panel reveal rounded-3xl p-8">
          <h1 className="text-3xl font-semibold text-slate-900">{translation.firebaseConfigMissing}</h1>
          <p className="mt-3 text-slate-700">
            {translation.firebaseConfigDescription}
          </p>
          <ul className="mt-6 list-disc space-y-1 pl-6 font-mono text-sm text-slate-800">
            {firebaseEnvErrors.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      </main>
    )
  }

  if (authLoading) {
    return <main className="mx-auto max-w-3xl p-8 text-slate-800">{translation.checkingAuthentication}</main>
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:p-10">
        <section className="panel reveal rounded-3xl p-8 md:p-12">
          <p className="eyebrow">{stationLabel}</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 md:text-6xl">
            {translation.signInHeading}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            {translation.signInDescription}
          </p>
          <button
            type="button"
            onClick={() => {
              void handleLogin()
            }}
            disabled={authPending}
            className="mt-8 rounded-full bg-slate-900 px-6 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {authPending ? translation.signingIn : translation.signInWithGoogle}
          </button>
          {authError && <p className="mt-4 text-sm text-rose-700">{authError}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl p-4 pb-10 md:p-8 md:pb-14" style={{ fontSize }}>
      <header className="reveal flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/80 px-5 py-4 backdrop-blur md:px-8">
        <div>
          <p className="eyebrow">{stationSiteName}</p>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{translation.viewTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isStandby && (
            <p className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900">
              {translation.standbyMode}
            </p>
          )}
          <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-1 py-0.5">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
              aria-label={translation.decreaseFontSize}
            >
              −
            </button>
            <span className="min-w-[2.5rem] text-center text-xs font-mono text-slate-500">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(28, s + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
              aria-label={translation.increaseFontSize}
            >
              +
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{translation.language}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="bg-transparent text-sm text-slate-800 outline-none"
              aria-label={translation.language}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <p className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              void handleLogout()
            }}
            className="rounded-full border border-slate-400 px-4 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            {translation.signOut}
          </button>
        </div>
      </header>

      <section className="mt-5">
        <article className="panel reveal rounded-3xl p-6" style={{ animationDelay: '90ms' }}>
          <h2 className="text-lg font-semibold text-slate-900">{translation.liveStatus}</h2>
          <div className="mt-5 flex flex-wrap gap-4">
            <div className="status-card">
              <p className="status-label">{translation.radar}</p>
              <p className={`status-pill ${radarStatus.toLowerCase()}`}>{translation.connectivity[radarStatus]}</p>
            </div>
            <div className="status-card">
              <p className="status-label">{translation.sonometer}</p>
              <p className={`status-pill ${sonometerStatus.toLowerCase()}`}>{translation.connectivity[sonometerStatus]}</p>
            </div>
            <p className="text-sm text-slate-600 self-center">
              {translation.lastHeartbeat}: {latestTelemetry ? formatDateTime(latestTelemetry.timestamp, locale, translation.notAvailable) : translation.noDataYet}
            </p>
          </div>
        </article>
      </section>

      <section className="panel reveal mt-4 rounded-3xl p-6" style={{ animationDelay: '230ms' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{translation.environmentalTelemetry}</h2>
          <div className="flex items-center gap-2">
            {zoomWindow && (
              <button
                type="button"
                onClick={() => setZoomWindow(null)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {translation.resetZoom}
              </button>
            )}
            <select
              value={selectedRange}
              onChange={(e) => { setSelectedRange(e.target.value as TimeRangeKey); setZoomWindow(null) }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500"
              aria-label={translation.timespan}
            >
              {timeRangeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TrafficHistogramChart
            trafficEvents={trafficEvents}
            selectedRange={selectedRange}
            zoomWindow={zoomWindow}
            onZoomChange={setZoomWindow}
            locale={locale}
            translation={translation}
            fontSize={fontSize}
          />
          {localizedTelemetryMetrics.map((metric) => (
            <MetricChart
              key={metric.key}
              metric={metric}
              telemetry={telemetry}
              latestPoint={latestTelemetry}
              fontSize={fontSize}
              locale={locale}
              translation={translation}
              selectedRange={selectedRange}
              zoomWindow={zoomWindow}
              onZoomChange={setZoomWindow}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
