import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Typography, message, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import useIsMobile from '../hooks/useIsMobile'

const { Title, Text } = Typography

const stageColors = { new: 'blue', qualified: 'purple', proposal: 'orange', won: 'green', lost: 'red' }

function DealCard({ deal, customerName, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        style={{ borderRadius: 12, marginBottom: 8 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 15 }}>{deal.title}</Text>
              <Tag color={stageColors[deal.stage]} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                {deal.stage?.toUpperCase()}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7c3aed', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              <DollarOutlined />
              <span>{Number(deal.value).toLocaleString()}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 12 }}>
              {customerName}
            </div>
          </div>
          <Space size={4}>
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(deal)} />
            <Button type="text" icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(deal.id)} />
          </Space>
        </div>
      </Card>
    </motion.div>
  )
}

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [stageFilter, setStageFilter] = useState('')
  const [form] = Form.useForm()
  const isMobile = useIsMobile()

  const fetchDeals = async () => {
    setLoading(true)
    const params = {}
    if (stageFilter) params.stage = stageFilter
    try {
      const { data } = await api.get('/api/deals', { params })
      setDeals(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/api/customers')
      setCustomers(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchDeals() }, [stageFilter])
  useEffect(() => { fetchCustomers() }, [])

  const openCreate = () => { setEditing(null); form.resetFields(); setModal(true) }
  const openEdit = (record) => { setEditing(record.id); form.setFieldsValue(record); setModal(true) }
  const handleDelete = async (id) => {
    await api.delete(`/api/deals/${id}`)
    message.success('Deal deleted')
    fetchDeals()
  }

  const handleSubmit = async (values) => {
    if (editing) {
      await api.put(`/api/deals/${editing}`, values)
      message.success('Deal updated')
    } else {
      await api.post('/api/deals', values)
      message.success('Deal created')
    }
    setModal(false)
    fetchDeals()
  }

  const getCustomerName = (id) => customers.find((c) => c.id === id)?.name || '—'

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t) => <strong>{t}</strong> },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (v) => `$${Number(v).toLocaleString()}` },
    {
      title: 'Stage', dataIndex: 'stage', key: 'stage',
      render: (s) => <Tag color={stageColors[s]}>{s?.toUpperCase()}</Tag>
    },
    { title: 'Customer', dataIndex: 'customer_id', key: 'customer', render: (id) => getCustomerName(id) },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, marginBottom: isMobile ? 12 : 20 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Deals</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} block={isMobile}>
          {isMobile ? 'Add' : 'Add Deal'}
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: isMobile ? 8 : 16 }}>
        <Select
          value={stageFilter}
          onChange={setStageFilter}
          style={{ width: isMobile ? '100%' : 160 }}
          placeholder="All Stages"
          allowClear
          size={isMobile ? 'middle' : 'middle'}
        >
          <Select.Option value="new">New</Select.Option>
          <Select.Option value="qualified">Qualified</Select.Option>
          <Select.Option value="proposal">Proposal</Select.Option>
          <Select.Option value="won">Won</Select.Option>
          <Select.Option value="lost">Lost</Select.Option>
        </Select>
      </Card>

      {isMobile ? (
        <div>
          <AnimatePresence>
            {deals.map((d) => (
              <DealCard
                key={d.id}
                deal={d}
                customerName={getCustomerName(d.customer_id)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
          {deals.length === 0 && !loading && (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">No deals found</Text>
            </Card>
          )}
        </div>
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Table
            columns={columns}
            dataSource={deals}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Modal
        title={editing ? 'Edit Deal' : 'Add Deal'}
        open={modal}
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
        width={isMobile ? '95%' : 520}
        styles={{ body: { maxHeight: isMobile ? '60vh' : undefined, overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ stage: 'new', value: 0 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="value" label="Value ($)">
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item name="stage" label="Stage">
            <Select>
              <Select.Option value="new">New</Select.Option>
              <Select.Option value="qualified">Qualified</Select.Option>
              <Select.Option value="proposal">Proposal</Select.Option>
              <Select.Option value="won">Won</Select.Option>
              <Select.Option value="lost">Lost</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="customer_id" label="Customer" rules={[{ required: true }]}>
            <Select placeholder="Select customer">
              {customers.map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
