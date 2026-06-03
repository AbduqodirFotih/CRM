<template>
  <div class="deals">
    <div class="page-header">
      <h2 class="page-title">Deals</h2>
      <button class="btn btn-primary" @click="showModal = true">+ Add Deal</button>
    </div>

    <div class="filters">
      <select v-model="stageFilter" class="select" @change="fetchDeals">
        <option value="">All Stages</option>
        <option value="new">New</option>
        <option value="qualified">Qualified</option>
        <option value="proposal">Proposal</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
    </div>

    <div class="table-wrapper card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Value</th>
            <th>Stage</th>
            <th>Customer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in deals" :key="d.id">
            <td class="name-cell">{{ d.title }}</td>
            <td>${{ Number(d.value).toLocaleString() }}</td>
            <td><span class="badge" :class="stageBadge(d.stage)">{{ d.stage }}</span></td>
            <td>{{ getCustomerName(d.customer_id) }}</td>
            <td>
              <button class="btn btn-outline btn-sm" @click="editDeal(d)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteDeal(d.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <h3>{{ editing ? 'Edit Deal' : 'Add Deal' }}</h3>
        <form @submit.prevent="saveDeal">
          <div class="form-group"><label>Title</label><input v-model="form.title" class="input" required /></div>
          <div class="form-group"><label>Value ($)</label><input v-model.number="form.value" class="input" type="number" step="0.01" /></div>
          <div class="form-group">
            <label>Stage</label>
            <select v-model="form.stage" class="select">
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div class="form-group">
            <label>Customer</label>
            <select v-model="form.customer_id" class="select" required>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Description</label><textarea v-model="form.description" class="input" rows="3"></textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editing ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const deals = ref([])
const customers = ref([])
const stageFilter = ref('')
const showModal = ref(false)
const editing = ref(null)
const form = ref({ title: '', value: 0, stage: 'new', customer_id: null, description: '' })

function stageBadge(stage) {
  return {
    'badge-blue': stage === 'new',
    'badge-amber': stage === 'qualified',
    'badge-gray': stage === 'proposal',
    'badge-green': stage === 'won',
    'badge-red': stage === 'lost'
  }
}

function getCustomerName(id) {
  const c = customers.value.find(c => c.id === id)
  return c ? c.name : '—'
}

async function fetchDeals() {
  const params = {}
  if (stageFilter.value) params.stage = stageFilter.value
  const { data } = await api.get('/api/deals', { params })
  deals.value = data
}

async function fetchCustomers() {
  const { data } = await api.get('/api/customers')
  customers.value = data
}

function editDeal(d) {
  editing.value = d.id
  form.value = { title: d.title, value: d.value, stage: d.stage, customer_id: d.customer_id, description: d.description || '' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = { title: '', value: 0, stage: 'new', customer_id: null, description: '' }
}

async function saveDeal() {
  if (editing.value) {
    await api.put(`/api/deals/${editing.value}`, form.value)
  } else {
    await api.post('/api/deals', form.value)
  }
  closeModal()
  fetchDeals()
}

async function deleteDeal(id) {
  if (confirm('Delete this deal?')) {
    await api.delete(`/api/deals/${id}`)
    fetchDeals()
  }
}

onMounted(() => {
  fetchDeals()
  fetchCustomers()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.table-wrapper { overflow-x: auto; padding: 0; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.875rem 1.25rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
.data-table th { background: var(--background); font-weight: 600; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.data-table td button + button { margin-left: 0.5rem; }
.name-cell { font-weight: 500; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin-bottom: 1.5rem; }
.modal .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.375rem; }
.modal .form-group label { font-size: 0.8125rem; font-weight: 500; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
</style>
