import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Statistic, Segmented, Typography, Space, Tag } from 'antd'
import { TeamOutlined, DollarOutlined, RiseOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { Line, Column, Pie } from '@ant-design/charts'
import api from '../api'
import useThemeStore from '../store/themeStore'

const { Title, Text } = Typography

// Generate 1 year of fake daily data
function generateYearData() {
  const data = []
  const now = new Date()
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    data.push({
      date: dateStr,
      newCustomers: Math.floor(Math.random() * 8) + 1,
      revenue: Math.floor(Math.random() * 15000) + 2000,
      deals: Math.floor(Math.random() * 5) + 1,
      churned: Math.floor(Math.random() * 3),
    })
  }
  return data
}

function aggregateData(raw, period) {
  if (period === 'daily') return raw.slice(-30)
  if (period === 'weekly') {
    const weeks = []
    for (let i = 0; i < raw.length; i += 7) {
      const chunk = raw.slice(i, i + 7)
      if (chunk.length === 0) continue
      weeks.push({
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
  // yearly
  const total = raw.reduce(
    (acc, d) => ({
      date: 'Year',
      newCustomers: acc.newCustomers + d.newCustomers,
      revenue: acc.revenue + d.revenue,
      deals: acc.deals + d.deals,
      churned: acc.churned + d.churned,
    }),
    { date: 'Year', newCustomers: 0, revenue: 0, deals: 0, churned: 0 }
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
  const rawData = useMemo(() => generateYearData(), [])
  const chartData = useMemo(() => aggregateData(rawData, period), [rawData, period])

  useEffect(() => {
    api.get('/api/dashboard').then((r) => setStats(r.data)).catch(() => {})
  }, [])

  const totalNewCustomers = rawData.reduce((s, d) => s + d.newCustomers, 0)
  const totalRevenue = rawData.reduce((s, d) => s + d.revenue, 0)
  const totalDeals = rawData.reduce((s, d) => s + d.deals, 0)

  const statCards = [
    { title: 'Total Customers', value: stats?.total_customers || totalNewCustomers, icon: <TeamOutlined />, color: '#2563EB', change: '+12.5%', up: true },
    { title: 'Active Customers', value: stats?.active_customers || Math.floor(totalNewCustomers * 0.6), icon: <RiseOutlined />, color: '#059669', change: '+8.2%', up: true },
    { title: 'Pipeline Value', value: stats?.pipeline_value || totalRevenue * 0.4, icon: <DollarOutlined />, color: '#7c3aed', prefix: '$', change: '+15.3%', up: true },
    { title: 'Won Revenue', value: stats?.won_value || totalRevenue * 0.6, icon: <TrophyOutlined />, color: '#ea580c', prefix: '$', change: '+22.1%', up: true },
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
  }

  const columnConfig = {
    data: chartData.map((d) => ({ date: d.date, revenue: d.revenue })),
    xField: 'date',
    yField: 'revenue',
    color: '#7c3aed',
    animation: { appear: { type: 'grow-in-y', duration: 1000 } },
    theme: darkMode ? 'classicDark' : 'classic',
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
    label: { text: 'type', position: 'outside' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Segmented
          options={['daily', 'weekly', 'monthly', 'yearly']}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <motion.div custom={i} initial="hidden" animate="visible" variants={statCardVariant}>
              <Card hoverable style={{ borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    prefix={card.prefix}
                    valueStyle={{ color: card.color, fontWeight: 700 }}
                  />
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: card.color }}>
                    {card.icon}
                  </div>
                </div>
                <Tag color={card.up ? 'green' : 'red'} style={{ marginTop: 8 }}>
                  {card.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {card.change}
                </Tag>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card title="Customer Growth" style={{ borderRadius: 12 }}>
              <Line {...lineConfig} height={280} />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card title="Deals Pipeline" style={{ borderRadius: 12 }}>
              <Pie {...pieConfig} height={280} />
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card title="Revenue Trend" style={{ borderRadius: 12 }}>
              <Column {...columnConfig} height={250} />
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  )
}
