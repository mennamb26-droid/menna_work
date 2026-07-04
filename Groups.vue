<template>
  <section class="resource-page">
    <h1>Groups</h1>

    <form class="resource-form" @submit.prevent="submitGroup">
      <label>
        Name
        <input type="text" v-model="form.name" placeholder="Enter group name" required />
      </label>

      <label>
        Department ID
        <input
          type="number"
          v-model.number="form.department_id"
          placeholder="Optional department ID"
        />
      </label>

      <label>
        Level ID
        <input type="number" v-model.number="form.level_id" placeholder="Optional level ID" />
      </label>

      <label>
        Students Count
        <input
          type="number"
          v-model.number="form.students_count"
          placeholder="Enter student count"
          required
          min="0"
        />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Group' : 'Create Group' }}
        </button>
        <button
          type="button"
          class="button-secondary"
          v-if="editing"
          @click="cancelEdit"
          :disabled="loading"
        >
          Cancel
        </button>
      </div>
    </form>

    <div v-if="loading" class="status">Loading groups...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="groups.length > 0" class="resource-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in groups" :key="item.id || index">
          <td v-for="header in headers" :key="header">{{ formatCell(item[header]) }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(item)">Edit</button>
            <button type="button" class="button-danger" @click="deleteGroup(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No groups found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      groups: [],
      headers: [],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        name: '',
        department_id: null,
        level_id: null,
        students_count: null,
      },
    }
  },

  async mounted() {
    await this.fetchGroups()
  },

  methods: {
    async fetchGroups() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/groups')
        this.groups = Array.isArray(response.data) ? response.data : response.data.data || []

        if (this.groups.length > 0) {
          this.headers = Object.keys(this.groups[0])
        } else {
          this.headers = ['name', 'department_id', 'level_id', 'students_count']
        }
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to load groups. Please try again.')
      } finally {
        this.loading = false
      }
    },

    async submitGroup() {
      if (!this.form.name.trim()) {
        this.error = 'Group name is required.'
        return
      }

      if (this.form.students_count === null || this.form.students_count === '') {
        this.error = 'Students count is required.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      const payload = {
        name: this.form.name,
        department_id: this.form.department_id,
        level_id: this.form.level_id,
        students_count: this.form.students_count,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/groups/${this.form.id}`, payload)
          this.success = 'Group updated successfully.'
        } else {
          await api.post('/groups', payload)
          this.success = 'Group created successfully.'
        }

        this.resetForm()
        await this.fetchGroups()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save group. Please try again.')
      } finally {
        this.loading = false
      }
    },

    startEdit(group) {
      this.editing = true
      this.form.id = group.id
      this.form.name = group.name || ''
      this.form.department_id = group.department_id || null
      this.form.level_id = group.level_id || null
      this.form.students_count = group.students_count || null
      this.error = null
      this.success = null
    },

    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
    },

    async deleteGroup(group) {
      const confirmed = window.confirm(`Delete group "${group.name}"?`)
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.delete(`/groups/${group.id}`)
        this.success = 'Group deleted successfully.'
        await this.fetchGroups()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete group. Please try again.')
      } finally {
        this.loading = false
      }
    },

    handleApiError(error, fallbackMessage) {
      const { summary, errors } = parseApiError(error, fallbackMessage)
      this.error = summary
      this.validationErrors = errors
    },

    resetForm() {
      this.editing = false
      this.form.id = null
      this.form.name = ''
      this.form.department_id = null
      this.form.level_id = null
      this.form.students_count = null
      this.validationErrors = []
    },

    formatCell(value) {
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return value
    },
  },
}
</script>

<style scoped>
.resource-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem;
}

.resource-page h1 {
  margin-bottom: 1rem;
  font-size: 1.75rem;
}

.resource-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.resource-form label {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
}

.resource-form input {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.resource-form button {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.65rem;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.button-secondary {
  background: #e2e8f0;
  color: #1f2937;
}

.button-danger {
  background: #dc2626;
  color: white;
}

.resource-form button:disabled,
.resource-table button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  margin: 1rem 0;
  color: #333;
  font-weight: 500;
}

.status.error {
  color: #b91c1c;
}

.status.success {
  color: #166534;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.resource-table th,
.resource-table td {
  border: 1px solid #d1d5db;
  padding: 0.85rem 1rem;
  text-align: left;
}

.resource-table th {
  background: #f3f4f6;
  font-weight: 700;
}

.resource-table tr:nth-child(even) {
  background: #f9fafb;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.resource-table button {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0.55rem;
  cursor: pointer;
}

.resource-table button:hover {
  opacity: 0.9;
}
</style>
