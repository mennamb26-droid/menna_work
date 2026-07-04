<template>
  <section class="resource-page">
    <h1>Levels</h1>

    <form class="resource-form" @submit.prevent="submitLevel">
      <label>
        Department ID
        <input
          type="number"
          v-model.number="form.department_id"
          placeholder="Optional department ID"
        />
      </label>

      <label>
        Name
        <input type="text" v-model="form.name" placeholder="Enter level name" required />
      </label>

      <label>
        Priority
        <input
          type="number"
          v-model.number="form.priority"
          placeholder="Enter level priority"
          min="1"
          required
        />
      </label>

      <label>
        Level Number
        <input
          type="number"
          v-model.number="form.number"
          placeholder="Optional level number"
          min="1"
        />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Level' : 'Create Level' }}
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

    <div v-if="loading" class="status">Loading levels...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="levels.length > 0" class="resource-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in levels" :key="item.id || index">
          <td v-for="header in headers" :key="header">{{ formatCell(item[header]) }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(item)">Edit</button>
            <button type="button" class="button-danger" @click="deleteLevel(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No levels found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      levels: [],
      headers: [],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        department_id: null,
        name: '',
        priority: 1,
        number: null,
      },
    }
  },

  async mounted() {
    await this.fetchLevels()
  },

  methods: {
    async fetchLevels() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/levels')
        this.levels = Array.isArray(response.data) ? response.data : response.data.data || []

        if (this.levels.length > 0) {
          this.headers = Object.keys(this.levels[0])
        } else {
          this.headers = ['department_id', 'name', 'priority', 'number']
        }
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to load levels. Please try again.')
      } finally {
        this.loading = false
      }
    },

    async submitLevel() {
      if (!this.form.name.trim()) {
        this.error = 'Level name is required.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        const payload = {
          department_id: this.form.department_id,
          name: this.form.name,
          priority: this.form.priority,
          number: this.form.number,
        }

        if (this.editing && this.form.id) {
          await api.put(`/levels/${this.form.id}`, payload)
          this.success = 'Level updated successfully.'
        } else {
          await api.post('/levels', payload)
          this.success = 'Level created successfully.'
        }

        this.resetForm()
        await this.fetchLevels()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save level. Please try again.')
      } finally {
        this.loading = false
      }
    },

    startEdit(level) {
      this.editing = true
      this.form.id = level.id
      this.form.department_id = level.department_id || null
      this.form.name = level.name || ''
      this.form.priority = level.priority ?? 1
      this.form.number = level.number || null
      this.error = null
      this.success = null
    },

    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
    },

    async deleteLevel(level) {
      const confirmed = window.confirm(`Delete level "${level.name}"?`)
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.delete(`/levels/${level.id}`)
        this.success = 'Level deleted successfully.'
        await this.fetchLevels()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete level. Please try again.')
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
      this.form.department_id = null
      this.form.name = ''
      this.form.priority = 1
      this.form.number = null
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
  padding: 1.5rem;
}

.resource-page h1 {
  margin-bottom: 1rem;
  font-size: clamp(2rem, 2.2vw, 2.5rem);
  color: var(--text);
}

.resource-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
}

.resource-form label {
  display: grid;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 600;
}

.resource-form input {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 1rem;
}

.resource-form input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 4px rgba(216, 171, 37, 0.14);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.resource-form button {
  padding: 0.9rem 1.25rem;
  border: none;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, var(--accent), #f1c56c);
  color: #08101b;
  cursor: pointer;
  font-weight: 700;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.resource-form button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.button-danger {
  background: #d15b20;
  color: white;
}

.resource-form button:disabled,
.resource-table button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.status {
  margin: 1rem 0;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.status.error {
  background: rgba(249, 115, 22, 0.16);
  border-color: rgba(249, 115, 22, 0.35);
  color: #fee2e2;
}

.status.success {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.35);
  color: #d1fae5;
}

.validation-errors {
  margin: 0.75rem 0 0;
  padding-left: 1.15rem;
  color: #fee2e2;
}

.validation-errors li {
  margin-bottom: 0.35rem;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
}

.resource-table th,
.resource-table td {
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.95rem 1rem;
  text-align: left;
}

.resource-table th {
  background: rgba(255, 255, 255, 0.06);
  color: #f3e2a7;
  font-weight: 700;
}

.resource-table td {
  color: rgba(255, 255, 255, 0.9);
}

.resource-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.resource-table tr:hover {
  background: rgba(216, 171, 37, 0.08);
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resource-table button {
  padding: 0.55rem 0.85rem;
  border: none;
  border-radius: 0.85rem;
  cursor: pointer;
  color: var(--text);
  background: rgba(255, 255, 255, 0.08);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.resource-table button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.resource-table button.button-danger {
  background: #c33c1d;
}

@media (max-width: 640px) {
  .resource-page {
    padding: 1rem;
  }

  .resource-form {
    padding: 1rem;
  }
}
</style>
