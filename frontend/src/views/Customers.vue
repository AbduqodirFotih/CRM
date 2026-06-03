<template>
  <div class="customers">
    <div class="page-header">
      <h2 class="page-title">Customers</h2>
      <button class="btn btn-primary" @click="showModal = true">+ Add Customer</button>
    </div>

    <div class="filters">
      <input v-model="search" class="input" placeholder="Search customers..." style="max-width: 300px;" @input="fetchCustomers" />
      <select v-model="statusFilter" class="select" @change="fetchCustomers">
        <option value="">All Status</option>
        <option value="lead">Lead</option>
        <option value="active">Active</option>
        <option value="churned">Churned</option>
      </select>
    </div>

    <div class="table-wrapper card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.id">
            <td class="name-cell">{{ c.name }}</td>
            <td>{{ c.email || '—' }}</td>
            <td>{{ c.company || '—' }}</td>
            <td>
              <span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span>
            </td>
            <td>
              <button class="btn btn-outline btn-sm" @click="editCustomer(c)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteCustomer(c.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <h3>{{ editing ? 'Edit Customer' : 'Add Customer' }}</h3>
        <form @submit.prevent="saveCustomer">
          <div class="form-group"><label>Name</label><input v-model="form.name" class="input" required /></div>
          <div class="form-group"><label>Email</label><input v-model="form.email" class="input" type="email" /></div>
          <div class="form-group"><label>Phone</label><input v-model="form.phone" class="input" /></div>
          <div class="form-group"><label>Company</label><input v-model="form.company" class="input" /></div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status" class="select">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div class="form-group"><label>Notes</label><textarea v-model="form.notes" class="input" rows="3"></textarea></div>
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

const customers = ref([])
const search = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const editing = ref(null)
const form = ref({ name: '', email: '', phone: '', company: '', status: 'lead', notes: '' })

function statusBadge(status) {
  return { 'badge-blue': status === 'lead', 'badge-green': status === 'active', 'badge-red': status === 'churned' }
}

async function fetchCustomers() {
  const params = {}
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  const { data } = await api.get('/api/customers', { params })
  customers.value = data
}

function editCustomer(c) {
  editing.value = c.id
  form.value = { name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status, notes: c.notes || '' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  form.value = { name: '', email: '', phone: '', company: '', status: 'lead', notes: '' }
}

async function saveCustomer() {
  if (editing.value) {
    await api.put(`/api/customers/${editing.value}`, form.value)
  } else {
    await api.post('/api/customers', form.value)
  }
  closeModal()
  fetchCustomers()
}

async function deleteCustomer(id) {
  if (confirm('Delete this customer?')) {
    await api.delete(`/api/customers/${id}`)
    fetchCustomers()
  }
}

onMounted(fetchCustomers)
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

.table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 0.875rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
}

.data-table th {
  background: var(--background);
  font-weight: 600;
  color: var(--muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td button + button {
  margin-left: 0.5rem;
}

.name-cell {
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 1.5rem;
}

.modal .form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.modal .form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
