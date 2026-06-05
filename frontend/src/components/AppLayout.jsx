import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Switch, Avatar, Dropdown, Typography, Drawer, Button } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CloudServerOutlined,
  MoonOutlined,
  SunOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  AppstoreOutlined,
  HomeOutlined,
  PieChartOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import useIsMobile from '../hooks/useIsMobile'

const { Sider, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { darkMode, toggleTheme } = useThemeStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useIsMobile()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
    { key: '/deals', icon: <DollarOutlined />, label: 'Deals' },
    { key: '/cloud-architecture', icon: <CloudServerOutlined />, label: 'Cloud Architecture' },
  ]

  const bottomNavItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Home' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
    { key: '/deals', icon: <PieChartOutlined />, label: 'Deals' },
    { key: '/cloud-architecture', icon: <AppstoreOutlined />, label: 'Cloud' },
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

  const handleNavigate = (key) => {
    navigate(key)
    setDrawerOpen(false)
  }

  // Desktop sidebar content
  const siderContent = (
    <>
      <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CloudServerOutlined style={{ fontSize: 24, color: '#2563EB' }} />
        <Text strong style={{ fontSize: 18, color: '#2563EB' }}>Fotih CRM</Text>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleNavigate(key)}
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
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          width={260}
          theme={darkMode ? 'dark' : 'light'}
          className="desktop-sider"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: darkMode ? '1px solid #303030' : '1px solid #f0f0f0',
            overflow: 'auto',
            zIndex: 100,
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' },
        }}
        className="mobile-drawer"
      >
        {siderContent}
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : 260 }}>
        {/* Mobile Header */}
        {isMobile && (
          <div
            className="mobile-header"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: darkMode ? '#141414' : '#fff',
              borderBottom: darkMode ? '1px solid #303030' : '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ fontSize: 18, width: 40, height: 40 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CloudServerOutlined style={{ fontSize: 20, color: '#2563EB' }} />
                <Text strong style={{ fontSize: 16, color: '#2563EB' }}>Fotih CRM</Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch
                size="small"
                checked={darkMode}
                onChange={toggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
              <Dropdown menu={userMenu} trigger={['click']}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: '#2563EB', cursor: 'pointer' }}>
                  {user?.full_name?.[0]}
                </Avatar>
              </Dropdown>
            </div>
          </div>
        )}

        <Content
          className="mobile-content"
          style={{
            padding: isMobile ? 12 : 24,
            minHeight: '100vh',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 100,
            boxShadow: darkMode
              ? '0 -2px 8px rgba(0,0,0,0.3)'
              : '0 -2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.key
            return (
              <div
                key={item.key}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigate(item.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  color: isActive ? '#2563EB' : (darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                  transition: 'color 0.2s',
                  minWidth: 60,
                }}
              >
                <div style={{ fontSize: 20, lineHeight: 1 }}>
                  {item.icon}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    style={{
                      position: 'absolute',
                      top: 2,
                      width: 24,
                      height: 2,
                      borderRadius: 1,
                      background: '#2563EB',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
