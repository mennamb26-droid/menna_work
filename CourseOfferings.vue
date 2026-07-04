<template>
  <section class="resource-page">
    <h1>Course Offerings</h1>

    <div class="resource-actions">
      <button type="button" @click="evaluateOfferings" :disabled="loading">
        Evaluate Electives
      </button>
    </div>

    <form class="resource-form" @submit.prevent="submitOffering">
      <label>
        Regulation
        <select v-model.number="form.regulation_id">
          <option :value="null">No regulation</option>
          <option v-for="regulation in regulations" :key="regulation.id" :value="regulation.id">
            {{ regulation.name }}{{ regulation.year ? ' (' + regulation.year + ')' : '' }}
          </option>
        </select>
      </label>

      <label>
        Semester
        <select v-model="form.semester" required>
          <option disabled value="">Select semester</option>
          <option value="First Semester">First Semester</option>
          <option value="Second Semester">Second Semester</option>
          <option value="Summer Semester">Summer Semester</option>
        </select>
      </label>

      <label>
        Academic Year
        <input type="text" v-model="form.academic_year" placeholder="Enter academic year" />
      </label>

      <label>
        Course
        <select v-model.number="form.course_id" required>
          <option disabled value="">Select course</option>
          <option v-for="course in electiveCourses" :key="course.id" :value="course.id">
            {{ course.name }} ({{ course.code }})
          </option>
        </select>
      </label>

      <label>
        Opening Rule
        <select v-model="form.opening_rule" required>
          <option value="manual">Manual</option>
          <option value="by_enrollment">By Enrollment</option>
        </select>
      </label>

      <label>
        Minimum Students
        <input type="number" min="0" v-model.number="form.min_students" />
      </label>

      <label>
        Status
        <select v-model="form.status" required>
          <option value="pending">Pending</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </label>

      <label>
        Note
        <textarea v-model="form.note" placeholder="Optional note"></textarea>
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Offering' : 'Create Offering' }}
        </button>
        <button type="button" class="button-secondary" v-if="editing" @click="cancelEdit" :disabled="loading">
          Cancel
        </button>
      </div>
    </form>

    <div v-if="loading" class="status">Loading course offerings...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="offerings.length > 0" class="resource-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Course Type</th>
          <th>Semester</th>
          <th>Opening Rule</th>
          <th>Minimum Students</th>
          <th>Current Students</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="offering in offerings" :key="offering.id">
          <td>{{ offering.course?.name || 'Unknown' }}</td>
          <td>{{ offering.course?.course_type || 'Unknown' }}</td>
          <td>{{ offering.semester }}</td>
          <td>{{ offering.opening_rule }}</td>
          <td>{{ offering.min_students ?? 0 }}</td>
          <td>{{ offering.current_students ?? 0 }}</td>
          <td>{{ offering.status }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(offering)">Edit</button>
            <button type="button" class="button-danger" @click="deleteOffering(offering)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No course offerings found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      offerings: [],
      courses: [],
      regulations: [],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        regulation_id: null,
        semester: '',
        academic_year: '',
        course_id: null,
        opening_rule: 'by_enrollment',
        min_students: 0,
        status: 'pending',
        note: '',
      },
    }
  },

  computed: {
    electiveCourses() {
      return this.courses.filter((course) => course.course_type === 'elective')
    },
  },

  async mounted() {
    await Promise.all([this.fetchCourses(), this.fetchRegulations(), this.fetchOfferings()])
  },

  methods: {
    async fetchCourses() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/courses')
        this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        this.handleApiError(err, 'Unable to load courses.')
      } finally {
        this.loading = false
      }
    },

    async fetchRegulations() {
      try {
        const response = await api.get('/regulations')
        this.regulations = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        this.handleApiError(err, 'Unable to load regulations.')
      }
    },

    async fetchOfferings() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/course-offerings')
        this.offerings = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        this.handleApiError(err, 'Unable to load course offerings.')
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.editing = false
      this.form = {
        id: null,
        regulation_id: null,
        semester: '',
        academic_year: '',
        course_id: null,
        opening_rule: 'by_enrollment',
        min_students: 0,
        status: 'pending',
        note: '',
      }
      this.error = null
      this.validationErrors = []
      this.success = null
    },

    startEdit(offering) {
      this.editing = true
      this.form = {
        id: offering.id,
        regulation_id: offering.regulation_id,
        semester: offering.semester,
        academic_year: offering.academic_year || '',
        course_id: offering.course_id,
        opening_rule: offering.opening_rule || 'by_enrollment',
        min_students: offering.min_students ?? 0,
        status: offering.status || 'pending',
        note: offering.note || '',
      }
      this.error = null
      this.validationErrors = []
      this.success = null
    },

    cancelEdit() {
      this.resetForm()
    },

    async submitOffering() {
      this.loading = true
      this.error = null
      this.validationErrors = []
      this.success = null

      if (!this.form.semester || !this.form.course_id) {
        this.error = 'Semester and course are required.'
        this.loading = false
        return
      }

      const payload = {
        regulation_id: this.form.regulation_id,
        semester: this.form.semester,
        academic_year: this.form.academic_year || null,
        course_id: this.form.course_id,
        opening_rule: this.form.opening_rule,
        min_students: this.form.min_students,
        status: this.form.status,
        note: this.form.note || null,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/course-offerings/${this.form.id}`, payload)
          this.success = 'Course offering updated successfully.'
        } else {
          await api.post('/course-offerings', payload)
          this.success = 'Course offering created successfully.'
        }

        this.resetForm()
        await this.fetchOfferings()
      } catch (err) {
        this.handleApiError(err, 'Unable to save course offering.')
      } finally {
        this.loading = false
      }
    },

    async deleteOffering(offering) {
      if (!confirm('Delete this course offering?')) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.delete(`/course-offerings/${offering.id}`)
        this.success = 'Course offering deleted successfully.'
        await this.fetchOfferings()
      } catch (err) {
        this.handleApiError(err, 'Unable to delete course offering.')
      } finally {
        this.loading = false
      }
    },

    async evaluateOfferings() {
      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.post('/course-offerings/evaluate')
        this.success = 'Elective offerings evaluated successfully.'
        await this.fetchOfferings()
      } catch (err) {
        this.handleApiError(err, 'Unable to evaluate elective offerings.')
      } finally {
        this.loading = false
      }
    },

    handleApiError(err, fallbackMessage) {
      const parsed = parseApiError(err, fallbackMessage)
      this.error = parsed.summary
      this.validationErrors = parsed.errors
      console.error(err)
    },
  },
}
</script>
