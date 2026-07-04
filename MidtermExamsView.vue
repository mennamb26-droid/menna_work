<template>
  <section class="midterm-view-page">
    <header class="hero-panel">
      <div>
        <p class="campus-label">كلية الهندسة</p>
        <h1>جدول امتحانات الميدتيرم</h1>
        <p class="hero-description">استعرض الجدول النهائي للميدتيرم للمستوى والمجموعة المختارين.</p>
      </div>
      <div class="hero-meta">
        <span>العام الدراسي 2025 / 2026</span>
      </div>
    </header>

    <div class="info-box">
      <p>جدول الميدتيرم نهائى ولا يُسمح بإجراء أي تعديلات بعد تاريخ 10/3/2026</p>
    </div>

    <div class="filter-panel">
      <div class="filter-field">
        <label for="level">المستوى</label>
        <select id="level" v-model.number="selectedLevel" @change="onLevelChange">
          <option value="">اختر المستوى</option>
          <option v-for="level in levels" :key="level.id" :value="level.id">
            {{ level.name }}
          </option>
        </select>
      </div>

      <div class="filter-field">
        <label for="group">المجموعة</label>
        <select
          id="group"
          v-model.number="selectedGroup"
          @change="onGroupChange"
          :disabled="!selectedLevel"
        >
          <option value="">اختر المجموعة</option>
          <option v-for="group in filteredGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>
    </div>

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

    <div class="tab-panel">
      <div v-if="error" class="alert-box">{{ error }}</div>

      <section v-if="activeTab === 'view'" class="content-section">
        <div class="table-actions">
          <button type="button" @click="fetchExams" class="refresh-button">تحديث الجدول</button>
        </div>

        <div class="table-container" v-if="exams.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>اليوم / التاريخ</th>
                <th>المقرر</th>
                <th>كود المقرر</th>
                <th>الوقت</th>
                <th>المكان</th>
                <th>الدكتور</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exam in exams" :key="exam.id">
                <td>
                  <span class="day-label">{{ exam.day || '-' }}</span>
                  <span class="date-label">{{ formatDate(exam.exam_date) }}</span>
                </td>
                <td>{{ exam.course_name || '-' }}</td>
                <td>{{ exam.course_code || '-' }}</td>
                <td>{{ exam.time_label || formatTimeRange(exam) }}</td>
                <td>{{ exam.room_name || exam.place_name || '-' }}</td>
                <td>{{ exam.doctor_name || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty-state" v-else>اختر المستوى والمجموعة لعرض جدول الميدتيرم.</div>
      </section>

      <section v-if="activeTab === 'search'" class="content-section">
        <div class="search-bar">
          <input
            type="search"
            v-model="searchQuery"
            placeholder="ابحث باسم المقرر، الكود، الدكتور، المكان، اليوم، أو التاريخ"
          />
        </div>

        <div class="table-container" v-if="searchResults.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>اليوم / التاريخ</th>
                <th>المقرر</th>
                <th>كود المقرر</th>
                <th>الوقت</th>
                <th>المكان</th>
                <th>الدكتور</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exam in searchResults" :key="exam.id">
                <td>
                  <span class="day-label">{{ exam.day || '-' }}</span>
                  <span class="date-label">{{ formatDate(exam.exam_date) }}</span>
                </td>
                <td>{{ exam.course_name || '-' }}</td>
                <td>{{ exam.course_code || '-' }}</td>
                <td>{{ exam.time_label || formatTimeRange(exam) }}</td>
                <td>{{ exam.room_name || exam.place_name || '-' }}</td>
                <td>{{ exam.doctor_name || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty-state" v-else>لا توجد نتائج مطابقة لبحثك.</div>
      </section>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'MidtermExamsView',
  data() {
    return {
      error: null,
      loading: false,
      selectedLevel: null,
      selectedGroup: null,
      levels: [],
      groups: [],
      exams: [],
      searchQuery: '',
      activeTab: 'view',
      tabs: [
        { key: 'view', label: 'عرض الجدول' },
        { key: 'search', label: 'بحث سريع' },
      ],
    }
  },
  computed: {
    filteredGroups() {
      if (!this.selectedLevel) {
        return []
      }
      return this.groups.filter((group) => group.level_id === this.selectedLevel)
    },
    searchResults() {
      if (!this.searchQuery.trim()) {
        return this.exams
      }

      const query = this.searchQuery.trim().toLowerCase()

      return this.exams.filter((exam) => {
        const courseName = exam.course_name?.toLowerCase() || ''
        const courseCode = exam.course_code?.toLowerCase() || ''
        const doctorName = exam.doctor_name?.toLowerCase() || ''
        const roomName = exam.room_name?.toLowerCase() || ''
        const placeName = exam.place_name?.toLowerCase() || ''
        const day = exam.day?.toLowerCase() || ''
        const date = exam.exam_date?.toString().toLowerCase() || ''

        return (
          courseName.includes(query) ||
          courseCode.includes(query) ||
          doctorName.includes(query) ||
          roomName.includes(query) ||
          placeName.includes(query) ||
          day.includes(query) ||
          date.includes(query)
        )
      })
    },
  },
  watch: {
    activeTab(newTab) {
      if ((newTab === 'view' || newTab === 'search') && this.selectedLevel && this.selectedGroup) {
        this.fetchExams()
      }
    },
  },
  mounted() {
    this.loadReferenceData()
  },
  methods: {
    async loadReferenceData() {
      try {
        const [levels, groups] = await Promise.all([api.get('/levels'), api.get('/groups')])

        this.levels = levels.data || []
        this.groups = groups.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'فشل في تحميل البيانات الثابتة.'
      }
    },
    async fetchExams() {
      if (!this.selectedLevel || !this.selectedGroup) {
        this.exams = []
        return
      }

      this.loading = true
      this.error = null

      try {
        const response = await api.get('/midterm-exams-view', {
          params: {
            level_id: this.selectedLevel,
            group_id: this.selectedGroup,
          },
        })
        this.exams = response.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'فشل في تحميل جدول الميدتيرم.'
      } finally {
        this.loading = false
      }
    },
    onLevelChange() {
      this.selectedGroup = null
      this.exams = []
    },
    onGroupChange() {
      this.fetchExams()
    },
    setActiveTab(tab) {
      this.activeTab = tab
    },
    formatDate(value) {
      return value || '-'
    },
    formatTimeRange(exam) {
      if (exam.time_label) {
        return exam.time_label
      }
      if (exam.start_time && exam.end_time) {
        return `${exam.start_time} - ${exam.end_time}`
      }
      return '-'
    },
  },
}
</script>

<style scoped>
.midterm-view-page {
  min-height: 100vh;
  padding: 2rem 1.5rem 3rem;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.1), transparent 24%),
    linear-gradient(180deg, #03121f 0%, #071b34 100%);
}

.hero-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.85rem 1.5rem;
  border-radius: 1.75rem;
  background: rgba(6, 20, 44, 0.95);
  border: 1px solid rgba(255, 215, 103, 0.16);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
}

.campus-label {
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

.hero-panel h1 {
  margin: 0.75rem 0 0;
  font-size: clamp(2rem, 2.5vw, 2.6rem);
  color: #ffe7a8;
}

.hero-description {
  margin: 0.85rem 0 0;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
}

.hero-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  padding: 1rem 1.25rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 600;
}

.info-box {
  margin: 1.75rem 0;
  padding: 1.4rem 1.4rem;
  border-radius: 1.5rem;
  background: rgba(255, 215, 103, 0.12);
  border: 1px solid rgba(255, 215, 103, 0.2);
  color: #fff3d1;
  font-weight: 600;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.filter-field {
  display: grid;
  gap: 0.65rem;
}

.filter-field label {
  color: rgba(255, 255, 255, 0.8);
}

.filter-field select {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.tab-button {
  padding: 0.95rem 1.25rem;
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

.alert-box {
  padding: 1rem 1rem;
  margin-bottom: 1rem;
  border-radius: 1.15rem;
  background: rgba(219, 68, 68, 0.12);
  border: 1px solid rgba(219, 68, 68, 0.2);
  color: #ffd6d6;
}

.table-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.refresh-button {
  padding: 0.85rem 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 215, 103, 0.2);
  background: rgba(255, 215, 103, 0.14);
  color: #08101b;
  font-weight: 700;
  cursor: pointer;
}

.search-bar {
  margin-bottom: 1rem;
}

.search-bar input {
  width: 100%;
  padding: 0.95rem 1rem;
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
  min-width: 760px;
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

.day-label {
  display: block;
  color: rgba(255, 255, 255, 0.87);
  font-weight: 700;
}

.date-label {
  display: block;
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.95rem;
}

.empty-state {
  padding: 1.8rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}

@media (max-width: 920px) {
  .data-table {
    min-width: 100%;
  }
}

@media (max-width: 720px) {
  .filter-panel {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    padding: 1.3rem;
  }
}
</style>
