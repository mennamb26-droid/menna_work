<template>
  <section class="final-exams-page">
    <header class="page-header">
      <div>
        <p class="badge">إدارة الجدول</p>
        <h1>إدارة جدول الامتحانات النهائي</h1>
      </div>
      <div class="term-selector">
        <label for="term">Term</label>
        <select id="term" v-model="selectedTerm">
          <option v-for="term in terms" :key="term" :value="term">{{ term }}</option>
        </select>
      </div>
    </header>

    <div v-if="error" class="alert">{{ error }}</div>

    <div class="tabs-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="['tab-button', { active: activeTab === tab.key }]"
        @click="setActiveTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <section v-if="activeTab === 'add'" class="tab-panel">
      <form class="form-grid" @submit.prevent="submitExam">
        <div class="field-group">
          <label for="department">Department</label>
          <select id="department" v-model.number="form.department_id" required>
            <option value="" disabled>Select department</option>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="level">Level</label>
          <select id="level" v-model.number="form.level_id" required>
            <option value="" disabled>Select level</option>
            <option v-for="level in levels" :key="level.id" :value="level.id">
              {{ level.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="group">Group</label>
          <select id="group" v-model.number="form.group_id" required>
            <option value="" disabled>Select group</option>
            <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="course">Course</label>
          <select id="course" v-model.number="form.course_id" required>
            <option value="" disabled>Select course</option>
            <option v-for="course in filteredCourses" :key="course.id" :value="course.id">
              {{ course.name }} ({{ course.code }})
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="day">Exam day</label>
          <select id="day" v-model="form.day" required>
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
        </div>

        <div class="field-group">
          <label for="exam_date">Exam date</label>
          <input id="exam_date" type="date" v-model="form.exam_date" required />
        </div>

        <div class="field-group">
          <label for="period">Period</label>
          <select id="period" v-model="form.period" required>
            <option v-for="period in periods" :key="period" :value="period">{{ period }}</option>
          </select>
        </div>

        <div class="field-group">
          <label for="doctor">Doctor</label>
          <select id="doctor" v-model.number="form.doctor_id">
            <option value="">No doctor</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.name }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="room">Room</label>
          <select id="room" v-model.number="form.room_id">
            <option value="">No room</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ room.name }}
            </option>
          </select>
        </div>

        <div class="field-group full-width">
          <label for="place_name">Place name (optional)</label>
          <input
            id="place_name"
            type="text"
            v-model="form.place_name"
            placeholder="Room name or venue"
          />
        </div>

        <div class="field-group full-width">
          <button type="submit" class="submit-button" :disabled="saving">
            {{ saving ? 'Saving...' : editMode ? 'Update Exam' : 'Add Exam' }}
          </button>
          <button v-if="editMode" type="button" class="reset-button" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>
    </section>

    <section v-if="activeTab === 'view'" class="tab-panel">
      <div class="table-actions">
        <button type="button" class="refresh-button" @click="fetchExams">Refresh List</button>
      </div>

      <div class="table-container" v-if="exams.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Code</th>
              <th>Group</th>
              <th>Day</th>
              <th>Date</th>
              <th>Period</th>
              <th>Doctor</th>
              <th>Room / Place</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in exams" :key="exam.id">
              <td>{{ exam.course?.name || '-' }}</td>
              <td>{{ exam.course?.code || '-' }}</td>
              <td>{{ exam.group?.name || '-' }}</td>
              <td>{{ exam.day || '-' }}</td>
              <td>{{ formatDate(exam.exam_date) }}</td>
              <td>{{ exam.period || '-' }}</td>
              <td>{{ exam.doctor?.name || '-' }}</td>
              <td>{{ exam.room?.name || exam.place_name || '-' }}</td>
              <td>
                <button type="button" class="action-button" @click="editExam(exam)">Edit</button>
                <button type="button" class="action-button delete" @click="deleteExam(exam.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" v-else>No final exams found for selected term.</div>
    </section>

    <section v-if="activeTab === 'search'" class="tab-panel">
      <div class="search-row">
        <input
          type="search"
          v-model="searchQuery"
          placeholder="Search course name, code, or doctor"
        />
      </div>

      <div class="table-container" v-if="searchResults.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Code</th>
              <th>Group</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in searchResults" :key="exam.id">
              <td>{{ exam.course?.name || '-' }}</td>
              <td>{{ exam.course?.code || '-' }}</td>
              <td>{{ exam.group?.name || '-' }}</td>
              <td>{{ exam.doctor?.name || '-' }}</td>
              <td>{{ formatDate(exam.exam_date) }}</td>
              <td>{{ exam.period || '-' }}</td>
              <td>
                <button type="button" class="action-button" @click="editExam(exam)">Edit</button>
                <button type="button" class="action-button delete" @click="deleteExam(exam.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" v-else>No exam matches your search.</div>
    </section>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'FinalExams',
  data() {
    return {
      loading: false,
      saving: false,
      error: null,
      selectedTerm: 'First Semester',
      terms: ['First Semester', 'Second Semester', 'Summer Semester'],
      activeTab: 'add',
      tabs: [
        { key: 'add', label: 'Add Exam' },
        { key: 'view', label: 'View Exams' },
        { key: 'search', label: 'Search/Edit' },
      ],
      departments: [],
      levels: [],
      groups: [],
      courses: [],
      doctors: [],
      rooms: [],
      exams: [],
      searchQuery: '',
      editMode: false,
      editingExamId: null,
      form: {
        term: 'First Semester',
        department_id: null,
        level_id: null,
        group_id: null,
        course_id: null,
        day: 'Sunday',
        exam_date: '',
        period: 'Morning',
        doctor_id: null,
        room_id: null,
        place_name: '',
        note: '',
      },
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      periods: ['Morning', 'Evening'],
    }
  },
  computed: {
    filteredGroups() {
      return this.groups.filter((group) => {
        if (this.form.department_id && group.department_id !== this.form.department_id) {
          return false
        }
        if (this.form.level_id && group.level_id !== this.form.level_id) {
          return false
        }
        return true
      })
    },
    filteredCourses() {
      return this.courses.filter((course) => {
        if (this.form.department_id && course.department_id !== this.form.department_id) {
          return false
        }
        if (this.form.level_id && course.level_id !== this.form.level_id) {
          return false
        }
        if (course.semester && course.semester !== this.selectedTerm) {
          return false
        }
        return true
      })
    },
    searchResults() {
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) {
        return this.exams
      }
      return this.exams.filter((exam) => {
        const courseName = exam.course?.name?.toLowerCase() || ''
        const courseCode = exam.course?.code?.toLowerCase() || ''
        const doctorName = exam.doctor?.name?.toLowerCase() || ''
        return (
          courseName.includes(query) || courseCode.includes(query) || doctorName.includes(query)
        )
      })
    },
  },
  watch: {
    selectedTerm() {
      this.form.term = this.selectedTerm
      if (this.activeTab === 'view' || this.activeTab === 'search') {
        this.fetchExams()
      }
    },
  },
  mounted() {
    this.loadReferenceData()
    this.fetchExams()
  },
  methods: {
    async loadReferenceData() {
      this.loading = true
      this.error = null

      try {
        const [departments, levels, groups, courses, doctors, rooms] = await Promise.all([
          api.get('/departments'),
          api.get('/levels'),
          api.get('/groups'),
          api.get('/courses'),
          api.get('/doctors'),
          api.get('/rooms'),
        ])

        this.departments = departments.data || []
        this.levels = levels.data || []
        this.groups = groups.data || []
        this.courses = courses.data || []
        this.doctors = (doctors.data || []).filter((user) => user.role === 'doctor')
        this.rooms = rooms.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to load reference data.'
      } finally {
        this.loading = false
      }
    },
    async fetchExams() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/final-exams', {
          params: { term: this.selectedTerm },
        })
        this.exams = response.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to load final exams.'
      } finally {
        this.loading = false
      }
    },
    async submitExam() {
      this.saving = true
      this.error = null
      const payload = { ...this.form, term: this.selectedTerm }
      try {
        if (this.editMode && this.editingExamId) {
          await api.put(`/final-exams/${this.editingExamId}`, payload)
        } else {
          await api.post('/final-exams', payload)
        }
        await this.fetchExams()
        this.resetForm()
        this.activeTab = 'view'
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to save exam.'
      } finally {
        this.saving = false
      }
    },
    editExam(exam) {
      this.activeTab = 'add'
      this.editMode = true
      this.editingExamId = exam.id
      this.selectedTerm = exam.term || this.selectedTerm
      this.form = {
        term: exam.term || this.selectedTerm,
        department_id: exam.course?.department_id || null,
        level_id: exam.course?.level_id || null,
        group_id: exam.group_id || null,
        course_id: exam.course_id || null,
        day: exam.day || 'Sunday',
        exam_date: exam.exam_date || '',
        period: exam.period || 'Morning',
        doctor_id: exam.doctor_id || null,
        room_id: exam.room_id || null,
        place_name: exam.place_name || '',
        note: exam.note || '',
      }
    },
    async deleteExam(id) {
      const confirmDelete = window.confirm('Are you sure you want to delete this exam?')
      if (!confirmDelete) {
        return
      }
      this.saving = true
      this.error = null
      try {
        await api.delete(`/final-exams/${id}`)
        await this.fetchExams()
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to delete exam.'
      } finally {
        this.saving = false
      }
    },
    resetForm() {
      this.editMode = false
      this.editingExamId = null
      this.form = {
        term: this.selectedTerm,
        department_id: null,
        level_id: null,
        group_id: null,
        course_id: null,
        day: 'Sunday',
        exam_date: '',
        period: 'Morning',
        doctor_id: null,
        room_id: null,
        place_name: '',
        note: '',
      }
    },
    setActiveTab(tab) {
      this.activeTab = tab
      if (tab === 'view' || tab === 'search') {
        this.fetchExams()
      }
    },
    formatDate(value) {
      return value || '-'
    },
  },
}
</script>

<style scoped>
.final-exams-page {
  min-height: 100vh;
  padding: 2rem 1.5rem 3rem;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.1), transparent 24%),
    linear-gradient(180deg, #03121f 0%, #071b34 100%);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.75rem 1.5rem;
  border-radius: 1.75rem;
  background: rgba(6, 20, 44, 0.95);
  border: 1px solid rgba(255, 215, 103, 0.16);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
}

.page-header .badge {
  display: inline-flex;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: rgba(255, 215, 103, 0.14);
  color: #ffe5a7;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  font-size: 0.85rem;
}

.page-header h1 {
  margin: 0.35rem 0 0;
  font-size: clamp(2rem, 2.5vw, 2.6rem);
  color: #ffe7a8;
}

.term-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.term-selector label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.9rem;
}

.term-selector select {
  min-width: 220px;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.alert {
  margin-top: 1.5rem;
  padding: 1rem 1.2rem;
  border-radius: 1rem;
  background: rgba(219, 68, 68, 0.12);
  border: 1px solid rgba(219, 68, 68, 0.2);
  color: #ffd6d6;
}

.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.tab-button {
  padding: 0.9rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f2e9;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button.active {
  background: rgba(255, 215, 103, 0.18);
  border-color: rgba(255, 215, 103, 0.4);
  color: #08101b;
}

.tab-panel {
  margin-top: 1.75rem;
  padding: 1.75rem;
  border-radius: 1.75rem;
  background: rgba(8, 24, 52, 0.96);
  border: 1px solid rgba(255, 215, 103, 0.12);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.field-group {
  display: grid;
  gap: 0.55rem;
}

.field-group.full-width {
  grid-column: 1 / -1;
}

.field-group label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
}

.field-group input,
.field-group select {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.submit-button,
.reset-button,
.refresh-button,
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.9rem 1.15rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 215, 103, 0.2);
  background: rgba(255, 215, 103, 0.14);
  color: #08101b;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.reset-button {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f2e9;
}

.action-button.delete {
  background: rgba(219, 68, 68, 0.18);
  color: #ffe6e6;
  border-color: rgba(219, 68, 68, 0.3);
}

.table-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.search-row {
  margin-bottom: 1rem;
}

.search-row input {
  width: 100%;
  max-width: 380px;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.data-table th,
.data-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.data-table th {
  text-align: left;
  color: #fbd77a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.9rem;
}

.data-table td {
  color: rgba(245, 242, 233, 0.86);
}

.empty-state {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}

@media (max-width: 960px) {
  .data-table {
    min-width: 100%;
  }
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    padding: 1.25rem;
  }
}
</style>
