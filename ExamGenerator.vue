<template>
  <section class="resource-page">
    <h1>Exam Generator</h1>

    <form class="resource-form" @submit.prevent="generateExamSchedules">
      <label>
        Exam Type
        <select v-model="form.exam_type" required>
          <option disabled value="">Select exam type</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
        </select>
      </label>

      <label>
        Regulation
        <select v-model="form.regulation_id" required>
          <option disabled value="">Select regulation</option>
          <option v-for="regulation in regulations" :key="regulation.id" :value="regulation.id">
            {{ regulation.label || regulation.value || regulation.name }}
          </option>
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
        Start Date
        <input type="date" v-model="form.start_date" required />
      </label>

      <label>
        End Date
        <input type="date" v-model="form.end_date" required />
      </label>

      <label>
        Time Slots
        <textarea
          v-model="form.time_slots_text"
          rows="5"
          placeholder="08:00-10:00\n10:30-12:30\n14:00-16:00"
          required
        ></textarea>
        <small>Enter one slot per line in H:mm-H:mm format.</small>
      </label>

      <div class="checkbox-row">
        <label>
          <input type="checkbox" v-model="form.include_written" />
          Include Written Exams
        </label>
        <label>
          <input type="checkbox" v-model="form.include_practical" />
          Include Practical Exams
        </label>
        <label>
          <input type="checkbox" v-model="form.include_graduation_requirements" />
          Include Graduation Requirements
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate Exam Schedules' }}
        </button>
      </div>

      <div v-if="error" class="status error">
        <p>{{ error }}</p>
      </div>

      <div v-if="validationErrors.length" class="status error">
        <ul class="validation-errors">
          <li v-for="message in validationErrors" :key="message">{{ message }}</li>
        </ul>
      </div>
    </form>

    <section v-if="generatedSchedules.length" class="generated-panel">
      <div class="tabs-panel">
        <button
          type="button"
          :class="{ active: activeTab === 'written' }"
          @click="activeTab = 'written'"
        >
          Written Exams
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'practical' }"
          @click="activeTab = 'practical'"
        >
          Practical Exams
        </button>
      </div>

      <h2>{{ activeTabLabel }}</h2>

      <table class="resource-table" v-if="activeSchedules.length">
        <thead>
          <tr>
            <th>Course</th>
            <th>Department</th>
            <th>Level</th>
            <th>Date</th>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>{{ activeTab === 'written' ? 'Rooms' : 'Lab' }}</th>
            <th v-if="activeTab === 'practical'">Batch</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in activeSchedules" :key="schedule.id">
            <td>
              {{ schedule.course?.name || schedule.course?.code || schedule.course_id || '—' }}
            </td>
            <td>{{ schedule.department?.name || schedule.department_id || '—' }}</td>
            <td>{{ schedule.level?.name || schedule.level_id || '—' }}</td>
            <td>{{ schedule.exam_date || '—' }}</td>
            <td>{{ schedule.day || '—' }}</td>
            <td>{{ schedule.start_time || '—' }}</td>
            <td>{{ schedule.end_time || '—' }}</td>
            <td>
              <template v-if="activeTab === 'written'">
                {{ formatRooms(schedule.room_assignments) }}
              </template>
              <template v-else>
                {{ formatRooms(schedule.room_assignments) }}
              </template>
            </td>
            <td v-if="activeTab === 'practical'">
              {{ schedule.batch_no || '—' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="status">No {{ activeTabLabel.toLowerCase() }} found for this session.</div>
    </section>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'ExamGenerator',
  data() {
    return {
      form: {
        exam_type: '',
        regulation_id: '',
        semester: '',
        start_date: '',
        end_date: '',
        time_slots_text: '08:00-10:00\n10:30-12:30\n14:00-16:00',
        include_written: true,
        include_practical: false,
      },
      semesterOptions: ['First Semester', 'Second Semester', 'Summer Semester'],
      loading: false,
      error: null,
      validationErrors: [],
      generatedSchedules: [],
      activeTab: 'written',
      regulations: [],
    }
  },
  created() {
    this.fetchRegulations()
  },
  computed: {
    activeTabLabel() {
      return this.activeTab === 'written' ? 'Written Exams' : 'Practical Exams'
    },
    writtenSchedules() {
      return this.generatedSchedules.filter((schedule) => schedule.exam_mode === 'written')
    },
    practicalSchedules() {
      return this.generatedSchedules.filter((schedule) => schedule.exam_mode === 'practical')
    },
    activeSchedules() {
      return this.activeTab === 'written' ? this.writtenSchedules : this.practicalSchedules
    },
  },
  methods: {
    async fetchRegulations() {
      try {
        const response = await api.get('/regulations')
        this.regulations = response.data || []
      } catch (error) {
        console.error('Failed to load regulations:', error)
      }
    },
    parseTimeSlots() {
      const lines = this.form.time_slots_text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const slots = []
      const errors = []

      lines.forEach((line, index) => {
        const parts = line.split('-').map((part) => part.trim())
        if (parts.length !== 2) {
          errors.push(`Time slot line ${index + 1} must be in H:mm-H:mm format.`)
          return
        }

        const [start_time, end_time] = parts
        const timeRegex = /^\d{2}:\d{2}$/

        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
          errors.push(`Time slot line ${index + 1} must use HH:mm format.`)
          return
        }

        if (end_time <= start_time) {
          errors.push(`In line ${index + 1}, end time must come after start time.`)
          return
        }

        slots.push({ start_time, end_time })
      })

      return { slots, errors }
    },
    formatRooms(assignments) {
      if (!assignments || !assignments.length) {
        return '—'
      }

      return assignments
        .map((assignment) => assignment.room?.name || assignment.room_id || 'Unknown')
        .join(', ')
    },
    async generateExamSchedules() {
      this.error = null
      this.validationErrors = []
      this.generatedSchedules = []
      this.loading = true

      const { slots, errors } = this.parseTimeSlots()
      if (errors.length) {
        this.validationErrors = errors
        this.loading = false
        return
      }

      if (!this.form.include_written && !this.form.include_practical) {
        this.validationErrors = ['Select at least one exam type to generate.']
        this.loading = false
        return
      }

      try {
        const payload = {
          name: `${this.form.exam_type.charAt(0).toUpperCase() + this.form.exam_type.slice(1)} Exam Session`,
          exam_type: this.form.exam_type,
          regulation_id: this.form.regulation_id || null,
          semester: this.form.semester,
          start_date: this.form.start_date,
          end_date: this.form.end_date,
          time_slots: slots,
          include_written: this.form.include_written,
          include_practical: this.form.include_practical,
          include_graduation_requirements: this.form.include_graduation_requirements,
        }

        const response = await api.post('/exam-sessions/generate', payload)
        const schedules = response.data.exam_schedules || response.data.examSchedules || []
        this.generatedSchedules = schedules
        this.activeTab = this.form.include_written ? 'written' : 'practical'
      } catch (error) {
        if (error.response && error.response.data) {
          const responseData = error.response.data
          if (responseData.errors) {
            this.validationErrors = Object.values(responseData.errors).flat()
          } else if (responseData.message) {
            this.error = responseData.message
          } else {
            this.error = 'Failed to generate exam schedules.'
          }
        } else {
          this.error = 'Failed to connect to the server.'
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.resource-page {
  display: grid;
  gap: 1.5rem;
}

.resource-form {
  display: grid;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
}

.resource-form label {
  display: grid;
  gap: 0.5rem;
  color: #f0f0f0;
}

.resource-form input,
.resource-form select,
.resource-form textarea {
  width: 100%;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f5f5;
  padding: 0.9rem 1rem;
}

.resource-form textarea {
  resize: vertical;
  min-height: 110px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.resource-form button {
  padding: 0.95rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: #ffd767;
  color: #07111c;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.resource-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.checkbox-row {
  display: grid;
  gap: 0.75rem;
}

.tabs-panel {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tabs-panel button {
  padding: 0.85rem 1.25rem;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f5;
  cursor: pointer;
}

.tabs-panel button.active {
  background: #ffd767;
  color: #07111c;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.04);
}

.resource-table th,
.resource-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  color: #f5f5f5;
}

.resource-table th {
  background: rgba(255, 255, 255, 0.08);
}

.status {
  padding: 1rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f5;
}

.status.error {
  background: rgba(255, 72, 66, 0.16);
  color: #ffb3ac;
}

.validation-errors {
  margin: 0.75rem 0 0;
  padding-left: 1.2rem;
}

.validation-errors li {
  margin-bottom: 0.25rem;
}
</style>
