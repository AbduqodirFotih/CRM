<template>
  <div class="dashboard">
    <h2 class="page-title">Dashboard</h2>
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-label">Total Customers</div>
        <div class="stat-value">{{ stats.total_customers }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Active Customers</div>
        <div class="stat-value text-accent">{{ stats.active_customers }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Pipeline Value</div>
        <div class="stat-value">${{ formatNumber(stats.pipeline_value) }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Won Value</div>
        <div class="stat-value text-success">${{ formatNumber(stats.won_value) }}</div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="card chart-card">
        <h3>Deals by Stage</h3>
        <div class="chart-container">
          <Bar v-if="barData" :data="barData" :options="barOptions" />
        </div>
      </div>
      <div class="card chart-card">
        <h3>Customers by Status</h3>
        <div class="chart-container">
          <Doughnut v-if="doughnutData" :data="doughnutData" :options="doughnutOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import api from '../api'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const stats = ref({ total_customers: 0, active_customers: 0, pipeline_value: 0, won_value: 0, deals_by_stage: {}, customers_by_status: {} })
const barData = ref(null)
const doughnutData = ref(null)

const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }

function formatNumber(num) {
  return Number(num || 0).toLocaleString()
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/dashboard')
    stats.value = data
    barData.value = {
      labels: ['New', 'Qualified', 'Proposal', 'Won', 'Lost'],
      datasets: [{
        data: [data.deals_by_stage.new || 0, data.deals_by_stage.qualified || 0, data.deals_by_stage.proposal || 0, data.deals_by_stage.won || 0, data.deals_by_stage.lost || 0],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B', '#059669', '#DC2626']
      }]
    }
    doughnutData.value = {
      labels: ['Lead', 'Active', 'Churned'],
      datasets: [{
        data: [data.customers_by_status.lead || 0, data.customers_by_status.active || 0, data.customers_by_status.churned || 0],
        backgroundColor: ['#3B82F6', '#059669', '#DC2626']
      }]
    }
  } catch (e) {
    console.error('Failed to load dashboard', e)
  }
})
</script>

<style scoped>
.page-title {
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
}

.text-accent { color: var(--primary); }
.text-success { color: var(--accent); }

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.chart-card h3 {
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.chart-container {
  height: 250px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
