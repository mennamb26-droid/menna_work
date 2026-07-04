<template>
  <section class="admin-dashboard">
    <header class="dashboard-header">
      <div>
        <p class="badge">Admin</p>
        <h1>Admin Dashboard</h1>
        <p class="subtitle">College Scheduling System</p>
      </div>
    </header>

    <div v-if="loading" class="status">Loading dashboard...</div>
    <div v-if="warning" class="status warning">{{ warning }}</div>

    <section>
      <section class="stats-grid">
        <article class="stat-card">
          <p class="stat-label">Courses</p>
          <p class="stat-value">{{ courses.length }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Departments</p>
          <p class="stat-value">{{ departments.length }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Levels</p>
          <p class="stat-value">{{ levels.length }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Groups</p>
          <p class="stat-value">{{ groups.length }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Rooms</p>
          <p class="stat-value">{{ rooms.length }}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Schedules</p>
          <p class="stat-value">{{ schedules.length }}</p>
        </article>
      </section>

      <section class="tabs-panel">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-button', { active: activeTab === tab.key }]"
            @click="setActiveTab(tab.key)"
            type="button"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <div class="table-toolbar">
            <label class="search-group">
              Search
              <input type="search" v-model="searchQuery" :placeholder="`Search ${activeLabel}`" />
            </label>
          </div>

          <table class="dashboard-table" v-if="filteredRows.length">
            <thead>
              <tr>
                <th v-for="header in activeHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredRows" :key="item.id || item.name || item.code">
                <td v-for="field in activeFields" :key="field">
                  <span v-if="field === 'course_id'">{{ getCourseName(item.course_id) }}</span>
                  <span v-else-if="field === 'room_id'">{{ getRoomName(item.room_id) }}</span>
                  <span v-else-if="field === 'group_id'">{{ getGroupName(item.group_id) }}</span>
                  <span v-else>{{ formatValue(item[field]) }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" v-else>No {{ activeLabel.toLowerCase() }} available.</div>
        </div>
      </section>
    </section>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'HomeView',
  data() {
    return {
      activeTab: 'courses',
      searchQuery: '',
      tabs: [
        { key: 'courses', label: 'Courses' },
        { key: 'departments', label: 'Departments' },
        { key: 'levels', label: 'Levels' },
        { key: 'groups', label: 'Groups' },
        { key: 'rooms', label: 'Rooms' },
        { key: 'schedules', label: 'Schedules' },
      ],
      courses: [],
      departments: [],
      levels: [],
      groups: [],
      rooms: [],
      schedules: [],
      loading: false,
      error: null,
      warning: null,
      headersMap: {
        courses: ['ID', 'Name', 'Code', 'Credit Hours', 'Department ID', 'Level ID'],
        departments: ['ID', 'Name'],
        levels: ['ID', 'Name'],
        groups: ['ID', 'Name', 'Department ID', 'Level ID', 'Students Count'],
        rooms: ['ID', 'Name'],
        schedules: [
          'ID',
          'Course',
          'Room',
          'Group',
          'Day',
          'Start Time',
          'End Time',
          'Type',
          'Note',
        ],
      },
      fieldsMap: {
        courses: ['id', 'name', 'code', 'credit_hours', 'department_id', 'level_id'],
        departments: ['id', 'name'],
        levels: ['id', 'name'],
        groups: ['id', 'name', 'department_id', 'level_id', 'students_count'],
        rooms: ['id', 'name'],
        schedules: [
          'id',
          'course_id',
          'room_id',
          'group_id',
          'day',
          'start_time',
          'end_time',
          'type',
          'note',
        ],
      },
    }
  },
  computed: {
    activeRows() {
      return this[this.activeTab] || []
    },
    activeHeaders() {
      return this.headersMap[this.activeTab] || []
    },
    activeFields() {
      return this.fieldsMap[this.activeTab] || []
    },
    activeLabel() {
      const active = this.tabs.find((tab) => tab.key === this.activeTab)
      return active ? active.label : 'Records'
    },
    filteredRows() {
      const search = this.searchQuery.trim().toLowerCase()
      if (!search) {
        return this.activeRows
      }

      return this.activeRows.filter((item) => {
        return this.activeFields.some((field) => {
          let value = item[field]

          if (field === 'course_id') {
            value = this.getCourseName(item.course_id)
          } else if (field === 'room_id') {
            value = this.getRoomName(item.room_id)
          } else if (field === 'group_id') {
            value = this.getGroupName(item.group_id)
          }

          if (value === null || value === undefined) {
            return false
          }

          return String(value).toLowerCase().includes(search)
        })
      })
    },
  },
  async mounted() {
    this.loading = true
    this.error = null
    this.warning = null

    const results = await Promise.allSettled([
      this.fetchDepartments(),
      this.fetchLevels(),
      this.fetchCourses(),
      this.fetchRooms(),
      this.fetchGroups(),
      this.fetchSchedules(),
    ])

    const failedCount = results.filter((result) => result.status === 'rejected').length
    if (failedCount > 0) {
      this.warning = 'Some dashboard data could not be loaded. Counts may be incomplete.'
    }

    this.loading = false
  },
  methods: {
    setActiveTab(tabKey) {
      this.activeTab = tabKey
      this.searchQuery = ''
    },
    async fetchDepartments() {
      const response = await api.get('/departments')
      this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async fetchLevels() {
      const response = await api.get('/levels')
      this.levels = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async fetchCourses() {
      const response = await api.get('/courses')
      this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async fetchRooms() {
      const response = await api.get('/rooms')
      this.rooms = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async fetchGroups() {
      const response = await api.get('/groups')
      this.groups = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async fetchSchedules() {
      const response = await api.get('/schedules')
      this.schedules = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    formatValue(value) {
      if (value === null || value === undefined) {
        return '-'
      }
      return value
    },
    getCourseName(courseId) {
      const course = this.courses.find((item) => item.id === courseId)
      return course ? course.name : `Course ${courseId}`
    },
    getRoomName(roomId) {
      const room = this.rooms.find((item) => item.id === roomId)
      return room ? room.name : `Room ${roomId}`
    },
    getGroupName(groupId) {
      const group = this.groups.find((item) => item.id === groupId)
      return group ? group.name : `Group ${groupId}`
    },
  },
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  min-height: 100vh;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.12), transparent 28%),
    linear-gradient(180deg, #061827 0%, #071b35 100%);
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.75rem;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.25);
  margin-bottom: 1.75rem;
}

.status {
  margin: 0 0 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f5f2e9;
}

.status.error {
  border-color: rgba(255, 80, 80, 0.35);
  background: rgba(89, 20, 20, 0.9);
  color: #ffdede;
}

.status.warning {
  border-color: rgba(250, 204, 21, 0.35);
  background: rgba(80, 63, 17, 0.9);
  color: #fff8d2;
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
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.dashboard-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.8rem);
}

.subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  position: relative;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.25);
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1.5rem;
  background: radial-gradient(circle at top left, rgba(255, 215, 103, 0.18), transparent 40%);
  pointer-events: none;
}

.stat-label {
  margin: 0 0 0.75rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stat-value {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  color: #ffffff;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tab-button {
  padding: 0.95rem 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: #f5f2e9;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-button.active {
  background: rgba(255, 215, 103, 0.18);
  border-color: rgba(255, 215, 103, 0.35);
  color: #fff;
}

.tab-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.tab-content {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  backdrop-filter: blur(14px);
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.search-group {
  display: grid;
  gap: 0.5rem;
  width: min(100%, 360px);
}

.search-group input {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f2e9;
}

.search-group input:focus {
  outline: none;
  border-color: rgba(255, 215, 103, 0.45);
  box-shadow: 0 0 0 4px rgba(255, 215, 103, 0.12);
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
}

.dashboard-table th,
.dashboard-table td {
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.dashboard-table th {
  background: rgba(255, 255, 255, 0.06);
  color: #f9e8ae;
  font-weight: 700;
}

.dashboard-table td {
  color: rgba(245, 242, 233, 0.92);
}

.dashboard-table tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.dashboard-table tr:hover {
  background: rgba(255, 215, 103, 0.08);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: rgba(245, 242, 233, 0.74);
}

@media (max-width: 850px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .table-toolbar {
    justify-content: center;
  }
}
</style>
