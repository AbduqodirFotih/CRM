import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Switch, Avatar, Dropdown, Typography } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CloudServerOutlined,
  MoonOutlined,
  SunOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'

const { Sider, Content, Header } = Layout
const { Text } = Typography

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { darkMode, toggleTheme } = useThemeStore()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
    { key: '/deals', icon: <DollarOutlined />, label: 'Deals' },
    { key: '/cloud-architecture', icon: <CloudServerOutlined />, label: 'Cloud Architecture' },
  ]

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout()
        navigate('/login')
      }
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={260}
        theme={darkMode ? 'dark' : 'light'}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: darkMode ? '1px solid #303030' : '1px solid #f0f0f0',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CloudServerOutlined style={{ fontSize: 24, color: '#2563EB' }} />
          <Text strong style={{ fontSize: 18, color: '#2563EB' }}>Fotih CRM</Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', fontWeight: 500 }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 24px', borderTop: darkMode ? '1px solid #303030' : '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Theme</Text>
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
          </div>
          <Dropdown menu={userMenu} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
              <Avatar size={36} icon={<UserOutlined />} style={{ background: '#2563EB' }}>
                {user?.full_name?.[0]}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ display: 'block', fontSize: 13 }}>{user?.full_name}</Text>
                <Text type="secondary" style={{ fontSize: 11 }} ellipsis>{user?.email}</Text>
              </div>
            </div>
          </Dropdown>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 260 }}>
        <Content style={{ padding: 24, minHeight: '100vh' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  )
}
