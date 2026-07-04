<template>
  <section class="resource-page">
    <h1>Courses</h1>

    <form class="resource-form" @submit.prevent="submitCourse">
      <label>
        Name
        <input type="text" v-model="form.name" placeholder="Enter course name" required />
      </label>

      <label>
        Code
        <input type="text" v-model="form.code" placeholder="Enter course code" required />
      </label>

      <label>
        <input type="checkbox" v-model="form.is_shared" />
        Shared course
      </label>

      <div v-if="form.is_shared" class="shared-course-fields">
        <label>
          Owner Department
          <select v-model.number="form.owner_department_id" required>
            <option disabled value="">Select owner department</option>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name || department.id }}
            </option>
          </select>
        </label>

        <label>
          Shared Departments
          <select v-model="form.shared_department_ids" multiple>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name || department.id }}
            </option>
          </select>
          <small>Select one or more additional departments to share this course with.</small>
        </label>
      </div>

      <label>
        Credit Hours
        <input
          type="number"
          v-model.number="form.credit_hours"
          placeholder="Enter credit hours"
          required
          min="0"
        />
      </label>

      <label>
        Lecture Hours
        <input
          type="number"
          step="0.5"
          v-model.number="form.lecture_hours"
          placeholder="e.g. 2.0"
        />
      </label>

      <label>
        Section Hours
        <input
          type="number"
          step="0.5"
          v-model.number="form.section_hours"
          placeholder="e.g. 2.0"
        />
      </label>

      <label>
        <input type="checkbox" v-model="form.has_section" />
        Has Section
      </label>

      <label>
        <input type="checkbox" v-model="form.has_practical" />
        Has Practical
      </label>

      <label>
        Section Type
        <select v-model="form.section_type" required>
          <option value="tutorial">Tutorial</option>
          <option value="practical" :disabled="!form.has_practical">Practical / Lab</option>
        </select>
        <small v-if="!form.has_practical"
          >Practical section type requires Has Practical enabled.</small
        >
      </label>

      <label>
        Midterm Duration (minutes)
        <input type="number" v-model.number="form.midterm_duration" placeholder="e.g. 60" min="0" />
      </label>

      <label>
        Final Duration (minutes)
        <input type="number" v-model.number="form.final_duration" placeholder="e.g. 120" min="0" />
      </label>

      <label>
        Practical Exam Duration (minutes)
        <input
          type="number"
          v-model.number="form.practical_exam_duration"
          placeholder="e.g. 90"
          min="0"
        />
      </label>

      <label>
        Course Type
        <select v-model="form.course_type" required>
          <option value="major_course">Major Course</option>
          <option value="university_requirement">University Requirement</option>
          <option value="graduation_requirement">Graduation Requirement</option>
        </select>
      </label>

      <label>
        Department ID
        <input
          type="number"
          v-model.number="form.department_id"
          placeholder="Optional department ID"
        />
        <small v-if="form.course_type === 'graduation_requirement'">
          Department is optional for graduation requirement courses.
        </small>
      </label>

      <label>
        Program
        <select v-model.number="form.program_id">
          <option :value="null">No program</option>
          <option v-for="program in programs" :key="program.id" :value="program.id">
            {{ program.name || program.code || program.id }}
          </option>
        </select>
      </label>

      <label>
        Level ID
        <input type="number" v-model.number="form.level_id" placeholder="Optional level ID" />
        <small v-if="form.course_type === 'graduation_requirement'">
          Level is optional for graduation requirement courses.
        </small>
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
        Lecture Doctor
        <select v-model.number="form.lecture_doctor_id">
          <option :value="null">No lecture doctor</option>
          <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
            {{ doctor.name || doctor.email || doctor.id }}
          </option>
        </select>
      </label>

      <label>
        Section Doctor
        <select v-model.number="form.section_doctor_id">
          <option :value="null">No section doctor</option>
          <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
            {{ doctor.name || doctor.email || doctor.id }}
          </option>
        </select>
      </label>

      <label>
        Practical Doctor
        <select v-model.number="form.practical_doctor_id">
          <option :value="null">No practical doctor</option>
          <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
            {{ doctor.name || doctor.email || doctor.id }}
          </option>
        </select>
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Course' : 'Create Course' }}
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

    <div v-if="loading" class="status">Loading courses...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>
    <div v-else-if="success" class="status success">{{ success }}</div>

    <table v-else-if="courses.length > 0" class="resource-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in courses" :key="item.id || index">
          <td v-for="header in headers" :key="header">{{ renderCourseCell(item, header) }}</td>
          <td class="actions-cell">
            <button type="button" @click="startEdit(item)">Edit</button>
            <button type="button" class="button-danger" @click="deleteCourse(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!loading && !error" class="status">No courses found.</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      courses: [],
      departments: [],
      programs: [],
      doctors: [],
      headers: [
        'code',
        'name',
        'credit_hours',
        'lecture_hours',
        'section_hours',
        'has_section',
        'has_practical',
        'section_type',
        'lecture_doctor',
        'section_doctor',
        'practical_doctor',
        'department',
        'program',
        'level',
        'semester',
        'course_type',
      ],
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      form: {
        id: null,
        name: '',
        code: '',
        is_shared: false,
        owner_department_id: null,
        shared_department_ids: [],
        credit_hours: null,
        lecture_hours: null,
        section_hours: null,
        has_section: false,
        has_practical: false,
        section_type: 'tutorial',
        lecture_doctor_id: null,
        section_doctor_id: null,
        practical_doctor_id: null,
        midterm_duration: null,
        final_duration: null,
        practical_exam_duration: null,
        department_id: null,
        program_id: null,
        level_id: null,
        semester: '',
        course_type: 'major_course',
      },
    }
  },

  async mounted() {
    await Promise.all([this.fetchDepartments(), this.fetchPrograms(), this.fetchDoctors()])
    await this.fetchCourses()
  },

  watch: {
    'form.has_practical'(value) {
      if (!value && this.form.section_type === 'practical') {
        this.form.section_type = 'tutorial'
      }
    },
  },

  methods: {
    async fetchCourses() {
      this.loading = true
      this.error = null

      try {
        const params = {}
        const response = await api.get('/courses', { params })
        this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to load courses. Please try again.')
      } finally {
        this.loading = false
      }
    },

    async submitCourse() {
      if (!this.form.name.trim() || !this.form.code.trim()) {
        this.error = 'Name and code are required.'
        return
      }

      if (this.form.credit_hours === null || this.form.credit_hours === '') {
        this.error = 'Credit hours are required.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      if (this.form.is_shared && !this.form.owner_department_id) {
        this.error = 'Owner department is required for shared courses.'
        this.loading = false
        return
      }

      if (
        this.form.is_shared &&
        (!Array.isArray(this.form.shared_department_ids) ||
          this.form.shared_department_ids.length === 0)
      ) {
        this.error = 'Shared courses must include at least one shared department.'
        this.loading = false
        return
      }

      const payload = {
        name: this.form.name,
        code: this.form.code,
        is_shared: this.form.is_shared,
        owner_department_id: this.form.is_shared ? this.form.owner_department_id : null,
        shared_departments: this.form.is_shared ? this.form.shared_department_ids : [],
        credit_hours: this.form.credit_hours,
        lecture_hours: this.form.lecture_hours,
        section_hours: this.form.section_hours,
        has_section: this.form.has_section,
        has_practical: this.form.has_practical,
        midterm_duration: this.form.midterm_duration,
        final_duration: this.form.final_duration,
        practical_exam_duration: this.form.practical_exam_duration,
        department_id: this.form.department_id,
        program_id: this.form.program_id,
        level_id: this.form.level_id,
        semester: this.form.semester,
        course_type: this.form.course_type,
        section_type: this.form.section_type,
        lecture_doctor_id: this.form.lecture_doctor_id,
        section_doctor_id: this.form.section_doctor_id,
        practical_doctor_id: this.form.practical_doctor_id,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/courses/${this.form.id}`, payload)
          this.success = 'Course updated successfully.'
        } else {
          await api.post('/courses', payload)
          this.success = 'Course created successfully.'
        }

        this.resetForm()
        await this.fetchCourses()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save course. Please try again.')
      } finally {
        this.loading = false
      }
    },

    startEdit(course) {
      this.editing = true
      this.form.id = course.id
      this.form.name = course.name || ''
      this.form.code = course.code || ''
      this.form.is_shared = course.is_shared || false
      this.form.owner_department_id = course.owner_department_id || null
      this.form.shared_department_ids = Array.isArray(course.shared_departments)
        ? course.shared_departments.map((department) => department.id)
        : []
      this.form.credit_hours = course.credit_hours || null
      this.form.lecture_hours = course.lecture_hours || null
      this.form.section_hours = course.section_hours || null
      this.form.has_section = course.has_section || false
      this.form.has_practical = course.has_practical || false
      this.form.midterm_duration = course.midterm_duration || null
      this.form.final_duration = course.final_duration || null
      this.form.practical_exam_duration = course.practical_exam_duration || null
      this.form.department_id = course.department_id || null
      this.form.program_id = course.program_id || null
      this.form.level_id = course.level_id || null
      this.form.semester = course.semester || ''
      this.form.course_type = course.course_type || 'major_course'
      this.form.section_type = course.section_type || 'tutorial'
      this.form.lecture_doctor_id = course.lecture_doctor_id || null
      this.form.section_doctor_id = course.section_doctor_id || null
      this.form.practical_doctor_id = course.practical_doctor_id || null
      this.error = null
      this.success = null
    },

    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
    },

    async deleteCourse(course) {
      const confirmed = window.confirm(`Delete course "${course.name}"?`)
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.delete(`/courses/${course.id}`)
        this.success = 'Course deleted successfully.'
        await this.fetchCourses()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete course. Please try again.')
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
      this.form.code = ''
      this.form.is_shared = false
      this.form.owner_department_id = null
      this.form.shared_department_ids = []
      this.form.credit_hours = null
      this.form.lecture_hours = null
      this.form.section_hours = null
      this.form.has_section = false
      this.form.has_practical = false
      this.form.section_type = 'tutorial'
      this.form.lecture_doctor_id = null
      this.form.section_doctor_id = null
      this.form.practical_doctor_id = null
      this.form.midterm_duration = null
      this.form.final_duration = null
      this.form.practical_exam_duration = null
      this.form.department_id = null
      this.form.program_id = null
      this.form.level_id = null
      this.form.semester = ''
      this.form.course_type = 'major_course'
      this.validationErrors = []
    },

    async fetchDepartments() {
      try {
        const response = await api.get('/departments')
        this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },

    async fetchPrograms() {
      try {
        const response = await api.get('/programs')
        this.programs = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchDoctors() {
      try {
        const response = await api.get('/doctors')
        this.doctors = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error('Unable to load doctors', err)
      }
    },

    renderCourseCell(item, header) {
      if (header === 'is_shared') {
        return item.is_shared ? 'Yes' : 'No'
      }

      if (header === 'owner_department') {
        return item.owner_department?.name || item.owner_department_id || ''
      }

      if (header === 'shared_departments') {
        if (Array.isArray(item.shared_departments) && item.shared_departments.length > 0) {
          return item.shared_departments
            .map((department) => department.name || department.id)
            .join(', ')
        }
        return ''
      }

      if (header === 'department') {
        return item.department?.name || item.department_id || ''
      }

      if (header === 'lecture_doctor') {
        return item.lectureDoctor?.name || item.lecture_doctor_id || ''
      }

      if (header === 'section_doctor') {
        return item.sectionDoctor?.name || item.section_doctor_id || ''
      }

      if (header === 'practical_doctor') {
        return item.practicalDoctor?.name || item.practical_doctor_id || ''
      }

      if (header === 'program') {
        return item.program?.name || item.program_id || ''
      }

      if (header === 'level') {
        return item.level?.name || item.level_id || ''
      }

      return this.formatCell(item[header])
    },

    formatCell(value) {
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return value.name ?? JSON.stringify(value)
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
  color: rgba(255, 255, 255, 0.85);
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

.resource-table button.button-danger:hover:not(:disabled) {
  opacity: 0.95;
}

.resource-table button[type='button'] {
  background: rgba(255, 255, 255, 0.08);
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
