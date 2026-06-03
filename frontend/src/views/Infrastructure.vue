<template>
  <div class="infrastructure">
    <h2 class="page-title">Infrastructure</h2>

    <!-- Network Topology -->
    <div class="card topology-card">
      <h3>Network Topology</h3>
      <div ref="networkContainer" class="network-graph"></div>
    </div>

    <div class="infra-grid">
      <!-- Scaling Controls -->
      <div class="card">
        <h3>Scaling Controls</h3>
        <div class="scale-controls">
          <div class="scale-buttons">
            <button class="btn btn-outline btn-sm" @click="scaleDown" :disabled="runningCount <= 1">−</button>
            <span class="instance-count">{{ runningCount }}</span>
            <button class="btn btn-outline btn-sm" @click="scaleUp" :disabled="runningCount >= 6">+</button>
          </div>
          <div class="quick-set">
            <button v-for="n in 6" :key="n" class="btn btn-sm" :class="runningCount === n ? 'btn-primary' : 'btn-outline'" @click="scaleTo(n)">{{ n }}</button>
          </div>
        </div>
        <div class="autoscaler-section">
          <div class="autoscaler-toggle">
            <span>Autoscaler</span>
            <div class="toggle" :class="{ active: autoscalerEnabled }" @click="toggleAutoscaler"></div>
          </div>
          <div class="autoscaler-info" v-if="controlStatus">
            <div><strong>RPS:</strong> {{ controlStatus.last_rps?.toFixed(1) || '0.0' }}</div>
            <div><strong>Cooldown:</strong> {{ controlStatus.cooldown_remaining?.toFixed(0) || '0' }}s</div>
            <div v-if="controlStatus.last_scale_reason"><strong>Last:</strong> {{ controlStatus.last_scale_reason }}</div>
          </div>
        </div>
      </div>

      <!-- Load Test -->
      <div class="card">
        <h3>Load Test</h3>
        <button class="btn btn-success" @click="startLoadTest" :disabled="loadTesting">
          {{ loadTesting ? 'Testing...' : 'Start Load Test' }}
        </button>
        <div class="load-results" v-if="loadResults.length">
          <div v-for="r in loadResults" :key="r.instance_id" class="load-bar-row">
            <span class="load-label">{{ r.instance_id.substring(0, 12) }}</span>
            <div class="load-bar">
              <div class="load-bar-fill" :style="{ width: r.percent + '%' }"></div>
            </div>
            <span class="load-percent">{{ r.percent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Instances Table -->
    <div class="card instances-card">
      <h3>Backend Instances</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Instance ID</th>
            <th>Zone</th>
            <th>Status</th>
            <th>Requests</th>
            <th>Last Seen</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inst in instances" :key="inst.instance_id">
            <td class="mono">{{ inst.instance_id.substring(0, 12) }}</td>
            <td>{{ inst.zone }}</td>
            <td>
              <span class="badge" :class="inst.status === 'healthy' ? 'badge-green' : inst.status === 'draining' ? 'badge-amber' : 'badge-red'">
                {{ inst.status }}
              </span>
            </td>
            <td class="mono">{{ inst.request_count }}</td>
            <td>{{ formatTime(inst.last_seen) }}</td>
            <td>
              <button class="btn btn-outline btn-sm" @click="drainInstance(inst.instance_id)">Drain</button>
              <button class="btn btn-danger btn-sm" @click="deregisterInstance(inst.instance_id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import api from '../api'

const networkContainer = ref(null)
const instances = ref([])
const controlStatus = ref(null)
const autoscalerEnabled = ref(false)
const runningCount = ref(0)
const loadTesting = ref(false)
const loadResults = ref([])

let network = null
let pollInterval = null

// Network topology
const nodes = new DataSet()
const edges = new DataSet()

function buildTopology() {
  nodes.clear()
  edges.clear()

  // Fixed nodes
  nodes.add({ id: 'gateway', label: 'Internet\nGateway', shape: 'box', color: { background: '#dbeafe', border: '#2563EB' }, font: { size: 11 } })
  nodes.add({ id: 'nginx', label: 'Nginx LB', shape: 'box', color: { background: '#dcfce7', border: '#059669' }, font: { size: 11 } })
  nodes.add({ id: 'db', label: 'PostgreSQL', shape: 'database', color: { background: '#fef3c7', border: '#d97706' }, font: { size: 11 } })

  edges.add({ from: 'gateway', to: 'nginx', arrows: 'to', color: { color: '#94a3b8' } })

  // API instances
  instances.value.forEach((inst, i) => {
    const nodeId = `api-${inst.instance_id}`
    const color = inst.status === 'healthy' ? { background: '#dcfce7', border: '#059669' } : inst.status === 'draining' ? { background: '#fef3c7', border: '#d97706' } : { background: '#fce4ec', border: '#DC2626' }
    nodes.add({ id: nodeId, label: `API\n${inst.instance_id.substring(0, 8)}`, shape: 'box', color, font: { size: 10 } })
    edges.add({ from: 'nginx', to: nodeId, arrows: 'to', color: { color: '#94a3b8' } })
    edges.add({ from: nodeId, to: 'db', arrows: 'to', color: { color: '#94a3b8' }, dashes: true })
  })
}

function initNetwork() {
  if (!networkContainer.value) return
  buildTopology()
  const options = {
    layout: { hierarchical: { direction: 'LR', sortMethod: 'directed', levelSeparation: 180, nodeSpacing: 80 } },
    physics: false,
    interaction: { dragNodes: false, zoomView: false },
    edges: { smooth: { type: 'cubicBezier' } }
  }
  network = new Network(networkContainer.value, { nodes, edges }, options)
}

async function fetchInstances() {
  try {
    const { data } = await api.get('/api/infra/instances')
    instances.value = data
    runningCount.value = data.filter(i => i.status === 'healthy' || i.status === 'draining').length
    buildTopology()
    if (network) network.setData({ nodes, edges })
  } catch (e) {
    console.error('Failed to fetch instances', e)
  }
}

async function fetchControlStatus() {
  try {
    const { data } = await api.get('/api/control/status')
    controlStatus.value = data
    autoscalerEnabled.value = data.autoscaler_enabled
    runningCount.value = data.running_instances
  } catch (e) {
    console.error('Failed to fetch control status', e)
  }
}

async function scaleTo(n) {
  await api.post('/api/control/scale', { count: n })
  setTimeout(() => { fetchInstances(); fetchControlStatus() }, 2000)
}

function scaleUp() { scaleTo(runningCount.value + 1) }
function scaleDown() { scaleTo(runningCount.value - 1) }

async function toggleAutoscaler() {
  const newState = !autoscalerEnabled.value
  await api.post('/api/control/autoscaler', { enabled: newState })
  autoscalerEnabled.value = newState
}

async function drainInstance(id) {
  await api.post(`/api/control/drain/${id}`)
  fetchInstances()
}

async function deregisterInstance(id) {
  if (confirm('Remove this instance?')) {
    await api.delete(`/api/control/instance/${id}`)
    setTimeout(() => { fetchInstances(); fetchControlStatus() }, 1500)
  }
}

async function startLoadTest() {
  loadTesting.value = true
  loadResults.value = []

  // Send 50 parallel requests
  const promises = Array.from({ length: 50 }, () => api.get('/api/health'))
  const results = await Promise.allSettled(promises)

  // Count responses per instance
  const counts = {}
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.data?.instance_id) {
      const id = r.value.data.instance_id
      counts[id] = (counts[id] || 0) + 1
    }
  })

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  loadResults.value = Object.entries(counts).map(([instance_id, count]) => ({
    instance_id,
    count,
    percent: Math.round((count / total) * 100)
  }))

  loadTesting.value = false
  fetchInstances()
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString()
}

onMounted(async () => {
  await fetchInstances()
  await fetchControlStatus()
  await nextTick()
  initNetwork()
  pollInterval = setInterval(() => {
    fetchInstances()
    fetchControlStatus()
  }, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (network) network.destroy()
})
</script>

<style scoped>
.page-title {
  margin-bottom: 1.5rem;
}

.topology-card {
  margin-bottom: 1.5rem;
}

.topology-card h3 {
  margin-bottom: 1rem;
}

.network-graph {
  height: 280px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.infra-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.infra-grid h3 {
  margin-bottom: 1rem;
}

.scale-controls {
  margin-bottom: 1.5rem;
}

.scale-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.instance-count {
  font-family: 'Fira Code', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.quick-set {
  display: flex;
  gap: 0.5rem;
}

.autoscaler-section {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.autoscaler-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.autoscaler-toggle span {
  font-weight: 500;
}

.autoscaler-info {
  font-size: 0.8125rem;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.load-results {
  margin-top: 1rem;
}

.load-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.load-label {
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  width: 100px;
}

.load-bar {
  flex: 1;
  height: 20px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.load-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 300ms ease;
}

.load-percent {
  font-family: 'Fira Code', monospace;
  font-size: 0.8125rem;
  width: 40px;
  text-align: right;
}

.instances-card h3 {
  margin-bottom: 1rem;
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.8125rem; }
.data-table th { background: var(--background); font-weight: 600; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.data-table td button + button { margin-left: 0.5rem; }
.mono { font-family: 'Fira Code', monospace; }

@media (max-width: 768px) {
  .infra-grid { grid-template-columns: 1fr; }
}
</style>
