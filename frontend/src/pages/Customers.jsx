import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Card, Input as AntInput } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import api from '../api'

const { Title } = Typography
const { Search } = AntInput

const statusColors = { lead: 'blue', active: 'green', churned: 'red' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form] = Form.useForm()

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
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (t) => t || '—' },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Customers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Customer</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Search placeholder="Search customers..." allowClear onSearch={setSearch} style={{ width: 260 }} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} placeholder="All Status" allowClear>
            <Select.Option value="lead">Lead</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="churned">Churned</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Customer' : 'Add Customer'}
        open={modal}
        onCancel={() => setModal(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
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
