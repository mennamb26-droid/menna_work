<template>
  <section class="resource-page">
    <h1>Schedules</h1>


    <section class="generate-groups-section">
      <div class="section-header">
        <div>
          <h2>Generate Groups</h2>
          <p class="subtitle">Create groups directly from the selected filters and number of groups.</p>
        </div>
      </div>
      <div class="form-grid">
        <label>
          Regulation *
          <select v-model.number="groupGenerationForm.regulation_id" required>
            <option disabled value="">Select a regulation</option>
            <option v-for="reg in regulations" :key="reg.id" :value="reg.id">
              {{ reg.label || reg.value || reg.name }}
            </option>
          </select>
        </label>

        <label>
          Department *
          <select v-model.number="groupGenerationForm.department_id" required>
            <option disabled value="">Select a department</option>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name || department.id }}
            </option>
          </select>
        </label>

        <label>
          Program
          <select v-model.number="groupGenerationForm.program_id">
            <option value="">Optional</option>
            <option v-for="program in programs" :key="program.id" :value="program.id">
              {{ program.name || program.id }}
            </option>
          </select>
        </label>

        <label>
          Level *
          <select v-model.number="groupGenerationForm.level_id" required>
            <option disabled value="">Select a level</option>
            <option v-for="level in levels" :key="level.id" :value="level.id">
              {{ level.name || level.id }}
            </option>
          </select>
        </label>

        <label>
          Semester *
          <select v-model="groupGenerationForm.semester" required>
            <option disabled value="">Select semester</option>
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
            <option value="Summer Semester">Summer Semester</option>
          </select>
        </label>

        <label>
          Number of Groups *
          <input
            type="number"
            v-model.number="groupGenerationForm.number_of_groups"
            min="1"
            required
          />
        </label>
      </div>

      <div class="form-actions">
        <button
          class="button-primary"
          type="button"
          @click="generateGroups"
          :disabled="groupGenerationLoading || !isGroupGenerationFormValid"
        >
          {{ groupGenerationLoading ? 'Generating Groups...' : 'Generate Groups' }}
        </button>
      </div>

      <div v-if="groupGenerationResult" class="generation-result">
        <p class="status success" v-if="!groupGenerationResult.error">
          Created {{ groupGenerationResult.created || 0 }} groups, updated {{ groupGenerationResult.updated || 0 }}.
        </p>
        <p class="status error" v-if="groupGenerationResult.error">
          {{ groupGenerationResult.error }}
        </p>
      </div>

      <div class="table-container" v-if="groups.length">
        <table class="resource-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Program</th>
              <th>Level</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups" :key="group.id">
              <td>{{ group.name || 'Group ' + group.id }}</td>
              <td>{{ getDepartmentName(group.department_id) }}</td>
              <td>{{ getProgramName(group.program_id) }}</td>
              <td>{{ getLevelName(group.level_id) }}</td>
              <td>{{ group.students_count || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="status">No generated groups available.</div>
    </section>

    <section class="generate-schedule-section">
      <div class="section-header">
        <div>
          <h2>Generate Schedule</h2>
          <p class="subtitle">Generate lecture and section schedules from courses, rooms, and generated groups.</p>
        </div>
      </div>

      <div class="form-grid">
        <label>
          Regulation
          <select v-model.number="scheduleGenerationForm.regulation_id">
            <option value="">All regulations</option>
            <option v-for="reg in regulations" :key="reg.id" :value="reg.id">
              {{ reg.label || reg.value || reg.name }}
            </option>
          </select>
        </label>

        <label>
          Department
          <select v-model.number="scheduleGenerationForm.department_id">
            <option value="">All departments</option>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name || department.id }}
            </option>
          </select>
        </label>

        <label>
          Level
          <select v-model.number="scheduleGenerationForm.level_id">
            <option value="">All levels</option>
            <option v-for="level in levels" :key="level.id" :value="level.id">
              {{ level.name || level.id }}
            </option>
          </select>
        </label>

        <label>
          Program
          <select v-model.number="scheduleGenerationForm.program_id">
            <option value="">All programs</option>
            <option v-for="program in programs" :key="program.id" :value="program.id">
              {{ program.name || program.id }}
            </option>
          </select>
        </label>

        <label>
          Semester
          <select v-model="scheduleGenerationForm.semester" required>
            <option disabled value="">Select semester</option>
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
            <option value="Summer Semester">Summer Semester</option>
          </select>
        </label>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="button-primary"
          @click="generateSchedule"
          :disabled="scheduleGenerationLoading"
        >
          {{ scheduleGenerationLoading ? 'Generating Schedule...' : 'Generate Lecture/Section Schedule' }}
        </button>
      </div>

      <div v-if="scheduleGenerationError" class="alert error">{{ scheduleGenerationError }}</div>
      <div v-if="scheduleGenerationSuccess" class="alert success">{{ scheduleGenerationSuccess }}</div>

      <div v-if="scheduleGenerationResult" class="generation-result">
        <p class="status success" v-if="!scheduleGenerationResult.error">
          Scheduled count: {{ scheduleGenerationResult.scheduled_count || 0 }}
        </p>
        <p class="status error" v-if="scheduleGenerationResult.error">
          {{ scheduleGenerationResult.error }}
        </p>
        <div v-if="scheduleGenerationResult.conflicts?.length" class="result-list">
          <h4>Conflicts</h4>
          <ul>
            <li v-for="(conflict, idx) in scheduleGenerationResult.conflicts" :key="idx">
              {{ conflict.description || conflict.message || JSON.stringify(conflict) }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <form class="resource-form" @submit.prevent="submitSchedule">
      <label>
        Course
        <select v-model.number="form.course_id" @change="onCourseChange" required>
          <option disabled value="">Select a course</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name || course.id }}
          </option>
        </select>
      </label>

      <label>
        Department
        <select v-model.number="form.department_id" required>
          <option disabled value="">Select a department</option>
          <option v-for="department in departments" :key="department.id" :value="department.id">
            {{ department.name || department.id }}
          </option>
        </select>
      </label>

      <label>
        Level
        <select v-model.number="form.level_id" required>
          <option disabled value="">Select a level</option>
          <option v-for="level in levels" :key="level.id" :value="level.id">
            {{ level.name || level.id }}
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
        Room
        <select v-model.number="form.room_id" required>
          <option disabled value="">Select a room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.name || room.id }}
          </option>
        </select>
      </label>

      <label>
        Semester
        <select v-model="form.semester" required>
          <option disabled value="">Select a semester</option>
          <option v-for="semester in semesters" :key="semester" :value="semester">
            {{ semester }}
          </option>
        </select>
      </label>

      <label>
        Day
        <input type="text" v-model="form.day" placeholder="Enter day (e.g. Monday)" required />
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
        Type
        <select v-model="form.type" required>
          <option disabled value="">Select type</option>
          <option value="lecture">Lecture</option>
          <option value="section">Section</option>
        </select>
      </label>

      <label>
        Note
        <input type="text" v-model="form.note" placeholder="Optional note" />
      </label>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ editing ? 'Update Schedule' : 'Create Schedule' }}
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

    <div v-if="loading" class="status">Loading schedules...</div>
    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-errors">
        <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
      </ul>
    </div>

    <div v-else>
      <div v-if="success" class="status success">{{ success }}</div>

      <section class="tabs-panel">
        <button
          type="button"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          All
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'lecture' }"
          @click="activeTab = 'lecture'"
        >
          Lectures
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'section' }"
          @click="activeTab = 'section'"
        >
          Sections
        </button>
      </section>

      <section class="filters-panel">
        <div class="filters-grid">
          <label>
            Regulation
            <select v-model.number="filters.regulation_id">
              <option value="">All regulations</option>
              <option v-for="reg in regulations" :key="reg.id" :value="reg.id">
                {{ reg.label || reg.value || reg.name }}
              </option>
            </select>
          </label>

          <label>
            Department
            <select v-model="filters.department_id">
              <option value="">All departments</option>
              <option v-for="department in departments" :key="department.id" :value="department.id">
                {{ department.name || department.id }}
              </option>
            </select>
          </label>

          <label>
            Program
            <select v-model="filters.program_id">
              <option value="">All programs</option>
              <option v-for="program in programs" :key="program.id" :value="program.id">
                {{ program.name || program.id }}
              </option>
            </select>
          </label>

          <label>
            Level
            <select v-model="filters.level_id">
              <option value="">All levels</option>
              <option v-for="level in levels" :key="level.id" :value="level.id">
                {{ level.name || level.id }}
              </option>
            </select>
          </label>

          <label>
            Semester
            <select v-model="filters.semester">
              <option value="">All semesters</option>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
              <option value="Summer Semester">Summer Semester</option>
            </select>
          </label>

          <label>
            Group
            <select v-model="filters.group_id">
              <option value="">All groups</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.name || 'Group ' + group.id }}
              </option>
            </select>
          </label>

          <label>
            Day
            <select v-model="filters.day">
              <option value="">All days</option>
              <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
            </select>
          </label>

          <label class="search-field">
            Search
            <input type="search" v-model="filters.search" placeholder="Search schedules" />
          </label>
        </div>

        <div class="filter-actions">
          <button type="button" class="button-secondary" @click="clearFilters">
            Clear Filters
          </button>
          <button type="button" class="button-secondary" @click="printSchedules">
            Print Schedule
          </button>
        </div>
      </section>

      <table v-if="displayedSchedules.length > 0" class="resource-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Department</th>
            <th>Program</th>
            <th>Level</th>
            <th>Group</th>
            <th>Doctor</th>
            <th>Room</th>
            <th>Semester</th>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>Type</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in displayedSchedules" :key="schedule.id || schedule.course_id">
            <td>{{ getCourseName(schedule.course_id) }}</td>
            <td>{{ getDepartmentName(schedule.department_id) }}</td>
            <td>{{ getProgramDisplay(schedule) }}</td>
            <td>{{ getLevelName(schedule.level_id) }}</td>
            <td>{{ getGroupName(schedule.group_id) }}</td>
            <td>{{ getDoctorName(schedule.doctor_id) }}</td>
            <td>{{ getRoomName(schedule.room_id) }}</td>
            <td>{{ schedule.semester || '—' }}</td>
            <td>{{ schedule.day || '—' }}</td>
            <td>{{ schedule.start_time || '—' }}</td>
            <td>{{ schedule.end_time || '—' }}</td>
            <td>{{ schedule.type || '—' }}</td>
            <td>{{ schedule.note || '—' }}</td>
            <td class="actions-cell">
              <button type="button" @click="startEdit(schedule)">Edit</button>
              <button type="button" class="button-danger" @click="deleteSchedule(schedule)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="status">
        No {{ activeTab === 'lecture' ? 'lectures' : 'sections' }} found.
      </div>
    </div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  name: 'Schedules',
  data() {
    return {
      schedules: [],
      courses: [],
      departments: [],
      programs: [],
      levels: [],
      doctors: [],
      rooms: [],
      studentCounts: [],
      groups: [],
      regulations: [],
      editingStudentCount: null,
      studentCountForm: {
        regulation_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: 'Second Semester',
        student_count: '',
        max_students_per_group: 30,
      },
      savingStudentCount: false,
      studentCountError: null,
      studentCountSuccess: null,
      groupGenerationLoading: false,
      groupGenerationResult: null,
      scheduleGenerationForm: {
        semester: 'Second Semester',
        department_id: '',
        level_id: '',
        program_id: '',
        regulation_id: '',
      },
      scheduleGenerationLoading: false,
      scheduleGenerationError: null,
      scheduleGenerationSuccess: null,
      groupGenerationForm: {
        regulation_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: 'Second Semester',
        number_of_groups: 3,
      },
      scheduleGenerationResult: null,
      loading: false,
      error: null,
      validationErrors: [],
      success: null,
      editing: false,
      activeTab: 'all',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      semesters: ['First Semester', 'Second Semester', 'Summer Semester'],
      form: {
        id: null,
        course_id: null,
        department_id: null,
        level_id: null,
        doctor_id: null,
        room_id: null,
        semester: '',
        day: '',
        start_time: '',
        end_time: '',
        type: '',
        note: '',
      },
      filters: {
        regulation_id: '',
        course_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: '',
        group_id: '',
        day: '',
        search: '',
      },
    }
  },
  computed: {
    displayedSchedules() {
      return this.schedules.filter((schedule) => {
        if (this.activeTab !== 'all' && schedule.type !== this.activeTab) {
          return false
        }
        if (this.filters.course_id && schedule.course_id !== Number(this.filters.course_id)) {
          return false
        }
        if (
          this.filters.regulation_id &&
          schedule.regulation_id !== Number(this.filters.regulation_id)
        ) {
          return false
        }
        if (
          this.filters.department_id &&
          schedule.department_id !== Number(this.filters.department_id)
        ) {
          return false
        }
        if (this.filters.program_id && schedule.program_id !== Number(this.filters.program_id)) {
          return false
        }
        if (this.filters.level_id && schedule.level_id !== Number(this.filters.level_id)) {
          return false
        }
        if (this.filters.semester && schedule.semester !== this.filters.semester) {
          return false
        }
        if (this.filters.group_id && schedule.group_id !== Number(this.filters.group_id)) {
          return false
        }
        if (this.filters.day && schedule.day !== this.filters.day) {
          return false
        }
        const search = this.filters.search.trim().toLowerCase()
        if (search) {
          const values = [
            this.getCourseName(schedule.course_id),
            this.getDepartmentName(schedule.department_id),
            this.getLevelName(schedule.level_id),
            this.getDoctorName(schedule.doctor_id),
            this.getRoomName(schedule.room_id),
            schedule.semester,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
            schedule.type,
            schedule.note,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return values.includes(search)
        }
        return true
      })
    },
    filteredPrograms() {
      if (!this.studentCountForm.department_id) return this.programs
      return this.programs.filter(
        (prog) => prog.department_id === Number(this.studentCountForm.department_id),
      )
    },
    isStudentCountFormValid() {
      return (
        this.studentCountForm.regulation_id &&
        this.studentCountForm.department_id &&
        this.studentCountForm.level_id &&
        this.studentCountForm.semester &&
        this.studentCountForm.student_count > 0 &&
        this.studentCountForm.max_students_per_group > 0
      )
    },
    isGroupGenerationFormValid() {
      return (
        this.groupGenerationForm.regulation_id &&
        this.groupGenerationForm.department_id &&
        this.groupGenerationForm.level_id &&
        this.groupGenerationForm.semester &&
        Number(this.groupGenerationForm.number_of_groups) > 0
      )
    },
  },
  async mounted() {
    await Promise.all([
      this.fetchCourses(),
      this.fetchDepartments(),
      this.fetchPrograms(),
      this.fetchLevels(),
      this.fetchDoctors(),
      this.fetchRooms(),
      this.fetchGroups(),
      this.fetchRegulations(),
    ])
    await this.fetchSchedules()
  },
  methods: {
    async fetchSchedules() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/schedules')
        this.schedules = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
        this.handleApiError(error, 'Unable to load schedules. Please try again.')
      } finally {
        this.loading = false
      }
    },
    async fetchCourses() {
      try {
        const response = await api.get('/courses')
        this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchDepartments() {
      try {
        const response = await api.get('/departments')
        this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchLevels() {
      try {
        const response = await api.get('/levels')
        this.levels = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchDoctors() {
      try {
        const response = await api.get('/doctors')
        this.doctors = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchRooms() {
      try {
        const response = await api.get('/rooms')
        this.rooms = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchPrograms() {
      try {
        const response = await api.get('/programs')
        this.programs = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error(error)
      }
    },
    async fetchStudentCounts() {
      try {
        const response = await api.get('/student-counts')
        this.studentCounts = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error('Unable to load student counts', error)
      }
    },
    async fetchGroups() {
      try {
        const response = await api.get('/groups')
        this.groups = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error('Unable to load groups', error)
      }
    },
    async fetchRegulations() {
      try {
        const response = await api.get('/regulations')
        this.regulations = Array.isArray(response.data) ? response.data : response.data.data || []
        if (this.regulations.length && !this.scheduleGenerationForm.regulation_id) {
          this.scheduleGenerationForm.regulation_id = this.regulations[0].id
        }
      } catch (error) {
        console.error('Unable to load regulations', error)
      }
    },
    async saveStudentCount() {
      if (!this.isStudentCountFormValid) {
        this.studentCountError = 'Please fill all required fields.'
        return
      }

      this.savingStudentCount = true
      this.studentCountError = null
      this.studentCountSuccess = null

      try {
        const payload = {
          regulation_id: this.studentCountForm.regulation_id || null,
          department_id: parseInt(this.studentCountForm.department_id),
          program_id: this.studentCountForm.program_id
            ? parseInt(this.studentCountForm.program_id)
            : null,
          level_id: parseInt(this.studentCountForm.level_id),
          semester: this.studentCountForm.semester,
          student_count: parseInt(this.studentCountForm.student_count),
          max_students_per_group: parseInt(this.studentCountForm.max_students_per_group),
        }

        if (this.editingStudentCount) {
          await api.put(`/student-counts/${this.editingStudentCount}`, payload)
          this.studentCountSuccess = 'Student count updated successfully.'
        } else {
          await api.post('/student-counts', payload)
          this.studentCountSuccess = 'Student count added successfully.'
        }

        await this.fetchStudentCounts()
        this.cancelStudentCountEdit()
      } catch (error) {
        this.studentCountError = error.response?.data?.message || 'Unable to save student count.'
      } finally {
        this.savingStudentCount = false
      }
    },
    editStudentCount(row) {
      this.editingStudentCount = row.id
      this.studentCountForm = {
        regulation_id: row.regulation_id || '',
        department_id: row.department_id || '',
        program_id: row.program_id || '',
        level_id: row.level_id || '',
        semester: row.semester || 'Second Semester',
        student_count: row.student_count || '',
        max_students_per_group: row.max_students_per_group || 30,
      }
      this.studentCountError = null
      this.studentCountSuccess = null
    },
    cancelStudentCountEdit() {
      this.editingStudentCount = null
      this.studentCountForm = {
        regulation_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: 'Second Semester',
        student_count: '',
        max_students_per_group: 30,
      }
      this.studentCountError = null
      this.studentCountSuccess = null
    },
    async deleteStudentCount(id) {
      if (!window.confirm('Are you sure you want to delete this student count?')) {
        return
      }

      try {
        await api.delete(`/student-counts/${id}`)
        this.studentCountSuccess = 'Student count deleted successfully.'
        await this.fetchStudentCounts()
      } catch (error) {
        this.studentCountError = error.response?.data?.message || 'Unable to delete student count.'
      }
    },
    async generateGroups() {
      if (!this.isGroupGenerationFormValid) {
        this.groupGenerationResult = { error: 'Please fill in all required group generation fields.' }
        return
      }

      this.groupGenerationLoading = true
      this.groupGenerationResult = null
      try {
        const payload = {
          regulation_id: this.groupGenerationForm.regulation_id || null,
          department_id: this.groupGenerationForm.department_id || null,
          program_id: this.groupGenerationForm.program_id || null,
          level_id: this.groupGenerationForm.level_id || null,
          semester: this.groupGenerationForm.semester || null,
          number_of_groups: this.groupGenerationForm.number_of_groups,
        }
        const response = await api.post('/groups/generate', payload)
        this.groupGenerationResult = response.data
        await this.fetchGroups()
      } catch (error) {
        this.groupGenerationResult = { error: error.response?.data?.message || 'Unable to generate groups.' }
      } finally {
        this.groupGenerationLoading = false
      }
    },
    async generateSchedule() {
      if (!this.scheduleGenerationForm.semester) {
        this.scheduleGenerationError = 'Please select a semester.'
        return
      }

      this.scheduleGenerationLoading = true
      this.scheduleGenerationError = null
      this.scheduleGenerationSuccess = null
      this.scheduleGenerationResult = null

      try {
        const payload = {
          semester: this.scheduleGenerationForm.semester,
          department_id: this.scheduleGenerationForm.department_id || null,
          level_id: this.scheduleGenerationForm.level_id || null,
          program_id: this.scheduleGenerationForm.program_id || null,
          regulation_id: this.scheduleGenerationForm.regulation_id || null,
        }

        const response = await api.post('/schedules/generate', payload)
        this.scheduleGenerationResult = response.data

        if (response.data?.scheduled_count > 0) {
          this.scheduleGenerationSuccess = 'Schedule generated successfully.'
        } else {
          this.scheduleGenerationError = response.data?.message || 'No schedules could be generated.'
          this.scheduleGenerationResult = { ...response.data, error: this.scheduleGenerationError }
        }

        await this.fetchSchedules()
      } catch (error) {
        this.scheduleGenerationError = error.response?.data?.message || 'Unable to generate schedule.'
        this.scheduleGenerationResult = { error: this.scheduleGenerationError }
      } finally {
        this.scheduleGenerationLoading = false
      }
    },
    printSchedules() {
      window.print()
    },
    async submitSchedule() {
      this.error = null
      this.success = null
      this.validationErrors = []
      if (
        !this.form.course_id ||
        !this.form.department_id ||
        !this.form.level_id ||
        !this.form.doctor_id ||
        !this.form.room_id
      ) {
        this.error = 'Course, department, level, doctor, and room are required.'
        return
      }
      if (
        !this.form.semester ||
        !this.form.day ||
        !this.form.start_time ||
        !this.form.end_time ||
        !this.form.type
      ) {
        this.error = 'Semester, day, start time, end time, and type are required.'
        return
      }
      this.loading = true
      const payload = {
        course_id: this.form.course_id,
        department_id: this.form.department_id,
        level_id: this.form.level_id,
        doctor_id: this.form.doctor_id,
        room_id: this.form.room_id,
        semester: this.form.semester,
        day: this.form.day,
        start_time: this.form.start_time,
        end_time: this.form.end_time,
        type: this.form.type,
        note: this.form.note,
      }
      try {
        if (this.editing && this.form.id) {
          await api.put(`/schedules/${this.form.id}`, payload)
          this.success = 'Schedule updated successfully.'
        } else {
          await api.post('/schedules', payload)
          this.success = 'Schedule created successfully.'
        }
        this.resetForm()
        await this.fetchSchedules()
      } catch (error) {
        console.error(error)
        this.handleApiError(error, 'Unable to save schedule. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEdit(schedule) {
      this.editing = true
      this.form.id = schedule.id
      this.form.course_id = schedule.course_id || null
      this.form.department_id = schedule.department_id || null
      this.form.level_id = schedule.level_id || null
      this.form.doctor_id = schedule.doctor_id || null
      this.form.room_id = schedule.room_id || null
      this.form.semester = schedule.semester || ''
      this.form.day = schedule.day || ''
      this.form.start_time = schedule.start_time || ''
      this.form.end_time = schedule.end_time || ''
      this.form.type = schedule.type || ''
      this.form.note = schedule.note || ''
      this.error = null
      this.success = null
    },
    cancelEdit() {
      this.resetForm()
      this.error = null
      this.success = null
    },
    async deleteSchedule(schedule) {
      const confirmed = window.confirm(`Delete schedule #${schedule.id}?`)
      if (!confirmed) {
        return
      }
      this.loading = true
      this.error = null
      this.success = null
      try {
        await api.delete(`/schedules/${schedule.id}`)
        this.success = 'Schedule deleted successfully.'
        await this.fetchSchedules()
      } catch (error) {
        console.error(error)
        this.handleApiError(error, 'Unable to delete schedule. Please try again.')
      } finally {
        this.loading = false
      }
    },
    onCourseChange() {
      const course = this.courses.find((item) => item.id === this.form.course_id)
      if (!course) {
        return
      }
      if (!this.form.department_id && course.department_id) {
        this.form.department_id = course.department_id
      }
      if (!this.form.level_id && course.level_id) {
        this.form.level_id = course.level_id
      }
    },
    getCourseName(courseId) {
      const course = this.courses.find((item) => item.id === courseId)
      return course ? course.name : `Course ${courseId}`
    },
    getDepartmentName(departmentId) {
      const department = this.departments.find((item) => item.id === departmentId)
      return department ? department.name : `Department ${departmentId}`
    },
    getLevelName(levelId) {
      const level = this.levels.find((item) => item.id === levelId)
      return level ? level.name : `Level ${levelId}`
    },
    getDoctorName(doctorId) {
      const doctor = this.doctors.find((item) => item.id === doctorId)
      return doctor ? doctor.name : `Doctor ${doctorId}`
    },
    getRoomName(roomId) {
      const room = this.rooms.find((item) => item.id === roomId)
      return room ? room.name : `Room ${roomId}`
    },
    getProgramName(programId) {
      const program = this.programs.find((item) => item.id === programId)
      return program ? program.name : `Program ${programId}`
    },
    getProgramDisplay(schedule) {
      if (!schedule) return 'N/A'
      if (schedule.program && schedule.program.name) return schedule.program.name
      if (schedule.course && schedule.course.program && schedule.course.program.name) return schedule.course.program.name
      const program = this.programs.find((item) => item.id === schedule.program_id)
      return program ? program.name : (schedule.program_id ? `Program ${schedule.program_id}` : 'N/A')
    },
    getGroupName(groupId) {
      const group = this.groups.find((item) => item.id === groupId)
      return group ? group.name : `Group ${groupId}`
    },
    handleApiError(error, fallbackMessage) {
      const { summary, errors } = parseApiError(error, fallbackMessage)
      this.error = summary
      this.validationErrors = errors
    },
    resetForm() {
      this.editing = false
      this.form = {
        id: null,
        course_id: null,
        department_id: null,
        level_id: null,
        doctor_id: null,
        room_id: null,
        semester: '',
        day: '',
        start_time: '',
        end_time: '',
        type: '',
        note: '',
      }
      this.validationErrors = []
    },
    clearFilters() {
      this.filters.course_id = ''
      this.filters.department_id = ''
      this.filters.program_id = ''
      this.filters.level_id = ''
      this.filters.semester = ''
      this.filters.group_id = ''
      this.filters.day = ''
      this.filters.search = ''
      this.activeTab = 'all'
    },
  },
}
</script>

<style scoped>
.resource-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem;
}

.resource-page h1 {
  margin-bottom: 1rem;
  font-size: clamp(2rem, 2.2vw, 2.4rem);
  color: #f6e8b1;
}

.resource-form,
.filters-panel,
.status,
.resource-table {
  background: rgba(11, 24, 45, 0.85);
  border: 1px solid rgba(249, 206, 70, 0.18);
  border-radius: 1.15rem;
}

.resource-form {
  display: grid;
  gap: 1rem;
  padding: 1.4rem;
  margin-bottom: 1.5rem;
}

.resource-form label,
.filters-grid label {
  display: grid;
  gap: 0.4rem;
  color: #f4f1d7;
  font-weight: 600;
}

.resource-form input,
.resource-form select,
.filters-grid select,
.resource-form textarea {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(249, 206, 70, 0.18);
  background: rgba(12, 31, 58, 0.95);
  color: #f4f1d7;
}

.resource-form input:focus,
.resource-form select:focus,
.filters-grid select:focus {
  outline: 2px solid rgba(249, 206, 70, 0.35);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.resource-form button,
.filter-actions button,
.resource-table button {
  padding: 0.9rem 1.25rem;
  border: none;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, #f6d35d, #c28d2c);
  color: #08101b;
  cursor: pointer;
  font-weight: 700;
}

.resource-form button:disabled,
.resource-table button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.button-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f4f1d7;
  border: 1px solid rgba(249, 206, 70, 0.18);
}

.tabs-panel {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tabs-panel button {
  padding: 0.9rem 1.2rem;
  border: 1px solid rgba(249, 206, 70, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #f4f1d7;
}

.tabs-panel button.active {
  background: rgba(249, 206, 70, 0.22);
  color: #08101b;
}

.filters-panel {
  padding: 1.2rem;
  margin-bottom: 1rem;
}

.filters-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.search-field input {
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
}

.resource-table th,
.resource-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(249, 206, 70, 0.1);
  color: #edf0f7;
}

.resource-table th {
  background: rgba(20, 40, 72, 0.95);
  color: #f8e3a6;
  text-align: left;
}

.resource-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.resource-table tr:hover {
  background: rgba(249, 206, 70, 0.07);
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status {
  padding: 1rem 1.1rem;
  margin: 1rem 0;
  color: #f4f1d7;
}

.status.error {
  background: rgba(249, 115, 22, 0.16);
}

.status.success {
  background: rgba(34, 197, 94, 0.16);
}

..validation-errors {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
  color: #ffdddd;
}

.validation-errors li {
  margin-bottom: 0.35rem;
}
</style>
