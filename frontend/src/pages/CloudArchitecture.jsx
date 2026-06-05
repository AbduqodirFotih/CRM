import React, { useState } from 'react'
import { Card, Row, Col, Typography, Tabs, Tag, Timeline, Steps, Collapse, Descriptions, Space } from 'antd'
import {
  CloudServerOutlined, GlobalOutlined, DatabaseOutlined, SafetyCertificateOutlined,
  DeploymentUnitOutlined, BranchesOutlined, GithubOutlined, CheckCircleOutlined,
  ClusterOutlined, LockOutlined, ApiOutlined, RocketOutlined, CloudOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import useThemeStore from '../store/themeStore'
import useIsMobile from '../hooks/useIsMobile'

const { Title, Text, Paragraph } = Typography

// ===== AWS NETWORK ARCHITECTURE DIAGRAM =====
const awsNodes = [
  { id: 'vpc', position: { x: 50, y: 50 }, data: { label: '☁️ VPC 10.0.0.0/16' }, style: { width: 750, height: 500, background: 'rgba(37,99,235,0.05)', border: '2px dashed #2563EB', borderRadius: 12 }, type: 'group' },
  { id: 'public-subnet', position: { x: 20, y: 60 }, data: { label: '🌐 Public Subnet (10.0.1.0/24)' }, parentNode: 'vpc', style: { width: 340, height: 400, background: 'rgba(5,150,105,0.05)', border: '1px solid #059669', borderRadius: 8 }, type: 'group' },
  { id: 'private-subnet', position: { x: 390, y: 60 }, data: { label: '🔒 Private Subnet (10.0.2.0/24)' }, parentNode: 'vpc', style: { width: 340, height: 400, background: 'rgba(220,38,38,0.05)', border: '1px solid #DC2626', borderRadius: 8 }, type: 'group' },
  { id: 'igw', position: { x: 300, y: -80 }, data: { label: '🌍 Internet Gateway' }, style: { background: '#dbeafe', border: '2px solid #2563EB', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'alb', position: { x: 60, y: 80 }, data: { label: '⚖️ Application Load Balancer (Nginx)' }, parentNode: 'public-subnet', style: { background: '#dcfce7', border: '2px solid #059669', borderRadius: 8, padding: '10px 14px', fontWeight: 600, width: 220 } },
  { id: 'nat', position: { x: 60, y: 220 }, data: { label: '🔄 NAT Gateway' }, parentNode: 'public-subnet', style: { background: '#fef3c7', border: '2px solid #d97706', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'api1', position: { x: 40, y: 80 }, data: { label: '🖥️ API Instance 1' }, parentNode: 'private-subnet', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '8px 12px' } },
  { id: 'api2', position: { x: 40, y: 150 }, data: { label: '🖥️ API Instance 2' }, parentNode: 'private-subnet', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '8px 12px' } },
  { id: 'api3', position: { x: 40, y: 220 }, data: { label: '🖥️ API Instance 3' }, parentNode: 'private-subnet', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '8px 12px' } },
  { id: 'rds', position: { x: 80, y: 310 }, data: { label: '🗄️ RDS PostgreSQL' }, parentNode: 'private-subnet', style: { background: '#fff7ed', border: '2px solid #ea580c', borderRadius: 8, padding: '10px 14px', fontWeight: 600 } },
  { id: 'users', position: { x: 300, y: -160 }, data: { label: '👥 Users / Internet' }, style: { background: '#f1f5f9', border: '2px solid #64748b', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
]

const awsEdges = [
  { id: 'e-users-igw', source: 'users', target: 'igw', animated: true, style: { stroke: '#2563EB' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-igw-alb', source: 'igw', target: 'alb', animated: true, style: { stroke: '#059669' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-alb-api1', source: 'alb', target: 'api1', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-alb-api2', source: 'alb', target: 'api2', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-alb-api3', source: 'alb', target: 'api3', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-api1-rds', source: 'api1', target: 'rds', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-api2-rds', source: 'api2', target: 'rds', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-api3-rds', source: 'api3', target: 'rds', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-nat-igw', source: 'nat', target: 'igw', style: { stroke: '#d97706', strokeDasharray: '3 3' }, label: 'outbound', markerEnd: { type: MarkerType.ArrowClosed } },
]

// ===== CI/CD PIPELINE DIAGRAM =====
const cicdNodes = [
  { id: 'dev', position: { x: 0, y: 150 }, data: { label: '👨‍💻 Developer Push' }, style: { background: '#f1f5f9', border: '2px solid #64748b', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'github', position: { x: 200, y: 150 }, data: { label: '🐙 GitHub Repository' }, style: { background: '#0d1117', color: '#fff', border: '2px solid #30363d', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'actions', position: { x: 420, y: 80 }, data: { label: '⚡ GitHub Actions CI' }, style: { background: '#dbeafe', border: '2px solid #2563EB', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'test', position: { x: 420, y: 220 }, data: { label: '🧪 Test & Lint' }, style: { background: '#dcfce7', border: '2px solid #059669', borderRadius: 8, padding: '10px 14px' } },
  { id: 'build', position: { x: 640, y: 80 }, data: { label: '🏗️ Docker Build' }, style: { background: '#ede9fe', border: '2px solid #7c3aed', borderRadius: 8, padding: '10px 14px', fontWeight: 600 } },
  { id: 'ghcr', position: { x: 640, y: 220 }, data: { label: '📦 GHCR Registry' }, style: { background: '#fef3c7', border: '2px solid #d97706', borderRadius: 8, padding: '10px 14px', fontWeight: 600 } },
  { id: 'deploy', position: { x: 870, y: 150 }, data: { label: '🚀 SSH Deploy to EC2' }, style: { background: '#fce4ec', border: '2px solid #DC2626', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
  { id: 'server', position: { x: 1080, y: 150 }, data: { label: '🖥️ Production Server' }, style: { background: '#dcfce7', border: '2px solid #059669', borderRadius: 8, padding: '10px 16px', fontWeight: 600 } },
]

const cicdEdges = [
  { id: 'cd1', source: 'dev', target: 'github', animated: true, style: { stroke: '#64748b' }, label: 'git push', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd2', source: 'github', target: 'actions', animated: true, style: { stroke: '#2563EB' }, label: 'trigger', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd3', source: 'actions', target: 'test', style: { stroke: '#059669' }, label: 'pytest + build', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd4', source: 'actions', target: 'build', style: { stroke: '#7c3aed' }, label: 'docker build', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd5', source: 'build', target: 'ghcr', animated: true, style: { stroke: '#d97706' }, label: 'push image', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd6', source: 'ghcr', target: 'deploy', style: { stroke: '#DC2626' }, label: 'pull', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'cd7', source: 'deploy', target: 'server', animated: true, style: { stroke: '#059669' }, label: 'docker compose up', markerEnd: { type: MarkerType.ArrowClosed } },
]

// ===== DOCKER ARCHITECTURE DIAGRAM =====
const dockerNodes = [
  { id: 'docker-host', position: { x: 50, y: 40 }, data: { label: '🐳 Docker Host (EC2)' }, style: { width: 650, height: 380, background: 'rgba(37,99,235,0.03)', border: '2px dashed #2563EB', borderRadius: 12 }, type: 'group' },
  { id: 'nginx-c', position: { x: 30, y: 60 }, data: { label: '🌐 Nginx Container\n(Port 80)' }, parentNode: 'docker-host', style: { background: '#dcfce7', border: '2px solid #059669', borderRadius: 8, padding: '12px', fontWeight: 600, width: 150, whiteSpace: 'pre-line' } },
  { id: 'api-c1', position: { x: 250, y: 50 }, data: { label: '⚙️ API Container 1\n(Port 8000)' }, parentNode: 'docker-host', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '10px', whiteSpace: 'pre-line' } },
  { id: 'api-c2', position: { x: 250, y: 140 }, data: { label: '⚙️ API Container 2\n(Port 8000)' }, parentNode: 'docker-host', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '10px', whiteSpace: 'pre-line' } },
  { id: 'api-c3', position: { x: 250, y: 230 }, data: { label: '⚙️ API Container 3\n(Port 8000)' }, parentNode: 'docker-host', style: { background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8, padding: '10px', whiteSpace: 'pre-line' } },
  { id: 'db-c', position: { x: 480, y: 130 }, data: { label: '🗄️ PostgreSQL\nContainer' }, parentNode: 'docker-host', style: { background: '#fff7ed', border: '2px solid #ea580c', borderRadius: 8, padding: '12px', fontWeight: 600, whiteSpace: 'pre-line' } },
  { id: 'private-net-d', position: { x: 220, y: 310 }, data: { label: '🔗 private_net (bridge)' }, parentNode: 'docker-host', style: { background: '#fce4ec', border: '1px solid #DC2626', borderRadius: 6, padding: '6px 12px', fontSize: 11 } },
  { id: 'public-net-d', position: { x: 30, y: 310 }, data: { label: '🌐 public_net (bridge)' }, parentNode: 'docker-host', style: { background: '#dbeafe', border: '1px solid #2563EB', borderRadius: 6, padding: '6px 12px', fontSize: 11 } },
]

const dockerEdges = [
  { id: 'de1', source: 'nginx-c', target: 'api-c1', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed }, label: '/api/*' },
  { id: 'de2', source: 'nginx-c', target: 'api-c2', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'de3', source: 'nginx-c', target: 'api-c3', style: { stroke: '#7c3aed' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'de4', source: 'api-c1', target: 'db-c', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'de5', source: 'api-c2', target: 'db-c', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'de6', source: 'api-c3', target: 'db-c', style: { stroke: '#ea580c', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed } },
]

export default function CloudArchitecture() {
  const darkMode = useThemeStore((s) => s.darkMode)
  const isMobile = useIsMobile()

  const tabItems = [
    {
      key: 'aws',
      label: <span><CloudOutlined /> {isMobile ? 'AWS' : 'AWS Network'}</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Title level={isMobile ? 5 : 5}>AWS VPC Network Architecture</Title>
          <Paragraph type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Multi-AZ deployment with public/private subnets, ALB, and RDS.</Paragraph>
          <div style={{ height: isMobile ? 350 : 550, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <ReactFlow
              nodes={awsNodes}
              edges={awsEdges}
              fitView
              attributionPosition="bottom-left"
              minZoom={isMobile ? 0.3 : 0.5}
            >
              <Background gap={20} color={darkMode ? '#333' : '#f0f0f0'} />
              <Controls />
              {!isMobile && <MiniMap />}
            </ReactFlow>
          </div>
          <Row gutter={isMobile ? 8 : 16} style={{ marginTop: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 8, marginBottom: isMobile ? 8 : 0 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Region">eu-west-1 (Ireland)</Descriptions.Item>
                  <Descriptions.Item label="VPC CIDR">10.0.0.0/16</Descriptions.Item>
                  <Descriptions.Item label="Public Subnet">10.0.1.0/24</Descriptions.Item>
                  <Descriptions.Item label="Private Subnet">10.0.2.0/24</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 8, marginBottom: isMobile ? 8 : 0 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Instance Type">t3.micro</Descriptions.Item>
                  <Descriptions.Item label="OS">Ubuntu 22.04 LTS</Descriptions.Item>
                  <Descriptions.Item label="Storage">20GB gp3 EBS</Descriptions.Item>
                  <Descriptions.Item label="Key Pair">CRM.pem</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="DB Engine">PostgreSQL 16</Descriptions.Item>
                  <Descriptions.Item label="Security">SG rules</Descriptions.Item>
                  <Descriptions.Item label="NAT">For outbound</Descriptions.Item>
                  <Descriptions.Item label="DNS">Route 53 (optional)</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'cicd',
      label: <span><RocketOutlined /> {isMobile ? 'CI/CD' : 'CI/CD Pipeline'}</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Title level={5}>Continuous Integration & Deployment Pipeline</Title>
          <Paragraph type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Automated build, test, and deploy on every push to main branch.</Paragraph>
          <div style={{ height: isMobile ? 280 : 400, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <ReactFlow
              nodes={cicdNodes}
              edges={cicdEdges}
              fitView
              attributionPosition="bottom-left"
              minZoom={isMobile ? 0.2 : 0.5}
            >
              <Background gap={20} color={darkMode ? '#333' : '#f0f0f0'} />
              <Controls />
            </ReactFlow>
          </div>
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <Steps
              current={6}
              size={isMobile ? 'small' : 'small'}
              direction={isMobile ? 'vertical' : 'horizontal'}
              items={[
                { title: 'Push', description: 'Developer pushes to main' },
                { title: 'Trigger', description: 'GitHub Actions activated' },
                { title: 'Test', description: 'pytest + npm run build' },
                { title: 'Build', description: 'Docker images built' },
                { title: 'Push', description: 'Images → GHCR' },
                { title: 'Deploy', description: 'SSH → docker compose up' },
                { title: 'Live', description: 'Production updated' },
              ]}
            />
          </div>
        </Card>
      )
    },
    {
      key: 'docker',
      label: <span><DeploymentUnitOutlined /> {isMobile ? 'Docker' : 'Docker Architecture'}</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Title level={5}>Docker Container Architecture</Title>
          <Paragraph type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Multi-container setup with Nginx load balancer and scalable API instances.</Paragraph>
          <div style={{ height: isMobile ? 300 : 500, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <ReactFlow
              nodes={dockerNodes}
              edges={dockerEdges}
              fitView
              attributionPosition="bottom-left"
              minZoom={isMobile ? 0.2 : 0.5}
            >
              <Background gap={20} color={darkMode ? '#333' : '#f0f0f0'} />
              <Controls />
              {!isMobile && <MiniMap />}
            </ReactFlow>
          </div>
          <Collapse
            style={{ marginTop: 16 }}
            items={[
              {
                key: '1',
                label: '📄 docker-compose.yml Configuration',
                children: (
                  <pre style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: isMobile ? 10 : 16, borderRadius: 8, fontSize: isMobile ? 10 : 12, overflow: 'auto' }}>
{`services:
  db:
    image: postgres:16-alpine
    healthcheck: pg_isready -U crmuser
    networks: [private_net]

  api:
    build: ./backend
    scale: 3  # --scale api=3
    depends_on: db (healthy)
    networks: [private_net]

  nginx:
    build: ./nginx
    ports: ["80:80"]
    networks: [private_net, public_net]

networks:
  private_net: {driver: bridge}
  public_net: {driver: bridge}`}
                  </pre>
                )
              },
              {
                key: '2',
                label: '🔒 Security Configuration',
                children: (
                  <Space direction="vertical" size="small" wrap>
                    <Tag color="green">JWT Authentication (HS256)</Tag>
                    <Tag color="blue">bcrypt Password Hashing</Tag>
                    <Tag color="purple">Private Network Isolation</Tag>
                    <Tag color="orange">CORS Configuration</Tag>
                    <Tag color="red">Security Groups (AWS)</Tag>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )
    },
    {
      key: 'security',
      label: <span><LockOutlined /> Security</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Title level={5}>Security Architecture</Title>
          <Row gutter={isMobile ? [8, 8] : [16, 16]}>
            <Col xs={24} sm={12}>
              <Card title="🔐 Authentication & Authorization" size="small" style={{ borderRadius: 8 }}>
                <Timeline
                  items={[
                    { color: 'blue', children: 'OAuth2 Password Flow (JWT)' },
                    { color: 'green', children: 'bcrypt password hashing (cost=12)' },
                    { color: 'purple', children: 'Token expiry: 24 hours' },
                    { color: 'orange', children: 'Protected API endpoints' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="🛡️ Network Security" size="small" style={{ borderRadius: 8 }}>
                <Timeline
                  items={[
                    { color: 'red', children: 'Security Group: Port 22 (SSH), 80 (HTTP)' },
                    { color: 'blue', children: 'Private subnet for DB & API' },
                    { color: 'green', children: 'NAT Gateway for outbound' },
                    { color: 'purple', children: 'Docker network isolation' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="📡 Data Protection" size="small" style={{ borderRadius: 8 }}>
                <Timeline
                  items={[
                    { color: 'green', children: 'PostgreSQL with parameterized queries' },
                    { color: 'blue', children: 'Input validation (Pydantic)' },
                    { color: 'orange', children: 'CORS policy configured' },
                    { color: 'red', children: 'Secrets in GitHub Actions vault' },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card title="🏗️ Infrastructure Security" size="small" style={{ borderRadius: 8 }}>
                <Timeline
                  items={[
                    { color: 'blue', children: 'EC2 key-pair authentication' },
                    { color: 'green', children: 'GHCR private container registry' },
                    { color: 'purple', children: 'Least privilege IAM roles' },
                    { color: 'orange', children: 'Health checks & auto-restart' },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: isMobile ? 12 : 24 }}>
        <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Cloud Architecture</Title>
        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>AWS infrastructure, CI/CD pipeline, and Docker container architecture</Text>
      </div>
      <Tabs items={tabItems} size={isMobile ? 'middle' : 'large'} />
    </motion.div>
  )
}
