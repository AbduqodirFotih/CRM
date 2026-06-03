import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd'
import { CloudServerOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'

const { Title, Text, Paragraph } = Typography

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onFinish = async (values) => {
    setLoading(true)
    setError('')
    try {
      await login(values.email, values.password)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card style={{ width: 400, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <CloudServerOutlined style={{ fontSize: 48, color: '#2563EB', marginBottom: 8 }} />
              <Title level={3} style={{ margin: 0 }}>Fotih CRM</Title>
              <Text type="secondary">Sales Intelligence Platform</Text>
            </div>

            {error && <Alert message={error} type="error" showIcon />}

            <Form onFinish={onFinish} layout="vertical" initialValues={{ email: 'admin@fotihcrm.uz', password: 'admin123' }}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input prefix={<MailOutlined />} placeholder="admin@fotihcrm.uz" size="large" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 12, margin: 0 }}>
              Demo: admin@fotihcrm.uz / admin123
            </Paragraph>
          </Space>
        </Card>
      </motion.div>
    </div>
  )
}
