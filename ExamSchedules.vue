<template>
  <section class="resource-page">
    <h1>Exam Schedules</h1>

    <form class="resource-form" @submit.prevent="submitExamSchedule">
      <label>
        Exam Type
        <select v-model="form.exam_type" required>
          <option disabled value="">Select exam type</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
        </select>
      </label>

      <label>
        Semester
        <select v-model="form.semester" required>
          <option disabled value="">Select semester</option>
          <option v-for="semester in semesterOptions" :key="semester" :value="semester">
            {{ semester }}
          </option>
        </select>
      </label>

      <label>
        Course
        <select v-model.number="form.course_id" required>
          <option disabled value="">Select a course</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name || course.code || course.id }}
          </option>
        </select>
      </label>

      <label>
        Group
        <select v-model.number="form.group_id" required>
          <option disabled value="">Select a group</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name || group.id }}
          </option>
        </select>
      </label>

      <label>
        Room
        <select v-model.number="form.room_id">
          <option value="">Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.name || room.id }}
          </option>
        </select>
      </label>

      <label>
        Doctor
        <select v-model.number="form.doctor_id" required>
          <option disabled value="">Select a doctor</option>
          <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
            {{ doctor.name || doctor.email || doctor.id }}
          </option>
        </select>
      </label>

      <label>
        Day
        <select v-model="form.day" required>
          <option disabled value="">Select day</option>
          <option v-for="day in dayOptions" :key="day" :value="day">
            {{ day }}
          </option>
        </select>
      </label>

      <label>
        Date
        <input type="date" v-model="form.exam_date" required />
      </label>

      <label>
        Start Time
        <input type="time" v-model="form.start_time" required />
      </label>

      <label>
        End Time
        <input type="time" v-model="form.end_time" required />
      </label>

      <label>
        Place Name
        <input type="text" v-model="form.place_name" placeholder="Optional place name" />
      </label>

      <label>
        Note
        <input type="text" v-model="form.note" placeholder="Optional note" />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="saving">
          {{ editing ? 'Update Exam Schedule' : 'Create Exam Schedule' }}
        </button>
        <button
          type="button"
          class="button-secondary"
          v-if="editing"
          @click="resetForm"
          :disabled="saving"
        >
          Cancel
        </button>
      </div>

      <div v-if="error" class="status error">
        <p>{{ error }}</p>
        <ul v-if="validationErrors.length" class="validation-errors">
          <li v-for="message in validationErrors" :key="message">{{ message }}</li>
        </ul>
      </div>

      <div v-if="success" class="status success">{{ success }}</div>
    </form>

    <section class="tabs-panel">
      <button type="button" :class="{ active: activeTab === 'midterm' }" @click="activeTab = 'midterm'">
        Midterm Exams
      </button>
      <button type="button" :class="{ active: activeTab === 'final' }" @click="activeTab = 'final'">
        Final Exams
      </button>
    </section>

    <table v-if="filteredSchedules.length" class="resource-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Group</th>
          <th>Doctor</th>
          <th>Room / Place</th>
          <th>Semester</th>
          <th>Day</th>
          <th>Date</th>
          <th>Start</th>
          <th>End</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="schedule in filteredSchedules" :key="schedule.id">
          <td>{{ schedule.course?.name || schedule.course?.code || '—' }}</td>
          <td>{{ schedule.group?.name || '—' }}</td>
          <td>{{ schedule.doctor?.name || schedule.doctor?.email || '—' }}</td>
          <td>{{ schedule.room?.name || schedule.place_name || '—' }}</td>
          <td>{{ schedule.semester || '—' }}</td>
          <td>{{ schedule.day || '—' }}</td>
          <td>{{ schedule.exam_date || '—' }}</td>
          <td>{{ schedule.start_time || '—' }}</td>
          <td>{{ schedule.end_time || '—' }}</td>
          <td class="actions-cell">
            <button type="button" @click="editSchedule(schedule)">Edit</button>
            <button
              type="button"
              class="button-danger"
              @click="deleteSchedule(schedule)"
              :disabled="deletingId === schedule.id"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="status">
      No {{ activeTab === 'midterm' ? 'midterm' : 'final' }} exam schedules found.
    </div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      schedules: [],
      courses: [],
      groups: [],
      rooms: [],
      doctors: [],
      activeTab: 'midterm',
      form: this.resetFormData(),
      editing: false,
      loading: false,
      saving: false,
      deletingId: null,
      error: null,
      success: null,
      validationErrors: [],
      semesterOptions: ['First Semester', 'Second Semester', 'Summer Semester'],
      dayOptions: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }
  },

  computed: {
    filteredSchedules() {
      return this.schedules.filter((schedule) => schedule.exam_type === this.activeTab)
    },
  },

  mounted() {
    this.loadData()
  },

  methods: {
    resetFormData() {
      return {
        id: null,
        exam_type: '',
        semester: '',
        course_id: '',
        group_id: '',
        room_id: '',
        doctor_id: '',
        day: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        place_name: '',
        note: '',
      }
    },

    async loadData() {
      this.loading = true
      this.error = null
      this.success = null
      this.validationErrors = []

      try {
        const [scheduleRes, courseRes, groupRes, roomRes, doctorRes] = await Promise.all([
          api.get('/exam-schedules'),
          api.get('/courses'),
          api.get('/groups'),
          api.get('/rooms'),
          api.get('/doctors'),
        ])

        this.schedules = scheduleRes.data
        this.courses = courseRes.data
        this.groups = groupRes.data
        this.rooms = roomRes.data
        this.doctors = doctorRes.data
      } catch (error) {
        const parsed = parseApiError(error, 'Unable to load exam schedule context.')
        this.error = parsed.summary
        this.validationErrors = parsed.errors
      } finally {
        this.loading = false
      }
    },

    async submitExamSchedule() {
      this.saving = true
      this.error = null
      this.success = null
      this.validationErrors = []

      const payload = {
        exam_type: this.form.exam_type,
        semester: this.form.semester,
        course_id: this.form.course_id,
        group_id: this.form.group_id,
        room_id: this.form.room_id || null,
        doctor_id: this.form.doctor_id,
        day: this.form.day,
        exam_date: this.form.exam_date,
        start_time: this.form.start_time,
        end_time: this.form.end_time,
        place_name: this.form.place_name || null,
        note: this.form.note || null,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/exam-schedules/${this.form.id}`, payload)
          this.success = 'Exam schedule updated successfully.'
        } else {
          await api.post('/exam-schedules', payload)
          this.success = 'Exam schedule created successfully.'
        }

        await this.loadData()
        this.resetForm()
      } catch (error) {
        const parsed = parseApiError(error, 'Unable to save exam schedule.')
        this.error = parsed.summary
        this.validationErrors = parsed.errors
      } finally {
        this.saving = false
      }
    },

    editSchedule(schedule) {
      this.editing = true
      this.form = {
        id: schedule.id,
        exam_type: schedule.exam_type || '',
        semester: schedule.semester || '',
        course_id: schedule.course_id || '',
        group_id: schedule.group_id || '',
        room_id: schedule.room_id || '',
        doctor_id: schedule.doctor_id || '',
        day: schedule.day || '',
        exam_date: schedule.exam_date || '',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        place_name: schedule.place_name || '',
        note: schedule.note || '',
      }
      this.error = null
      this.success = null
      this.validationErrors = []
      this.activeTab = schedule.exam_type || 'midterm'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    async deleteSchedule(schedule) {
      const confirmed = window.confirm('Delete this exam schedule?')
      if (!confirmed) {
        return
      }

      this.deletingId = schedule.id
      this.error = null
      this.success = null
      this.validationErrors = []

      try {
        await api.delete(`/exam-schedules/${schedule.id}`)
        this.success = 'Exam schedule deleted successfully.'
        await this.loadData()
      } catch (error) {
        const parsed = parseApiError(error, 'Unable to delete exam schedule.')
        this.error = parsed.summary
        this.validationErrors = parsed.errors
      } finally {
        this.deletingId = null
      }
    },

    resetForm() {
      this.editing = false
      this.form = this.resetFormData()
      this.error = null
      this.success = null
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
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.resource-form input,
.resource-form select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 1rem;
}

.resource-form input:focus,
.resource-form select:focus {
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
  transition: transform 0.2s ease, opacity 0.2s ease;
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

.tabs-panel {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tabs-panel button {
  padding: 0.95rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.tabs-panel button.active {
  background: rgba(216, 171, 37, 0.18);
  border-color: rgba(216, 171, 37, 0.5);
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
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.resource-table button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.resource-table button.button-danger {
  background: #c33c1d;
}

.resource-table button.button-danger:hover:not(:disabled) {
  opacity: 0.95;
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
