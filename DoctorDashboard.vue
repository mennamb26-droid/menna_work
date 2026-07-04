<template>
  <section class="doctor-page">
    <div class="hero">
      <span class="badge">DOCTOR</span>
      <h1>Doctor Dashboard</h1>
      <p v-if="doctor">{{ doctor.name }} · {{ doctor.email }}</p>
      <p v-else>Loading your dashboard...</p>
    </div>

    <div class="panel">
      <div class="section-header">
        <h2>Assigned Courses</h2>
        <span class="status-label" v-if="loading">Loading...</span>
      </div>

      <table class="dashboard-table" v-if="assignedCourses.length">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Department</th>
            <th>Program</th>
            <th>Level</th>
            <th>Assignment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in assignedCourses" :key="course.id">
            <td>{{ course.code || '-' }}</td>
            <td>{{ course.name || '-' }}</td>
            <td>{{ course.department?.name || '-' }}</td>
            <td>{{ course.program?.name || '-' }}</td>
            <td>{{ course.level?.name || '-' }}</td>
            <td>{{ courseAssignmentLabel(course) }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No assigned courses were found for this account.</p>
    </div>

    <div class="panel">
      <div class="section-header">
        <h2>Weekly Schedule</h2>
      </div>

      <table class="dashboard-table" v-if="schedules.length">
        <thead>
          <tr>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Type</th>
            <th>Group / Batch</th>
            <th>Room / Place</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in schedules" :key="schedule.id">
            <td>{{ schedule.day || '-' }}</td>
            <td>{{ schedule.start_time || '-' }}</td>
            <td>{{ schedule.end_time || '-' }}</td>
            <td>{{ schedule.course?.code || '-' }}</td>
            <td>{{ schedule.course?.name || '-' }}</td>
            <td>{{ schedule.type || '-' }}</td>
            <td>{{ schedule.group?.name || schedule.courseScheduleBatch?.batch_number || '-' }}</td>
            <td>
              {{ schedule.delivery_mode === 'online' ? 'Online' : schedule.room?.name || '-' }}
            </td>
            <td>{{ schedule.semester || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No teaching schedule is available yet.</p>
    </div>

    <div class="panel">
      <div class="section-header">
        <h2>Exam Schedule</h2>
      </div>

      <table class="dashboard-table" v-if="examSchedules.length">
        <thead>
          <tr>
            <th>Exam Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Course</th>
            <th>Session</th>
            <th>Room</th>
            <th>Group</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exam in examSchedules" :key="exam.id">
            <td>{{ formatDate(exam.exam_date) }}</td>
            <td>{{ exam.start_time || '-' }}</td>
            <td>{{ exam.end_time || '-' }}</td>
            <td>{{ exam.course?.code || exam.course?.name || '-' }}</td>
            <td>{{ exam.examSession?.name || exam.exam_type || '-' }}</td>
            <td>{{ exam.room?.name || exam.place_name || '-' }}</td>
            <td>{{ exam.group?.name || exam.batch_no || '-' }}</td>
            <td>{{ exam.semester || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No exam schedule is available yet.</p>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'DoctorDashboard',
  data() {
    return {
      doctor: null,
      assignedCourses: [],
      schedules: [],
      examSchedules: [],
      loading: false,
      error: '',
    }
  },
  async mounted() {
    await this.loadDashboard()
  },
  methods: {
    async loadDashboard() {
      this.loading = true
      this.error = ''

      try {
        const response = await api.get('/doctor-dashboard')
        const data = response.data

        this.doctor = data.doctor || null
        this.assignedCourses = Array.isArray(data.assigned_courses) ? data.assigned_courses : []
        this.schedules = Array.isArray(data.schedules) ? data.schedules : []
        this.examSchedules = Array.isArray(data.exam_schedules) ? data.exam_schedules : []
      } catch (err) {
        this.error = err.response?.data?.message || 'Unable to load doctor dashboard data.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    courseAssignmentLabel(course) {
      const labels = []
      if (course.lecture_doctor_id === this.doctor?.id) {
        labels.push('Lecture')
      }
      if (course.section_doctor_id === this.doctor?.id) {
        labels.push('Section')
      }
      if (course.practical_doctor_id === this.doctor?.id) {
        labels.push('Practical')
      }
      return labels.length ? labels.join(', ') : 'Assigned'
    },
    formatDate(value) {
      if (!value) return '-'
      return new Date(value).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
.doctor-page {
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(180deg, #04101f 0%, #081b34 100%);
  color: #f5e4b3;
}

.hero,
.panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 18px;
  padding: 28px;
  margin-bottom: 24px;
}

.badge {
  display: inline-block;
  background: rgba(201, 168, 76, 0.18);
  color: #f4d471;
  border: 1px solid rgba(201, 168, 76, 0.4);
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 700;
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.status-label {
  color: #f5e4b3;
  font-size: 0.95rem;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 18px;
}

.dashboard-table th,
.dashboard-table td {
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  color: #f5e4b3;
}

.dashboard-table th {
  background: rgba(255, 255, 255, 0.06);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
}

.muted {
  color: rgba(245, 228, 179, 0.7);
  margin-top: 16px;
}

.error-banner {
  margin-top: 14px;
  color: #f3b192;
}
</style>
