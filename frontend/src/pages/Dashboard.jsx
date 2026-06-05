import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, Segmented, Typography, Tag } from 'antd'
import { TeamOutlined, DollarOutlined, RiseOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { Line, Column, Pie } from '@ant-design/charts'
import api from '../api'
import useThemeStore from '../store/themeStore'
import useIsMobile from '../hooks/useIsMobile'

const { Title } = Typography

// Generate 1 year of fake daily data (seeded for consistency)
function generateYearData() {
  const data = []
  const now = new Date()
  let seed = 42
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF; return (seed >>> 0) / 0xFFFFFFFF }

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const month = date.getMonth()
    const seasonFactor = (month >= 9 || month <= 2) ? 1.4 : 1.0
    data.push({
      date: dateStr,
      newCustomers: Math.floor(rand() * 12 * seasonFactor) + 2,
      revenue: Math.floor(rand() * 25000 * seasonFactor) + 5000,
      deals: Math.floor(rand() * 8 * seasonFactor) + 1,
      churned: Math.floor(rand() * 4),
    })
  }
  return data
}

function aggregateData(raw, period) {
  if (period === 'daily') return raw.slice(-30)
  if (period === 'weekly') {
    const weeks = []
    for (let i = raw.length - 1; i >= 0; i -= 7) {
      const start = Math.max(0, i - 6)
      const chunk = raw.slice(start, i + 1)
      if (chunk.length === 0) continue
      weeks.unshift({
        date: chunk[0].date,
        newCustomers: chunk.reduce((s, d) => s + d.newCustomers, 0),
        revenue: chunk.reduce((s, d) => s + d.revenue, 0),
        deals: chunk.reduce((s, d) => s + d.deals, 0),
        churned: chunk.reduce((s, d) => s + d.churned, 0),
      })
    }
    return weeks.slice(-12)
  }
  if (period === 'monthly') {
    const months = {}
    raw.forEach((d) => {
      const key = d.date.substring(0, 7)
      if (!months[key]) months[key] = { date: key, newCustomers: 0, revenue: 0, deals: 0, churned: 0 }
      months[key].newCustomers += d.newCustomers
      months[key].revenue += d.revenue
      months[key].deals += d.deals
      months[key].churned += d.churned
    })
    return Object.values(months)
  }
  const total = raw.reduce(
    (acc, d) => ({
      date: 'Year Total',
      newCustomers: acc.newCustomers + d.newCustomers,
      revenue: acc.revenue + d.revenue,
      deals: acc.deals + d.deals,
      churned: acc.churned + d.churned,
    }),
    { date: 'Year Total', newCustomers: 0, revenue: 0, deals: 0, churned: 0 }
  )
  return [total]
}

const statCardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState('monthly')
  const darkMode = useThemeStore((s) => s.darkMode)
  const isMobile = useIsMobile()
  const rawData = useMemo(() => generateYearData(), [])
  const chartData = useMemo(() => aggregateData(rawData, period), [rawData, period])

  useEffect(() => {
    api.get('/api/dashboard').then((r) => setStats(r.data)).catch(() => {})
  }, [])

  const periodTotals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        newCustomers: acc.newCustomers + d.newCustomers,
        revenue: acc.revenue + d.revenue,
        deals: acc.deals + d.deals,
        churned: acc.churned + d.churned,
      }),
      { newCustomers: 0, revenue: 0, deals: 0, churned: 0 }
    )
  }, [chartData])

  const prevPeriodTotals = useMemo(() => {
    let prevData = []
    if (period === 'daily') prevData = rawData.slice(-60, -30)
    else if (period === 'weekly') prevData = rawData.slice(-168, -84)
    else if (period === 'monthly') {
      const allMonths = aggregateData(rawData, 'monthly')
      const half = Math.floor(allMonths.length / 2)
      prevData = allMonths.slice(0, half)
    } else {
      prevData = rawData.slice(0, Math.floor(rawData.length / 2))
    }
    return prevData.reduce(
      (acc, d) => ({
        newCustomers: acc.newCustomers + (d.newCustomers || 0),
        revenue: acc.revenue + (d.revenue || 0),
        deals: acc.deals + (d.deals || 0),
        churned: acc.churned + (d.churned || 0),
      }),
      { newCustomers: 0, revenue: 0, deals: 0, churned: 0 }
    )
  }, [rawData, period, chartData])

  const calcChange = (current, previous) => {
    if (previous === 0) return { text: '+100%', up: true }
    const pct = ((current - previous) / previous * 100).toFixed(1)
    return { text: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 }
  }

  const customerChange = calcChange(periodTotals.newCustomers, prevPeriodTotals.newCustomers)
  const revenueChange = calcChange(periodTotals.revenue, prevPeriodTotals.revenue)
  const dealsChange = calcChange(periodTotals.deals, prevPeriodTotals.deals)

  const statCards = [
    { title: 'New Customers', value: periodTotals.newCustomers, icon: <TeamOutlined />, color: '#2563EB', ...customerChange },
    { title: 'Active (net)', value: periodTotals.newCustomers - periodTotals.churned, icon: <RiseOutlined />, color: '#059669', ...calcChange(periodTotals.newCustomers - periodTotals.churned, prevPeriodTotals.newCustomers - prevPeriodTotals.churned) },
    { title: 'Revenue', value: periodTotals.revenue, icon: <DollarOutlined />, color: '#7c3aed', prefix: '$', ...revenueChange },
    { title: 'Deals Closed', value: periodTotals.deals, icon: <TrophyOutlined />, color: '#ea580c', ...dealsChange },
  ]

  const lineConfig = {
    data: chartData.map((d) => [
      { date: d.date, value: d.newCustomers, type: 'New Customers' },
      { date: d.date, value: d.churned, type: 'Churned' }
    ]).flat(),
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    color: ['#2563EB', '#DC2626'],
    smooth: true,
    animation: { appear: { type: 'wave-in', duration: 1200 } },
    theme: darkMode ? 'classicDark' : 'classic',
    xAxis: isMobile ? { label: { autoRotate: false, style: { fontSize: 10 } } } : {},
  }

  const columnConfig = {
    data: chartData.map((d) => ({ date: d.date, revenue: d.revenue })),
    xField: 'date',
    yField: 'revenue',
    color: '#7c3aed',
    animation: { appear: { type: 'grow-in-y', duration: 1000 } },
    theme: darkMode ? 'classicDark' : 'classic',
    xAxis: isMobile ? { label: { autoRotate: false, style: { fontSize: 10 } } } : {},
  }

  const pieData = stats ? [
    { type: 'New', value: stats.deals_by_stage?.new || 0 },
    { type: 'Qualified', value: stats.deals_by_stage?.qualified || 0 },
    { type: 'Proposal', value: stats.deals_by_stage?.proposal || 0 },
    { type: 'Won', value: stats.deals_by_stage?.won || 0 },
    { type: 'Lost', value: stats.deals_by_stage?.lost || 0 },
  ] : [
    { type: 'New', value: 25 },
    { type: 'Qualified', value: 20 },
    { type: 'Proposal', value: 18 },
    { type: 'Won', value: 30 },
    { type: 'Lost', value: 7 },
  ]

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    color: ['#3B82F6', '#8B5CF6', '#F59E0B', '#059669', '#DC2626'],
    innerRadius: 0.6,
    animation: { appear: { type: 'wave-in', duration: 1000 } },
    theme: darkMode ? 'classicDark' : 'classic',
    label: { text: 'type', position: isMobile ? 'outside' : 'outside' },
  }

  const periodLabel = { daily: 'Last 30 Days', weekly: 'Last 12 Weeks', monthly: 'Last 12 Months', yearly: 'Full Year' }

  return (
    <div>
      <div className="page-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 16 : 24 }}>
        <div>
          <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Dashboard</Title>
          <span style={{ color: '#64748b', fontSize: isMobile ? 12 : 13 }}>{periodLabel[period]}</span>
        </div>
        <Segmented
          options={[
            { label: 'Day', value: 'daily' },
            { label: 'Week', value: 'weekly' },
            { label: 'Month', value: 'monthly' },
            { label: 'Year', value: 'yearly' },
          ]}
          value={period}
          onChange={setPeriod}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      <Row gutter={isMobile ? [8, 8] : [16, 16]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        {statCards.map((card, i) => (
          <Col xs={12} sm={12} lg={6} key={card.title}>
            <motion.div custom={i} initial="hidden" animate="visible" variants={statCardVariant} key={period + card.title}>
              <Card hoverable style={{ borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    prefix={card.prefix}
                    valueStyle={{ color: card.color, fontWeight: 700, fontSize: isMobile ? 20 : 24 }}
                  />
                  <div style={{
                    width: isMobile ? 36 : 48,
                    height: isMobile ? 36 : 48,
                    borderRadius: isMobile ? 8 : 12,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 18 : 22,
                    color: card.color,
                  }}>
                    {card.icon}
                  </div>
                </div>
                <Tag color={card.up ? 'green' : 'red'} style={{ marginTop: 8, fontSize: isMobile ? 11 : 12 }}>
                  {card.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {card.text}
                </Tag>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={isMobile ? [8, 8] : [16, 16]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        <Col xs={24} lg={16}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card title="Customer Growth" style={{ borderRadius: 12 }}>
              <Line {...lineConfig} height={isMobile ? 200 : 280} key={period + 'line'} />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card title="Deals Pipeline" style={{ borderRadius: 12 }}>
              <Pie {...pieConfig} height={isMobile ? 200 : 280} />
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row gutter={isMobile ? [8, 8] : [16, 16]}>
        <Col xs={24}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card title="Revenue Trend" style={{ borderRadius: 12 }}>
              <Column {...columnConfig} height={isMobile ? 200 : 250} key={period + 'col'} />
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  )
}
