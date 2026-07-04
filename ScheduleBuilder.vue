<template>
  <section class="schedule-builder-page">
    <header class="page-header">
      <div>
        <p class="page-label">بناء الجدول الدراسى</p>
        <h1>بناء الجدول الدراسى</h1>
      </div>
    </header>

    <section class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.value"
        type="button"
        :class="['mode-button', { active: activeMode === mode.value }]"
        @click="activeMode = mode.value"
      >
        {{ mode.label }}
      </button>
    </section>

    <div class="builder-grid">
      <aside class="builder-panel">
        <form class="builder-form" @submit.prevent="submitSchedule">
          <div class="form-row">
            <label>
              المقرر
              <select v-model.number="form.course_id" required>
                <option value="">اختر المقرر</option>
                <option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.name }} ({{ course.code }})
                </option>
              </select>
            </label>

            <label>
              المستوى
              <select v-model.number="form.level_id" @change="onLevelChange">
                <option value="">اختر المستوى</option>
                <option v-for="level in levels" :key="level.id" :value="level.id">
                  {{ level.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>
              المجموعة
              <select v-model.number="form.group_id" required>
                <option value="">اختر المجموعة</option>
                <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </label>

            <label>
              الدكتور
              <select v-model.number="form.doctor_id" required>
                <option value="">اختر الدكتور</option>
                <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                  {{ doctor.name }}
                </option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>
              المكان
              <select v-model.number="form.room_id" required>
                <option value="">اختر المكان</option>
                <option v-for="room in rooms" :key="room.id" :value="room.id">
                  {{ room.name }} - {{ typeLabel(room.type) }}
                </option>
              </select>
            </label>

            <label>
              اليوم
              <select v-model="form.day" required>
                <option value="">اختر اليوم</option>
                <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>
              من
              <input type="time" v-model="form.start_time" required />
            </label>
            <label>
              إلى
              <input type="time" v-model="form.end_time" required />
            </label>
          </div>

          <div class="form-row type-row">
            <label class="radio-inline">
              <input type="radio" value="lecture" v-model="form.type" required />
              محاضرة
            </label>
            <label class="radio-inline">
              <input type="radio" value="section" v-model="form.type" required />
              شعبة
            </label>
          </div>

          <div class="form-row">
            <label>
              ملاحظات
              <textarea v-model="form.note" rows="3" placeholder="ملاحظات اختيارية"></textarea>
            </label>
          </div>

          <button type="submit" class="submit-button">حفظ الحصة</button>

          <div v-if="formError" class="alert-box">{{ formError }}</div>
          <div v-if="successMessage" class="success-box">{{ successMessage }}</div>
        </form>
      </aside>

      <main class="schedule-panel">
        <section class="schedule-header">
          <div class="filters-row">
            <label>
              مستوى
              <select v-model.number="filterLevel">
                <option value="">الكل</option>
                <option v-for="level in levels" :key="level.id" :value="level.id">
                  {{ level.name }}
                </option>
              </select>
            </label>
            <label>
              الدكتور
              <select v-model.number="filterDoctor">
                <option value="">الكل</option>
                <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                  {{ doctor.name }}
                </option>
              </select>
            </label>
            <label>
              النوع
              <select v-model="filterType">
                <option value="">الكل</option>
                <option value="lecture">محاضرة</option>
                <option value="section">شعبة</option>
              </select>
            </label>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <p>عدد المحاضرات</p>
              <strong>{{ lectureCount }}</strong>
            </div>
            <div class="stat-card">
              <p>عدد الشعب</p>
              <strong>{{ sectionCount }}</strong>
            </div>
            <div class="stat-card">
              <p>عدد التعارضات</p>
              <strong>{{ conflictCount }}</strong>
            </div>
          </div>
        </section>

        <div class="grid-wrapper">
          <table class="schedule-grid">
            <thead>
              <tr>
                <th>الوقت / اليوم</th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.label">
                <td class="time-cell">{{ slot.label }}</td>
                <td v-for="day in days" :key="day">
                  <div
                    v-if="gridMap[`${day}|${slot.start}|${slot.end}`]"
                    class="slot-card"
                    :class="slotCardClass(gridMap[`${day}|${slot.start}|${slot.end}`].type)"
                  >
                    <strong>{{ gridMap[`${day}|${slot.start}|${slot.end}`].course_name }}</strong>
                    <span
                      >{{ gridMap[`${day}|${slot.start}|${slot.end}`].start_time }} -
                      {{ gridMap[`${day}|${slot.start}|${slot.end}`].end_time }}</span
                    >
                    <span>{{ gridMap[`${day}|${slot.start}|${slot.end}`].room_name }}</span>
                    <span>{{ gridMap[`${day}|${slot.start}|${slot.end}`].doctor_name }}</span>
                    <button
                      type="button"
                      class="delete-button"
                      @click="deleteSchedule(gridMap[`${day}|${slot.start}|${slot.end}`])"
                    >
                      حذف
                    </button>
                  </div>
                  <div v-else class="empty-slot">-</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'ScheduleBuilder',
  data() {
    return {
      loading: false,
      error: null,
      formError: null,
      successMessage: null,
      conflictCount: 0,
      modes: [
        { label: 'حسب المادة', value: 'course' },
        { label: 'حسب المكان', value: 'room' },
        { label: 'حسب الدكتور', value: 'doctor' },
      ],
      activeMode: 'course',
      courses: [],
      levels: [],
      groups: [],
      doctors: [],
      rooms: [],
      schedules: [],
      filterLevel: '',
      filterDoctor: '',
      filterType: '',
      days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
      timeSlots: [
        { label: '08:00 - 10:00', start: '08:00', end: '10:00' },
        { label: '10:00 - 12:00', start: '10:00', end: '12:00' },
        { label: '12:00 - 14:00', start: '12:00', end: '14:00' },
        { label: '14:00 - 16:00', start: '14:00', end: '16:00' },
        { label: '16:00 - 18:00', start: '16:00', end: '18:00' },
      ],
      form: {
        course_id: null,
        level_id: null,
        group_id: null,
        doctor_id: null,
        room_id: null,
        day: '',
        start_time: '',
        end_time: '',
        type: 'lecture',
        note: '',
      },
    }
  },
  computed: {
    filteredGroups() {
      if (!this.form.level_id) {
        return this.groups
      }
      return this.groups.filter((group) => group.level_id === this.form.level_id)
    },
    filteredSchedules() {
      return this.schedules
        .filter((schedule) => {
          if (this.filterLevel && String(schedule.level_id) !== String(this.filterLevel)) {
            return false
          }
          if (this.filterDoctor && String(schedule.doctor_id) !== String(this.filterDoctor)) {
            return false
          }
          if (this.filterType && schedule.type !== this.filterType) {
            return false
          }
          return true
        })
        .slice()
        .sort((a, b) => {
          if (this.activeMode === 'course') {
            return (a.course_name || '').localeCompare(b.course_name || '')
          }
          if (this.activeMode === 'room') {
            return (a.room_name || '').localeCompare(b.room_name || '')
          }
          if (this.activeMode === 'doctor') {
            return (a.doctor_name || '').localeCompare(b.doctor_name || '')
          }
          return 0
        })
    },
    lectureCount() {
      return this.filteredSchedules.filter((item) => item.type === 'lecture').length
    },
    sectionCount() {
      return this.filteredSchedules.filter((item) => item.type === 'section').length
    },
    gridMap() {
      const map = {}
      this.filteredSchedules.forEach((schedule) => {
        const key = `${schedule.day}|${schedule.start_time}|${schedule.end_time}`
        map[key] = schedule
      })
      return map
    },
  },
  async mounted() {
    this.loading = true
    try {
      await Promise.all([
        this.loadCourses(),
        this.loadLevels(),
        this.loadGroups(),
        this.loadDoctors(),
        this.loadRooms(),
        this.loadSchedules(),
      ])
    } catch (err) {
      console.error(err)
      this.error = 'فشل تحميل بيانات الجدول. حاول مرة أخرى.'
    } finally {
      this.loading = false
    }
  },
  methods: {
    async loadCourses() {
      const response = await api.get('/courses')
      this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadLevels() {
      const response = await api.get('/levels')
      this.levels = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadGroups() {
      const response = await api.get('/groups')
      this.groups = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadDoctors() {
      const response = await api.get('/doctors')
      this.doctors = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadRooms() {
      const response = await api.get('/rooms')
      this.rooms = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    async loadSchedules() {
      const response = await api.get('/schedules')
      this.schedules = Array.isArray(response.data) ? response.data : response.data.data || []
    },
    onLevelChange() {
      this.form.group_id = null
    },
    async submitSchedule() {
      this.formError = null
      this.successMessage = null
      this.conflictCount = 0

      if (
        !this.form.course_id ||
        !this.form.group_id ||
        !this.form.doctor_id ||
        !this.form.room_id ||
        !this.form.day ||
        !this.form.start_time ||
        !this.form.end_time ||
        !this.form.type
      ) {
        this.formError = 'يرجى ملء جميع الحقول المطلوبة.'
        return
      }

      if (this.form.end_time <= this.form.start_time) {
        this.formError = 'وقت الانتهاء يجب أن يكون بعد وقت البداية.'
        return
      }

      try {
        const payload = {
          course_id: this.form.course_id,
          level_id: this.form.level_id,
          group_id: this.form.group_id,
          doctor_id: this.form.doctor_id,
          room_id: this.form.room_id,
          day: this.form.day,
          start_time: this.form.start_time,
          end_time: this.form.end_time,
          type: this.form.type,
          note: this.form.note || null,
        }

        await api.post('/schedules', payload)
        this.successMessage = 'تم حفظ الحصة بنجاح.'
        this.resetForm()
        await this.loadSchedules()
        this.conflictCount = 0
      } catch (err) {
        const response = err.response
        if (response && response.status === 422) {
          this.formError = response.data?.message || 'تعذر حفظ الحصة بسبب تعارض.'
          if (['Room conflict', 'Group conflict', 'Doctor conflict'].includes(this.formError)) {
            this.conflictCount = 1
          }
        } else {
          this.formError = 'حدث خطأ أثناء حفظ الحصة. حاول مجددا.'
        }
      }
    },
    async deleteSchedule(schedule) {
      const confirmed = window.confirm(`هل تريد حذف الحصة ${schedule.course_name || ''}؟`)
      if (!confirmed) {
        return
      }

      try {
        await api.delete(`/schedules/${schedule.id}`)
        await this.loadSchedules()
      } catch (err) {
        this.formError = 'فشل حذف الحصة. حاول مرة أخرى.'
      }
    },
    slotCardClass(type) {
      return (
        {
          lecture: 'slot-lecture',
          section: 'slot-section',
        }[type] || 'slot-default'
      )
    },
    typeLabel(type) {
      if (type === 'lecture') return 'محاضرة'
      if (type === 'section') return 'شعبة'
      return 'غير محدد'
    },
    resetForm() {
      this.form = {
        course_id: null,
        level_id: null,
        group_id: null,
        doctor_id: null,
        room_id: null,
        day: '',
        start_time: '',
        end_time: '',
        type: 'lecture',
        note: '',
      }
    },
  },
}
</script>

<style scoped>
.schedule-builder-page {
  min-height: 100vh;
  padding: 1.5rem;
  color: #f8f4f0;
  background:
    radial-gradient(circle at top, rgba(138, 96, 209, 0.18), transparent 24%),
    linear-gradient(180deg, #081123 0%, #111a3a 100%);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-label {
  color: #d4c1ff;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  margin-bottom: 0.35rem;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.8rem);
}

.mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mode-button {
  padding: 0.95rem 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #f3edf7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-button.active {
  background: linear-gradient(135deg, #9f7dff, #d2a8ff);
  color: #081123;
  border-color: transparent;
}

.builder-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 360px minmax(0, 1fr);
}

.builder-panel,
.schedule-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  padding: 1.4rem;
}

.builder-form {
  display: grid;
  gap: 1rem;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-row label,
.filters-row label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
  color: #e0d7f4;
}

.form-row input,
.form-row select,
.form-row textarea,
.filters-row select {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.form-row textarea {
  min-height: 88px;
  resize: vertical;
}

.type-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.radio-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: #f3edf7;
}

.radio-inline input {
  accent-color: #9f7dff;
}

.submit-button {
  width: 100%;
  padding: 1rem 1.2rem;
  border: none;
  border-radius: 1rem;
  background: linear-gradient(135deg, #8c6aff, #c09cff);
  color: #081123;
  font-weight: 700;
  cursor: pointer;
}

.alert-box,
.success-box {
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  margin-top: 0.75rem;
}

.alert-box {
  background: rgba(248, 98, 98, 0.16);
  color: #ffd7d7;
}

.success-box {
  background: rgba(117, 186, 111, 0.18);
  color: #e7ffdf;
}

.schedule-header {
  display: grid;
  gap: 1.25rem;
}

.filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card p {
  margin: 0 0 0.6rem;
  color: #d9c9ff;
}

.stat-card strong {
  font-size: 1.8rem;
  color: #fff;
}

.grid-wrapper {
  overflow-x: auto;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.schedule-grid th,
.schedule-grid td {
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.9rem 0.85rem;
  vertical-align: top;
}

.schedule-grid th {
  background: rgba(255, 255, 255, 0.04);
  color: #e8dcff;
  text-align: left;
}

.time-cell {
  width: 150px;
  font-weight: 700;
  color: #f0e7ff;
}

.slot-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem;
  border-radius: 1rem;
  color: #fff;
  background: rgba(121, 87, 233, 0.12);
}

.slot-lecture {
  background: linear-gradient(135deg, rgba(167, 101, 255, 0.18), rgba(106, 85, 255, 0.28));
}

.slot-section {
  background: linear-gradient(135deg, rgba(255, 142, 142, 0.18), rgba(255, 104, 140, 0.28));
}

.slot-card strong {
  font-size: 0.98rem;
}

.slot-card span {
  display: block;
  font-size: 0.88rem;
  color: #f2e9ff;
}

.delete-button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: rgba(248, 98, 98, 0.16);
  color: #ffe5e5;
  cursor: pointer;
}

.empty-slot {
  min-height: 88px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  display: grid;
  place-items: center;
}

@media (max-width: 1080px) {
  .builder-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .filters-row,
  .stats-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .schedule-grid {
    min-width: 100%;
  }
}
</style>
