<template>
  <section class="resource-page">
    <h1>Doctors</h1>

    <form class="resource-form" @submit.prevent="submitDoctor">
      <label>
        Name
        <input type="text" v-model="form.name" placeholder="Enter doctor name" required />
      </label>

      <label>
        Email
        <input type="email" v-model="form.email" placeholder="Enter doctor email" required />
      </label>

      <label>
        Password
        <input
          type="password"
          v-model="form.password"
          :placeholder="editing ? 'Leave blank to keep current password' : 'Enter password'"
          :required="!editing"
        />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Doctor' : 'Create Doctor' }}
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

    <div v-if="loading" class="status">Loading doctors...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="doctors.length > 0" class="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doctor in doctors" :key="doctor.id">
          <td>{{ doctor.name }}</td>
          <td>{{ doctor.email }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(doctor)">Edit</button>
            <button type="button" class="button-danger" @click="deleteDoctor(doctor)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No doctors found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  name: 'Doctors',
  data() {
    return {
      doctors: [],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        name: '',
        email: '',
        password: '',
      },
    }
  },
  async mounted() {
    await this.fetchDoctors()
  },
  methods: {
    async fetchDoctors() {
      this.loading = true
      this.error = null
      this.success = null

      try {
        const response = await api.get('/doctors')
        this.doctors = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to load doctors. Please try again.')
      } finally {
        this.loading = false
      }
    },
    async submitDoctor() {
      if (
        !this.form.name.trim() ||
        !this.form.email.trim() ||
        (!this.editing && !this.form.password)
      ) {
        this.error = 'Name, email, and password are required.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null
      this.validationErrors = []

      const payload = {
        name: this.form.name,
        email: this.form.email,
      }

      if (this.form.password) {
        payload.password = this.form.password
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/doctors/${this.form.id}`, payload)
          this.success = 'Doctor updated successfully.'
        } else {
          await api.post('/doctors', payload)
          this.success = 'Doctor created successfully.'
        }

        this.resetForm()
        await this.fetchDoctors()
      } catch (err) {
        console.error(err)
        this.handleApiError(
          err,
          `Unable to ${this.editing ? 'update' : 'create'} doctor. Please try again.`,
        )
      } finally {
        this.loading = false
      }
    },
    startEdit(doctor) {
      this.editing = true
      this.form.id = doctor.id
      this.form.name = doctor.name || ''
      this.form.email = doctor.email || ''
      this.form.password = ''
      this.error = null
      this.success = null
      this.validationErrors = []
    },
    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
      this.validationErrors = []
    },
    async deleteDoctor(doctor) {
      const confirmed = window.confirm(`Delete doctor "${doctor.name}"?`)
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null
      this.validationErrors = []

      try {
        await api.delete(`/doctors/${doctor.id}`)
        this.success = 'Doctor deleted successfully.'
        await this.fetchDoctors()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete doctor. Please try again.')
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
      this.form.email = ''
      this.form.password = ''
      this.validationErrors = []
    },
  },
}
</script>

<style scoped>
.resource-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: #f5f2e9;
}

.resource-page h1 {
  margin-bottom: 1.5rem;
}

.resource-form {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  margin-bottom: 2rem;
}

.resource-form label {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
}

.resource-form input {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f2e9;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-end;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 1.25rem;
  overflow: hidden;
}

.resource-table th,
.resource-table td {
  padding: 1rem 1.15rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.resource-table th {
  background: rgba(255, 255, 255, 0.1);
}

.actions-cell {
  display: flex;
  gap: 0.85rem;
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: #08101b;
  background: rgba(255, 215, 103, 0.95);
  transition: transform 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

.button-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #f5f2e9;
}

.button-danger {
  background: rgba(245, 103, 103, 0.95);
  color: #fff;
}

.status {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f2e9;
}

.status.error {
  background: rgba(245, 103, 103, 0.16);
}

.status.success {
  background: rgba(118, 221, 138, 0.16);
}

.validation-errors {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
}

.validation-errors li {
  margin-bottom: 0.35rem;
}
</style>
