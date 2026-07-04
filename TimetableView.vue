<template>
  <section class="timetable-page">
    <header class="page-header">
      <div>
        <p class="badge">Student</p>
        <h1>Student Dashboard</h1>
        <p class="subtitle">Review your timetable and exam schedule.</p>
      </div>
    </header>

    <div v-if="loading" class="status">Loading student dashboard...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <div v-else>
      <section class="dashboard-actions">
        <button
          type="button"
          class="mode-card"
          :class="{ active: mode === 'exam-schedule' }"
          @click="selectMode('exam-schedule')"
        >
          <h2>Exam Schedule</h2>
          <p>View your exam timetable for the selected filters.</p>
        </button>

        <button
          type="button"
          class="mode-card"
          :class="{ active: mode === 'lectures-schedule' }"
          @click="selectMode('lectures-schedule')"
        >
          <h2>Lectures & Sections</h2>
          <p>View lectures and sections matching your selection.</p>
        </button>
      </section>

      <section class="filters-panel">
        <div class="selection-card">
          <div class="filter-item">
            <label>
              Regulation
              <select v-model="selectedRegulation" :disabled="isStudent && userProfile?.regulation_id">
                <option value="">All regulations</option>
                <option v-for="reg in regulations" :key="reg.id" :value="reg.value">
                  {{ reg.label || reg.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-item">
            <label>
              Department
              <select
                v-model="selectedDepartment"
                @change="resetGroup"
                :disabled="isStudent && userProfile?.department_id"
              >
                <option value="">All departments</option>
                <option v-for="department in departments" :key="department.id" :value="department.id">
                  {{ department.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-item">
            <label>
              Program
              <select v-model="selectedProgram" :disabled="isStudent && userProfile?.program_id">
                <option value="">All programs</option>
                <option v-for="program in programs" :key="program.id" :value="program.id">
                  {{ program.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-item">
            <label>
              Level
              <select
                v-model="selectedLevel"
                @change="resetGroup"
                :disabled="isStudent && userProfile?.level_id"
              >
                <option value="">All levels</option>
                <option v-for="level in levels" :key="level.id" :value="level.id">
                  {{ level.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-item">
            <label>
              Group
              <select v-model="selectedGroup" :disabled="isStudent && userProfile?.group_id">
                <option value="">All groups</option>
                <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-item">
            <label>
              Semester
              <select v-model="selectedSemester">
                <option value="">Select semester</option>
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
                <option value="Summer Semester">Summer Semester</option>
              </select>
            </label>
          </div>

          <div class="filter-actions">
            <button
              class="button-primary"
              type="button"
              @click="viewStudentSchedule"
              :disabled="!selectedSemester || scheduleLoading"
            >
              View Schedule
            </button>
            <button class="button-secondary" type="button" @click="resetSchedule">Reset</button>
            <button class="button-secondary" type="button" @click="printSchedule">Print</button>
          </div>
        </div>
      </section>

      <section v-if="scheduleLoading" class="status">Loading schedule...</section>
      <section v-else-if="scheduleError" class="status error">{{ scheduleError }}</section>
      <section v-else-if="displayResults && noResults" class="status">
        <div>No schedule found for the selected filters.</div>
        <div v-if="scheduleDebug" class="status info" style="margin-top:0.75rem;">
          <div><strong>Selected filters:</strong></div>
          <div>
            Regulation: {{ scheduleDebug.selected_filters.regulation || scheduleDebug.selected_filters.regulation_id || 'N/A' }},
            Department ID: {{ scheduleDebug.selected_filters.department_id || 'N/A' }},
            Level ID: {{ scheduleDebug.selected_filters.level_id || 'N/A' }},
            Semester: {{ scheduleDebug.selected_filters.semester || 'N/A' }},
            Group ID: {{ scheduleDebug.selected_filters.group_id || 'N/A' }}
          </div>
          <div style="margin-top:0.5rem;">
            Matching lectures: {{ scheduleDebug.matching_lectures_count }},
            Matching sections: {{ scheduleDebug.matching_sections_count }}
          </div>
        </div>
      </section>

      <section v-if="displayResults && lectureSchedules.length > 0" class="schedule-section">
        <div class="section-title">Lecture Schedule</div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Start</th>
              <th>End</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Room</th>
              <th>Doctor</th>
              <th>Group</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in lectureSchedules" :key="`lecture-${schedule.id}`">
              <td>{{ schedule.day || '-' }}</td>
              <td>{{ schedule.start_time || '-' }}</td>
              <td>{{ schedule.end_time || '-' }}</td>
              <td>{{ schedule.course?.code || '-' }}</td>
              <td>{{ schedule.course?.name || '-' }}</td>
              <td>{{ schedule.room?.name || schedule.room?.place || '-' }}</td>
              <td>{{ schedule.doctor?.name || 'Unassigned' }}</td>
              <td>{{ schedule.group?.name || '-' }}</td>
              <td>{{ schedule.semester || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="displayResults && sectionSchedules.length > 0" class="schedule-section">
        <div class="section-title">Section Schedule</div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Start</th>
              <th>End</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Room</th>
              <th>Doctor</th>
              <th>Group</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in sectionSchedules" :key="`section-${schedule.id}`">
              <td>{{ schedule.day || '-' }}</td>
              <td>{{ schedule.start_time || '-' }}</td>
              <td>{{ schedule.end_time || '-' }}</td>
              <td>{{ schedule.course?.code || '-' }}</td>
              <td>{{ schedule.course?.name || '-' }}</td>
              <td>{{ schedule.room?.name || schedule.room?.place || '-' }}</td>
              <td>{{ schedule.doctor?.name || 'Unassigned' }}</td>
              <td>{{ schedule.group?.name || '-' }}</td>
              <td>{{ schedule.semester || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="displayResults && examSchedules.length > 0" class="schedule-section">
        <div class="section-title">Exam Schedule</div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Type</th>
              <th>Group</th>
              <th>Day</th>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in examSchedules" :key="`exam-${schedule.id}`">
              <td>{{ schedule.course?.code || '-' }}</td>
              <td>{{ schedule.course?.name || '-' }}</td>
              <td>{{ schedule.exam_type || '-' }}</td>
              <td>{{ schedule.group?.name || '-' }}</td>
              <td>{{ schedule.day || '-' }}</td>
              <td>{{ schedule.exam_date || '-' }}</td>
              <td>{{ schedule.start_time || '-' }}</td>
              <td>{{ schedule.end_time || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'TimetableView',
  data() {
    return {
      departments: [],
      levels: [],
      groups: [],
      regulations: [],
      programs: [],
      lectureSchedules: [],
      sectionSchedules: [],
      examSchedules: [],
      selectedRegulation: '',
      selectedProgram: '',
      selectedDepartment: '',
      selectedLevel: '',
      selectedGroup: '',
      selectedSemester: '',
      mode: '',
      displayResults: false,
      loading: false,
      error: null,
      scheduleLoading: false,
      scheduleError: null,
      scheduleDebug: null,
      userProfile: null,
    }
  },
  computed: {
    filteredGroups() {
      if (!this.selectedDepartment && !this.selectedLevel && !this.selectedRegulation) {
        return this.groups
      }

      return this.groups.filter((group) => {
        const matchesDepartment = this.selectedDepartment
          ? group.department_id === Number(this.selectedDepartment)
          : true
        const matchesLevel = this.selectedLevel
          ? group.level_id === Number(this.selectedLevel)
          : true
        const matchesRegulation = this.selectedRegulationId
          ? group.regulation_id === this.selectedRegulationId
          : true

        return matchesDepartment && matchesLevel && matchesRegulation
      })
    },
    selectedRegulationId() {
      if (!this.selectedRegulation) return null
      const found = this.regulations.find((reg) => reg.value === this.selectedRegulation)
      return found ? found.id : null
    },
    noResults() {
      return (
        this.displayResults &&
        this.lectureSchedules.length === 0 &&
        this.sectionSchedules.length === 0 &&
        this.examSchedules.length === 0
      )
    },
    isStudent() {
      return this.userProfile?.role === 'student'
    },
  },
  mounted() {
    this.initialize()
  },
  methods: {
    async initialize() {
      this.loading = true
      this.error = null
      this.loadUserProfile()

      try {
        await Promise.all([
          this.loadRegulations(),
          this.loadDepartments(),
          this.loadPrograms(),
          this.loadLevels(),
          this.loadGroups(),
        ])
      } catch (err) {
        console.error(err)
        this.error = 'Unable to load student dashboard data. Please try again.'
      } finally {
        this.loading = false
      }
    },
    loadUserProfile() {
      const rawUser = localStorage.getItem('user')
      if (!rawUser) {
        this.userProfile = null
        return
      }

      try {
        this.userProfile = JSON.parse(rawUser)
      } catch (err) {
        console.error('Unable to parse stored user profile.', err)
        this.userProfile = null
      }
    },
    selectMode(view) {
      this.mode = view
      this.displayResults = false
      this.scheduleError = null
      if (view === 'exam-schedule') {
        this.examSchedules = []
      }
      if (view === 'lectures-schedule') {
        this.lectureSchedules = []
        this.sectionSchedules = []
      }
    },
    resetGroup() {
      this.selectedGroup = ''
      this.displayResults = false
      this.scheduleError = null
    },
    resetSchedule() {
      this.selectedRegulation = ''
      this.selectedDepartment = ''
      this.selectedProgram = ''
      this.selectedLevel = ''
      this.selectedGroup = ''
      this.selectedSemester = ''
      this.displayResults = false
      this.scheduleError = null
      this.lectureSchedules = []
      this.sectionSchedules = []
      this.examSchedules = []
    },
    printSchedule() {
      window.print()
    },
    async loadRegulations() {
      const response = await api.get('/regulations')
      this.regulations = Array.isArray(response.data) ? response.data : response.data.data || []
      if (this.userProfile?.regulation_id) {
        const match = this.regulations.find((reg) => reg.id === this.userProfile.regulation_id)
        if (match) {
          this.selectedRegulation = match.value
        }
      }
    },
    async loadPrograms() {
      const response = await api.get('/programs')
      this.programs = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadDepartments() {
      const response = await api.get('/departments')
      this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadLevels() {
      const response = await api.get('/levels')
      this.levels = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadGroups() {
      const response = await api.get('/groups')
      this.groups = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async viewStudentSchedule() {
      this.scheduleLoading = true
      this.scheduleError = null
      this.displayResults = false
      this.lectureSchedules = []
      this.sectionSchedules = []
      this.examSchedules = []

      try {
        const params = {}
        if (this.selectedRegulationId) params.regulation_id = this.selectedRegulationId
        else if (this.selectedRegulation) params.regulation = this.selectedRegulation
        if (this.selectedDepartment) params.department_id = this.selectedDepartment
        if (this.selectedProgram) params.program_id = this.selectedProgram
        if (this.selectedLevel) params.level_id = this.selectedLevel
        if (this.selectedGroup) params.group_id = this.selectedGroup
        if (this.selectedSemester) params.semester = this.selectedSemester

        const response = await api.get('/student-schedule', { params })
        const payload = Array.isArray(response.data) ? response.data : response.data.data || response.data || {}

        this.lectureSchedules = payload.lectures || []
        this.sectionSchedules = payload.sections || []
        this.examSchedules = payload.exams || []
        this.scheduleDebug = payload.debug || null
        this.displayResults = true
      } catch (err) {
        console.error(err)
        this.scheduleError = 'Unable to load the student schedule. Please try again.'
      } finally {
        this.scheduleLoading = false
      }
    },
  },
}
</script>
<style scoped>
.timetable-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  min-height: 100vh;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.12), transparent 28%),
    linear-gradient(180deg, #061827 0%, #071b35 100%);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.75rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
  margin-bottom: 1.75rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(216, 171, 37, 0.18);
  color: #f2d78d;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.8rem);
}

.subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1rem;
}

.status {
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f5f2e9;
}

.status.error {
  background: rgba(80, 15, 15, 0.9);
  border-color: rgba(255, 96, 96, 0.25);
  color: #ffdede;
}

.status.info {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  color: #f5f2e9;
}

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.mode-card {
  display: grid;
  gap: 0.8rem;
  padding: 1.5rem;
  text-align: left;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.mode-card:hover {
  transform: translateY(-1px);
}

.mode-card.active {
  border-color: rgba(216, 171, 37, 0.5);
  background: rgba(216, 171, 37, 0.12);
}

.mode-card h2 {
  margin: 0;
  font-size: 1.15rem;
}

.mode-card p {
  margin: 0;
  color: rgba(245, 242, 233, 0.8);
}

.filters-panel {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.selection-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
}

.filter-item {
  display: grid;
  gap: 0.75rem;
}

.filter-item label {
  display: grid;
  gap: 0.5rem;
  color: rgba(245, 242, 233, 0.88);
  font-weight: 600;
}

.filter-item select {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f2e9;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  padding: 0.95rem 1.25rem;
  border-radius: 1rem;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.button-primary {
  background: linear-gradient(135deg, #d9b153, #f8e4a3);
  color: #08101b;
}

.button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f2e9;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.schedule-panel {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.16);
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table th,
.schedule-table td {
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.schedule-table th {
  background: rgba(255, 255, 255, 0.06);
  color: #f9e8ae;
  font-weight: 700;
}

.schedule-table td {
  color: rgba(245, 242, 233, 0.92);
}

.schedule-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.schedule-table tr:hover {
  background: rgba(255, 215, 103, 0.08);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: rgba(245, 242, 233, 0.74);
}

@media (max-width: 980px) {
  .dashboard-actions,
  .selection-card {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .button-primary,
  .button-secondary {
    width: 100%;
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
