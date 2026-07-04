<template>
  <section class="admin-dashboard">
    <header class="dashboard-header">
      <div>
        <p class="badge">Admin</p>
        <h1>Admin Dashboard</h1>
        <p class="subtitle">College Scheduling System</p>
      </div>
      <div class="header-actions">
        <button class="button-primary" type="button" @click="fetchDashboard" :disabled="loading">
          {{ loading ? 'Refreshing...' : 'Refresh dashboard' }}
        </button>
        <router-link to="/schedules" class="button-secondary">Go to Schedules</router-link>
      </div>
    </header>

    <div v-if="error" class="alert">{{ error }}</div>

    <section v-if="dashboardLoaded" class="stats-grid">
      <article
        v-for="(value, key) in counts"
        :key="key"
        class="stat-card"
        :class="{ active: activeTab === key }"
        @click="setActiveTab(key)"
      >
        <p class="stat-label">{{ titleCase(key) }}</p>
        <p class="stat-value">{{ value }}</p>
      </article>
    </section>

    <section v-if="dashboardLoaded" class="dashboard-main">
      <div class="tabs-row">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          type="button"
          @click="setActiveTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="filters">
        <div class="search-group">
          <label for="admin-search">Search</label>
          <input
            id="admin-search"
            type="search"
            v-model="searchQuery"
            placeholder="Search current tab"
          />
        </div>
      </div>

      <div class="table-container" v-if="activeRows.length">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th v-for="header in activeHeaders" :key="header">{{ header }}</th>
              <th v-if="activeTab === 'schedule_conflicts' || activeTab === 'schedules'">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in activeRows" :key="item.id || item.name || item.email">
              <td v-for="field in activeFields" :key="field">
                {{ renderValue(item, field) }}
              </td>
              <td v-if="activeTab === 'schedule_conflicts'">
                <button
                  class="button-secondary"
                  type="button"
                  @click="openRequestChangeModal(item, 'change')"
                >
                  Request Change
                </button>
                <button
                  class="button-secondary"
                  type="button"
                  @click="openRequestChangeModal(item, 'edit')"
                >
                  Edit Preference
                </button>
                <button
                  class="button-secondary"
                  type="button"
                  @click="updateConflictStatus(item, 'resolved')"
                >
                  Mark Resolved
                </button>
                <button
                  class="button-secondary"
                  type="button"
                  @click="updateConflictStatus(item, 'ignored')"
                >
                  Ignore
                </button>
              </td>
              <td v-if="activeTab === 'schedules'">
                <button class="button-secondary" type="button" @click="openScheduleEditModal(item)">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" v-else>No {{ activeTab }} available.</div>

      <div class="modal-backdrop" v-if="showRequestChangeModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>
              {{
                activeConflict
                  ? requestChangeForm.message &&
                    requestChangeForm.message.startsWith('Please update')
                    ? 'Edit Preference'
                    : 'Request Change from Doctor'
                  : 'Request Change'
              }}
            </h3>
            <button type="button" class="close-button" @click="closeRequestChangeModal">×</button>
          </header>

          <div class="modal-content">
            <label>
              Doctor
              <select v-model="requestChangeForm.doctor_id" required>
                <option value="" disabled>Select doctor</option>
                <option
                  v-for="doctor in sortedDoctorsForConflict(activeConflict || {})"
                  :key="doctor.id"
                  :value="String(doctor.id)"
                >
                  {{ doctor.name }}
                </option>
              </select>
            </label>

            <label>
              Message
              <textarea
                v-model="requestChangeForm.message"
                required
                placeholder="Describe the requested change"
              ></textarea>
            </label>

            <div class="modal-actions">
              <button
                type="button"
                class="button-primary"
                @click="sendRequestChange"
                :disabled="
                  sendingRequestChange || !requestChangeForm.doctor_id || !requestChangeForm.message
                "
              >
                {{ sendingRequestChange ? 'Sending...' : 'Send' }}
              </button>
              <button type="button" class="button-secondary" @click="closeRequestChangeModal">
                Cancel
              </button>
            </div>

            <div class="status-messages">
              <p class="success" v-if="requestChangeSuccess">{{ requestChangeSuccess }}</p>
              <p class="error" v-if="requestChangeError">{{ requestChangeError }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-backdrop" v-if="showScheduleEditModal">
        <div class="modal-card">
          <header class="modal-header">
            <h3>Edit Schedule</h3>
            <button type="button" class="close-button" @click="closeScheduleEditModal">×</button>
          </header>

          <div class="modal-content">
            <div class="form-grid">
              <label>
                Course
                <select v-model="scheduleForm.course_id" required>
                  <option value="" disabled>Select course</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }} ({{ course.code }})
                  </option>
                </select>
              </label>

              <label>
                Doctor
                <select v-model="scheduleForm.doctor_id" required @change="loadDoctorAvailability">
                  <option value="" disabled>Select doctor</option>
                  <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                    {{ doctor.name }}
                  </option>
                </select>
              </label>

              <label>
                Group
                <select v-model="scheduleForm.group_id" required>
                  <option value="" disabled>Select group</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </label>

              <label>
                Type
                <select v-model="scheduleForm.type" required>
                  <option value="" disabled>Select type</option>
                  <option value="lecture">Lecture</option>
                  <option value="section">Section</option>
                </select>
              </label>

              <label>
                Delivery Mode
                <select
                  v-model="scheduleForm.delivery_mode"
                  required
                  @change="onDeliveryModeChange"
                >
                  <option value="" disabled>Select mode</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </label>

              <label v-if="scheduleForm.delivery_mode === 'offline'">
                Room
                <select v-model="scheduleForm.room_id" required>
                  <option value="" disabled>Select room</option>
                  <option v-for="room in filteredRooms" :key="room.id" :value="room.id">
                    {{ room.name }} ({{ room.type }})
                  </option>
                </select>
              </label>

              <label v-if="scheduleForm.delivery_mode === 'online'">
                Place
                <input type="text" value="Online" readonly />
              </label>

              <label>
                Day
                <select v-model="scheduleForm.day" required>
                  <option value="" disabled>Select day</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                </select>
              </label>

              <label>
                Start Time
                <input type="time" v-model="scheduleForm.start_time" required />
              </label>

              <label>
                End Time
                <input type="time" v-model="scheduleForm.end_time" required />
              </label>

              <label>
                Semester
                <select v-model="scheduleForm.semester" required>
                  <option value="" disabled>Select semester</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                  <option value="Summer Semester">Summer Semester</option>
                </select>
              </label>
            </div>

            <label v-if="availabilityWarning" class="warning-message">
              ⚠️ Selected time is outside doctor's availability. Please provide override reason.
            </label>

            <label>
              Override Reason
              <textarea
                v-model="scheduleForm.override_reason"
                :required="availabilityWarning"
                placeholder="Required if time is outside availability"
              ></textarea>
            </label>

            <div class="availability-display" v-if="doctorAvailabilities.length">
              <h4>Doctor Availability for {{ scheduleForm.semester }}</h4>
              <div class="availability-list">
                <div
                  v-for="avail in doctorAvailabilities"
                  :key="avail.id"
                  class="availability-item"
                  :class="{ matches: isTimeInAvailability(avail) }"
                >
                  {{ avail.day }}: {{ avail.start_time }} - {{ avail.end_time }} ({{
                    avail.delivery_mode
                  }})
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="button-primary"
                @click="saveSchedule"
                :disabled="savingSchedule || (availabilityWarning && !scheduleForm.override_reason)"
              >
                {{ savingSchedule ? 'Saving...' : 'Save Schedule' }}
              </button>
              <button type="button" class="button-secondary" @click="closeScheduleEditModal">
                Cancel
              </button>
            </div>

            <div class="status-messages">
              <p class="success" v-if="scheduleSuccess">{{ scheduleSuccess }}</p>
              <p class="error" v-if="scheduleError">{{ scheduleError }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="empty-state" v-if="!dashboardLoaded && !loading">No dashboard data loaded yet.</div>
    <div class="empty-state" v-if="loading">Loading dashboard data...</div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      loading: false,
      dashboardLoaded: false,
      error: null,
      activeTab: 'courses',
      searchQuery: '',
      counts: {
        courses: 0,
        users: 0,
        departments: 0,
        programs: 0,
        groups: 0,
        doctors: 0,
        rooms: 0,
        schedules: 0,
        exam_schedules: 0,
        schedule_conflicts: 0,
      },
      dataItems: {
        courses: [],
        users: [],
        departments: [],
        programs: [],
        groups: [],
        doctors: [],
        rooms: [],
        schedules: [],
        exam_schedules: [],
        schedule_conflicts: [],
      },
      preferences: [],
      showRequestChangeModal: false,
      activeConflict: null,
      requestChangeForm: {
        doctor_id: '',
        message: '',
      },
      requestChangeError: null,
      requestChangeSuccess: null,
      showScheduleEditModal: false,
      editingSchedule: null,
      scheduleForm: {
        course_id: '',
        doctor_id: '',
        group_id: '',
        type: '',
        delivery_mode: '',
        room_id: '',
        day: '',
        start_time: '',
        end_time: '',
        semester: '',
        override_reason: '',
      },
      doctorAvailabilities: [],
      availabilityWarning: false,
      savingSchedule: false,
      scheduleError: null,
      scheduleSuccess: null,
      tabs: [
        { key: 'courses', label: 'Courses' },
        { key: 'programs', label: 'Programs' },
        { key: 'users', label: 'Users' },
        { key: 'departments', label: 'Departments' },
        { key: 'groups', label: 'Groups' },
        { key: 'doctors', label: 'Doctors' },
        { key: 'rooms', label: 'Rooms' },
        { key: 'schedules', label: 'Schedules' },
        { key: 'exam_schedules', label: 'Exam Schedules' },
        { key: 'schedule_conflicts', label: 'Conflicts' },
      ],
      headersMap: {
        courses: ['ID', 'Name', 'Code', 'Department', 'Level'],
        programs: ['ID', 'Name', 'Code', 'Type', 'Department'],
        users: ['ID', 'Name', 'Email', 'Role'],
        departments: ['ID', 'Name'],
        groups: ['ID', 'Name', 'Department', 'Level'],
        doctors: ['ID', 'Name', 'Email'],
        rooms: ['ID', 'Name', 'Type', 'Department', 'Capacity', 'General', 'Active'],
        schedules: [
          'Course',
          'Type',
          'Delivery Mode',
          'Group',
          'Place',
          'Day',
          'Start Time',
          'End Time',
          'Semester',
        ],
        exam_schedules: [
          'Course',
          'Group',
          'Room',
          'Doctor',
          'Exam Date',
          'Start Time',
          'End Time',
          'Semester',
        ],
        schedule_conflicts: [
          'ID',
          'Course',
          'Doctor',
          'Type',
          'Semester',
          'Reason',
          'Attempted Preferences',
          'Status',
        ],
      },
      fieldsMap: {
        courses: ['id', 'name', 'code', 'department', 'level'],
        programs: ['id', 'name', 'code', 'type', 'department'],
        users: ['id', 'name', 'email', 'role'],
        departments: ['id', 'name'],
        groups: ['id', 'name', 'department', 'level'],
        doctors: ['id', 'name', 'email'],
        rooms: ['id', 'name', 'type', 'department', 'capacity', 'is_general', 'is_active'],
        schedules: [
          'course',
          'type',
          'delivery_mode',
          'group',
          'place',
          'day',
          'start_time',
          'end_time',
          'semester',
        ],
        exam_schedules: [
          'course',
          'group',
          'room',
          'doctor',
          'exam_date',
          'start_time',
          'end_time',
          'semester',
        ],
        schedule_conflicts: [
          'id',
          'course',
          'doctor',
          'type',
          'semester',
          'description',
          'attempted_preferences',
          'status',
        ],
      },
      levels: [],
      departments: [],
    }
  },
  computed: {
    activeHeaders() {
      return this.headersMap[this.activeTab] || []
    },
    activeFields() {
      return this.fieldsMap[this.activeTab] || []
    },
    activeRows() {
      const rows = this.dataItems[this.activeTab] || []
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) {
        return rows
      }
      return rows.filter((item) => {
        return this.activeFields.some((field) => {
          const value = String(this.renderValue(item, field)).toLowerCase()
          return value.includes(query)
        })
      })
    },
    filteredRooms() {
      return this.dataItems.rooms.filter((room) => room.is_active)
    },
  },
  mounted() {
    this.fetchDashboard()
  },
  methods: {
    async fetchDashboard() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/admin-dashboard')
        const payload = response.data || {}

        this.counts = {
          courses: payload.counts?.courses || 0,
          users: payload.counts?.users || 0,
          departments: payload.counts?.departments || 0,
          programs: payload.counts?.programs || 0,
          groups: payload.counts?.groups || 0,
          doctors: payload.counts?.doctors || 0,
          rooms: payload.counts?.rooms || 0,
          schedules: payload.counts?.schedules || 0,
          exam_schedules: payload.counts?.exam_schedules || 0,
          schedule_conflicts: payload.counts?.schedule_conflicts || 0,
        }

        this.dataItems = {
          courses: payload.data?.courses || [],
          users: payload.data?.users || [],
          departments: payload.data?.departments || [],
          programs: payload.data?.programs || [],
          groups: payload.data?.groups || [],
          doctors: payload.data?.doctors || [],
          rooms: payload.data?.rooms || [],
          schedules: payload.data?.schedules || [],
          exam_schedules: payload.data?.exam_schedules || [],
          schedule_conflicts: payload.data?.schedule_conflicts || [],
        }

        // Store levels and departments for dropdowns
        this.departments = payload.data?.departments || []
        this.levels = payload.data?.levels || []

        this.dashboardLoaded = true
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to load admin dashboard.'
      } finally {
        this.loading = false
      }
    },
    async fetchLevels() {
      try {
        const response = await api.get('/levels')
        this.levels = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error('Unable to load levels:', err)
        this.levels = []
      }
    },
    availablePreferences() {
      return []
    },
    getAttemptedPreferences(conflict) {
      return conflict.attempted_preferences || 'No attempted preferences'
    },
    openRequestChangeModal(conflict, mode = 'change') {
      this.activeConflict = conflict
      this.showRequestChangeModal = true
      this.requestChangeForm = {
        doctor_id: conflict.doctor_id || '',
        message:
          mode === 'edit' ? 'Please update the related teaching assignment for this conflict.' : '',
      }
      this.requestChangeError = null
      this.requestChangeSuccess = null
    },
    closeRequestChangeModal() {
      this.showRequestChangeModal = false
      this.activeConflict = null
      this.requestChangeForm = {
        doctor_id: '',
        message: '',
      }
      this.requestChangeError = null
      this.requestChangeSuccess = null
    },
    async sendRequestChange() {
      if (!this.activeConflict) {
        return
      }

      this.sendingRequestChange = true
      this.requestChangeError = null
      this.requestChangeSuccess = null

      try {
        await api.post(`/schedule-conflicts/${this.activeConflict.id}/request-change`, {
          doctor_id: this.requestChangeForm.doctor_id,
          message: this.requestChangeForm.message,
        })

        this.requestChangeSuccess = 'Request sent to doctor.'
        const index = this.dataItems.schedule_conflicts.findIndex(
          (item) => item.id === this.activeConflict.id,
        )
        if (index !== -1) {
          this.dataItems.schedule_conflicts[index].status = 'needs_doctor_action'
        }
      } catch (err) {
        this.requestChangeError = err.response?.data?.message || 'Unable to send request.'
      } finally {
        this.sendingRequestChange = false
      }
    },
    async updateConflictStatus(conflict, status) {
      try {
        await api.patch(`/schedule-conflicts/${conflict.id}`, {
          status,
        })
        conflict.status = status
      } catch (err) {
        console.error('Unable to update conflict status', err)
      }
    },
    sortedDoctorsForConflict(conflict) {
      return [...this.dataItems.doctors].sort((a, b) => {
        const aPrimary = a.id === conflict.doctor_id ? 0 : 1
        const bPrimary = b.id === conflict.doctor_id ? 0 : 1
        return aPrimary - bPrimary || a.name.localeCompare(b.name)
      })
    },
    setActiveTab(tabKey) {
      this.activeTab = tabKey
      this.searchQuery = ''
    },
    renderValue(item, field) {
      if (field === 'department') {
        return item.department?.name || '-'
      }
      if (field === 'program') {
        return item.program?.name || '-'
      }
      if (field === 'level') {
        return item.level?.name || '-'
      }
      if (field === 'course') {
        return item.course?.name || '-'
      }
      if (field === 'room') {
        return item.room?.name || '-'
      }
      if (field === 'group') {
        return item.group?.name || '-'
      }
      if (field === 'doctor') {
        return item.doctor?.name || item.name || '-'
      }
      if (field === 'place') {
        return item.delivery_mode === 'online' ? 'Online' : item.room?.name || '-'
      }
      if (field === 'type') {
        return item.type === 'section' ? 'Section' : 'Lecture'
      }
      if (field === 'delivery_mode') {
        return item.delivery_mode === 'online' ? 'Online' : 'Offline'
      }
      if (field === 'is_general') {
        return item.is_general ? 'Yes' : 'No'
      }
      if (field === 'is_active') {
        return item.is_active ? 'Yes' : 'No'
      }
      if (field === 'attempted_preferences') {
        return this.getAttemptedPreferences(item)
      }
      return item[field] === null || item[field] === undefined ? '-' : item[field]
    },
    titleCase(value) {
      return value.replace(/_/g, ' ').replace(/\b\w/g, (chr) => chr.toUpperCase())
    },
    openScheduleEditModal(schedule) {
      this.editingSchedule = schedule
      this.showScheduleEditModal = true
      this.scheduleForm = {
        course_id: schedule.course_id || '',
        doctor_id: schedule.doctor_id || '',
        group_id: schedule.group_id || '',
        type: schedule.type || '',
        delivery_mode: schedule.delivery_mode || '',
        room_id: schedule.room_id || '',
        day: schedule.day || '',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        semester: schedule.semester || '',
        override_reason: '',
      }
      this.doctorAvailabilities = []
      this.availabilityWarning = false
      this.scheduleError = null
      this.scheduleSuccess = null
      if (this.scheduleForm.doctor_id) {
        this.loadDoctorAvailability()
      }
    },
    closeScheduleEditModal() {
      this.showScheduleEditModal = false
      this.editingSchedule = null
      this.scheduleForm = {
        course_id: '',
        doctor_id: '',
        group_id: '',
        type: '',
        delivery_mode: '',
        room_id: '',
        day: '',
        start_time: '',
        end_time: '',
        semester: '',
        override_reason: '',
      }
      this.doctorAvailabilities = []
      this.availabilityWarning = false
      this.scheduleError = null
      this.scheduleSuccess = null
    },
    async loadDoctorAvailability() {
      if (!this.scheduleForm.doctor_id || !this.scheduleForm.semester) {
        this.doctorAvailabilities = []
        return
      }
      try {
        const response = await api.get(
          `/doctor-availabilities?doctor_id=${this.scheduleForm.doctor_id}&semester=${this.scheduleForm.semester}`,
        )
        this.doctorAvailabilities = response.data || []
        this.checkAvailabilityWarning()
      } catch (err) {
        console.error('Unable to load doctor availability', err)
        this.doctorAvailabilities = []
      }
    },
    checkAvailabilityWarning() {
      if (!this.scheduleForm.day || !this.scheduleForm.start_time || !this.scheduleForm.end_time) {
        this.availabilityWarning = false
        return
      }
      this.availabilityWarning = !this.doctorAvailabilities.some(
        (avail) =>
          avail.day === this.scheduleForm.day &&
          (avail.delivery_mode === this.scheduleForm.delivery_mode ||
            avail.delivery_mode === 'both') &&
          this.isTimeWithinRange(
            this.scheduleForm.start_time,
            this.scheduleForm.end_time,
            avail.start_time,
            avail.end_time,
          ),
      )
    },
    isTimeWithinRange(start, end, availStart, availEnd) {
      return start >= availStart && end <= availEnd
    },
    isTimeInAvailability(avail) {
      if (!this.scheduleForm.day || !this.scheduleForm.start_time || !this.scheduleForm.end_time) {
        return false
      }
      return (
        avail.day === this.scheduleForm.day &&
        (avail.delivery_mode === this.scheduleForm.delivery_mode ||
          avail.delivery_mode === 'both') &&
        this.isTimeWithinRange(
          this.scheduleForm.start_time,
          this.scheduleForm.end_time,
          avail.start_time,
          avail.end_time,
        )
      )
    },
    onDeliveryModeChange() {
      if (this.scheduleForm.delivery_mode === 'online') {
        this.scheduleForm.room_id = ''
      }
      this.checkAvailabilityWarning()
    },
    async saveSchedule() {
      this.savingSchedule = true
      this.scheduleError = null
      this.scheduleSuccess = null

      try {
        const payload = { ...this.scheduleForm }
        if (payload.delivery_mode === 'online') {
          payload.room_id = null
        }

        if (this.editingSchedule) {
          await api.put(`/schedules/${this.editingSchedule.id}`, payload)
          this.scheduleSuccess = 'Schedule updated successfully.'
        } else {
          await api.post('/schedules', payload)
          this.scheduleSuccess = 'Schedule created successfully.'
        }

        // Refresh schedules
        await this.fetchDashboard()
        setTimeout(() => {
          this.closeScheduleEditModal()
        }, 1500)
      } catch (err) {
        this.scheduleError = err.response?.data?.message || 'Unable to save schedule.'
      } finally {
        this.savingSchedule = false
      }
    },
    // New methods for student counts management
  },
  watch: {
    'scheduleForm.day': 'checkAvailabilityWarning',
    'scheduleForm.start_time': 'checkAvailabilityWarning',
    'scheduleForm.end_time': 'checkAvailabilityWarning',
    'scheduleForm.delivery_mode': 'checkAvailabilityWarning',
    'scheduleForm.semester': function () {
      this.loadDoctorAvailability()
    },
  },
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  padding: 2rem 1.5rem 3rem;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.08), transparent 22%),
    linear-gradient(180deg, #03101f 0%, #071a32 100%);
}

.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 1.5rem;
  border-radius: 1.75rem;
  background: rgba(3, 16, 31, 0.92);
  border: 1px solid rgba(255, 215, 103, 0.18);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.26);
}

.dashboard-header .badge {
  display: inline-flex;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  color: #ffe5a7;
  background: rgba(255, 215, 103, 0.14);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
  font-weight: 700;
}

.dashboard-header h1 {
  margin: 0.25rem 0 0;
  font-size: clamp(2rem, 2.5vw, 2.6rem);
  color: #ffe7a8;
}

.dashboard-header .subtitle {
  margin: 0.5rem 0 0;
  color: rgba(245, 242, 233, 0.74);
}

.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.95rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 215, 103, 0.2);
  background: rgba(255, 215, 103, 0.12);
  color: #08101b;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-card {
  width: min(680px, calc(100% - 2rem));
  background: #0f172a;
  border: 1px solid rgba(255, 215, 103, 0.2);
  border-radius: 24px;
  box-shadow: 0 36px 90px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
}

.close-button {
  border: none;
  background: transparent;
  color: #f5f2e9;
  font-size: 1.4rem;
  cursor: pointer;
}

.modal-content {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.modal-content label {
  display: grid;
  gap: 0.65rem;
  color: #f5f2e9;
}

.modal-content select,
.modal-content textarea {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f2e9;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-messages .success {
  color: #8ee2a0;
}

.status-messages .error {
  color: #f3b192;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1.8rem;
}

.stat-card {
  padding: 1.6rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 103, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.stat-card:hover,
.stat-card.active {
  transform: translateY(-4px);
  background: rgba(255, 215, 103, 0.12);
  border-color: rgba(255, 215, 103, 0.35);
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
  font-size: 2.3rem;
  font-weight: 700;
  color: #fff;
}

.dashboard-main {
  margin-top: 2rem;
  padding: 1.75rem;
  border-radius: 1.75rem;
  background: rgba(3, 16, 31, 0.94);
  border: 1px solid rgba(255, 215, 103, 0.12);
}

.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.9rem 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
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

.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 360px;
}

.search-group label {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
}

.search-group input {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.search-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.table-container {
  overflow-x: auto;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.dashboard-table th,
.dashboard-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dashboard-table th {
  text-align: left;
  color: #fbd77a;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-table td {
  color: rgba(245, 242, 233, 0.86);
}

.empty-state {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}

@media (min-width: 768px) {
  .dashboard-header {
    padding: 2rem;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.warning-message {
  color: #ffcc00;
  font-weight: bold;
  margin: 1rem 0;
}

.availability-display {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.availability-display h4 {
  margin: 0 0 0.5rem 0;
  color: #fbd77a;
}

.availability-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.availability-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.availability-item.matches {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

/* Student Counts and Schedule Generation Sections */
.student-counts-section,
.schedule-generation-section {
  margin-top: 2.5rem;
  padding: 1.75rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 215, 103, 0.1);
}

.student-counts-section .form-section,
.schedule-generation-section .form-section {
  background: rgba(255, 255, 255, 0.02);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.student-counts-section h3,
.schedule-generation-section h3,
.student-counts-section h4,
.schedule-generation-section h4 {
  margin: 0 0 1rem 0;
  color: #fbd77a;
}

.student-counts-section .form-grid label,
.schedule-generation-section .form-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.student-counts-section select,
.student-counts-section input,
.schedule-generation-section select,
.schedule-generation-section input {
  padding: 0.85rem 0.95rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 215, 103, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.generation-result {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.02);
}

.generation-result ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.generation-result li {
  padding: 0.5rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}
</style>
