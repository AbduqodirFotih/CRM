import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Typography, message, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import api from '../api'

const { Title } = Typography

const stageColors = { new: 'blue', qualified: 'purple', proposal: 'orange', won: 'green', lost: 'red' }

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [stageFilter, setStageFilter] = useState('')
  const [form] = Form.useForm()

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Deals</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Deal</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Select value={stageFilter} onChange={setStageFilter} style={{ width: 160 }} placeholder="All Stages" allowClear>
          <Select.Option value="new">New</Select.Option>
          <Select.Option value="qualified">Qualified</Select.Option>
          <Select.Option value="proposal">Proposal</Select.Option>
          <Select.Option value="won">Won</Select.Option>
          <Select.Option value="lost">Lost</Select.Option>
        </Select>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={deals}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Deal' : 'Add Deal'}
        open={modal}
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
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
