import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined, BankOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import useIsMobile from '../hooks/useIsMobile'

const { Title, Text } = Typography
const { Search } = Input

const statusColors = { lead: 'blue', active: 'green', churned: 'red' }

function CustomerCard({ customer, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 8,
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: 15 }}>{customer.name}</Text>
              <Tag color={statusColors[customer.status]} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                {customer.status?.toUpperCase()}
              </Tag>
            </div>
            {customer.company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12, marginBottom: 2 }}>
                <BankOutlined style={{ fontSize: 11 }} />
                <span>{customer.company}</span>
              </div>
            )}
            {customer.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12, marginBottom: 2 }}>
                <MailOutlined style={{ fontSize: 11 }} />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12 }}>
                <PhoneOutlined style={{ fontSize: 11 }} />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
          <Space size={4}>
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(customer)} />
            <Button type="text" icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(customer.id)} />
          </Space>
        </div>
      </Card>
    </motion.div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form] = Form.useForm()
  const isMobile = useIsMobile()

  const fetchCustomers = async () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    try {
      const { data } = await api.get('/api/customers', { params })
      setCustomers(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [search, statusFilter])

  const openCreate = () => { setEditing(null); form.resetFields(); setModal(true) }
  const openEdit = (record) => { setEditing(record.id); form.setFieldsValue(record); setModal(true) }
  const handleDelete = async (id) => {
    await api.delete(`/api/customers/${id}`)
    message.success('Customer deleted')
    fetchCustomers()
  }

  const handleSubmit = async (values) => {
    if (editing) {
      await api.put(`/api/customers/${editing}`, values)
      message.success('Customer updated')
    } else {
      await api.post('/api/customers', values)
      message.success('Customer created')
    }
    setModal(false)
    fetchCustomers()
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t) => t || '—' },
    { title: 'Company', dataIndex: 'company', key: 'company', render: (t) => t || '—' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (t) => t || '—', responsive: ['md'] },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusColors[s]}>{s?.toUpperCase()}</Tag>
    },
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
        <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Customers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} block={isMobile}>
          {isMobile ? 'Add' : 'Add Customer'}
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: isMobile ? 8 : 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <Search
            placeholder="Search customers..."
            allowClear
            onSearch={setSearch}
            style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
            size={isMobile ? 'middle' : 'middle'}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: isMobile ? '100%' : 140 }}
            placeholder="All Status"
            allowClear
            size={isMobile ? 'middle' : 'middle'}
          >
            <Select.Option value="lead">Lead</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="churned">Churned</Select.Option>
          </Select>
        </div>
      </Card>

      {isMobile ? (
        <div>
          <AnimatePresence>
            {customers.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
          {customers.length === 0 && !loading && (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">No customers found</Text>
            </Card>
          )}
        </div>
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Modal
        title={editing ? 'Edit Customer' : 'Add Customer'}
        open={modal}
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
        width={isMobile ? '95%' : 520}
        styles={{ body: { maxHeight: isMobile ? '60vh' : undefined, overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'lead' }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="company" label="Company">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option value="lead">Lead</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="churned">Churned</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
