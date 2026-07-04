<template>
  <section class="resource-page">
    <h1>Time Slots</h1>

    <form class="resource-form" @submit.prevent="submitTimeSlot">
      <label>
        Day
        <select v-model="form.day" required>
          <option disabled value="">Select a day</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
      </label>

      <label>
        Start Time
        <input type="time" v-model="form.start_time" required />
      </label>

      <label>
        End Time
        <input type="time" v-model="form.end_time" required />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Time Slot' : 'Create Time Slot' }}
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

    <div v-if="loading" class="status">Loading time slots...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="timeSlots.length > 0" class="resource-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Day</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in timeSlots" :key="item.id || index">
          <td>{{ item.id }}</td>
          <td>{{ item.day }}</td>
          <td>{{ item.start_time }}</td>
          <td>{{ item.end_time }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(item)">Edit</button>
            <button type="button" class="button-danger" @click="deleteTimeSlot(item)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No time slots found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      timeSlots: [],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        day: '',
        start_time: '',
        end_time: '',
      },
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }
  },

  async mounted() {
    await this.fetchTimeSlots()
  },

  methods: {
    async fetchTimeSlots() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/time-slots')
        this.timeSlots = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to load time slots. Please try again.')
      } finally {
        this.loading = false
      }
    },

    async submitTimeSlot() {
      if (!this.form.day) {
        this.error = 'Day is required.'
        return
      }
      if (!this.form.start_time || !this.form.end_time) {
        this.error = 'Start time and end time are required.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      const payload = {
        day: this.form.day,
        start_time: this.form.start_time,
        end_time: this.form.end_time,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/time-slots/${this.form.id}`, payload)
          this.success = 'Time slot updated successfully.'
        } else {
          await api.post('/time-slots', payload)
          this.success = 'Time slot created successfully.'
        }

        this.resetForm()
        await this.fetchTimeSlots()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save time slot. Please try again.')
      } finally {
        this.loading = false
      }
    },

    startEdit(timeSlot) {
      this.editing = true
      this.form.id = timeSlot.id
      this.form.day = timeSlot.day || ''
      this.form.start_time = timeSlot.start_time || ''
      this.form.end_time = timeSlot.end_time || ''
      this.error = null
      this.success = null
    },

    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
    },

    async deleteTimeSlot(timeSlot) {
      const confirmed = window.confirm(
        `Delete time slot ${timeSlot.day} ${timeSlot.start_time} - ${timeSlot.end_time}?`,
      )
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.delete(`/time-slots/${timeSlot.id}`)
        this.success = 'Time slot deleted successfully.'
        await this.fetchTimeSlots()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete time slot. Please try again.')
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
      this.form.day = ''
      this.form.start_time = ''
      this.form.end_time = ''
      this.validationErrors = []
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
</style>
