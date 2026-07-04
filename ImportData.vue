<template>
  <section class="import-data-page">
    <header class="page-header">
      <div>
        <p class="badge">Admin</p>
        <h1>Data Import</h1>
        <p class="subtitle">Upload Excel, CSV files for course registration count imports.</p>
      </div>
    </header>

    <div class="import-container">
      <article class="import-card">
        <h2>Student Course Registrations Import</h2>

        <label class="field-label">
          Department
          <select v-model="selectedDepartmentId">
            <option value="" disabled>Select department</option>
            <option v-for="department in departments" :key="department.id" :value="department.id">
              {{ department.name }}
            </option>
          </select>
        </label>

        <label class="field-label">
          Current student level
          <select v-model="selectedLevelId" :disabled="!selectedDepartmentId">
            <option value="" disabled>Select level</option>
            <option v-for="level in filteredLevels" :key="level.id" :value="level.id">
              {{ level.name }}
            </option>
          </select>
        </label>

        <label class="field-label">
          Semester
          <select v-model="selectedSemester">
            <option value="" disabled>Select semester</option>
            <option value="First Semester">First Semester</option>
            <option value="Second Semester">Second Semester</option>
            <option value="Summer Semester">Summer Semester</option>
          </select>
        </label>

        <label class="field-label">
          Academic year
          <input type="text" v-model="selectedAcademicYear" placeholder="2025/2026" />
        </label>

        <label class="file-label">
          Choose file
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileChange"
          />
        </label>

        <button
          type="button"
          class="button-primary"
          :disabled="loadingStudentCourseRegistrations || !fileStudentCourseRegistrations || !selectedDepartmentId || !selectedLevelId || !selectedSemester || !selectedAcademicYear"
          @click="uploadStudentCourseRegistrations"
        >
          <span v-if="loadingStudentCourseRegistrations">Importing...</span>
          <span v-else>Import Student Registrations</span>
        </button>

        <div class="hint-text">
          File columns: student_code or seat_number, student_name, then course codes as headers. Use ✓, 1, yes, y or x to mark registration.
        </div>

        <div v-if="successStudentCourseRegistrations" class="status success">
          {{ successStudentCourseRegistrations }}
        </div>

        <div v-if="importedCountStudentCourseRegistrations !== null" class="status success">
          Imported registrations: {{ importedCountStudentCourseRegistrations }}
        </div>

        <div v-if="errorStudentCourseRegistrations" class="status error">
          {{ errorStudentCourseRegistrations }}
        </div>

        <ul v-if="errorsStudentCourseRegistrations.length" class="error-list">
          <li v-for="(errorItem, idx) in errorsStudentCourseRegistrations" :key="idx">
            {{ errorItem }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'ImportData',
  data() {
    return {
      departments: [],
      levels: [],
      selectedDepartmentId: '',
      selectedLevelId: '',
      selectedSemester: '',
      selectedAcademicYear: '',
      fileStudentCourseRegistrations: null,
      loadingStudentCourseRegistrations: false,
      successStudentCourseRegistrations: '',
      errorStudentCourseRegistrations: '',
      errorsStudentCourseRegistrations: [],
      importedCountStudentCourseRegistrations: null,
    }
  },
  computed: {
    filteredLevels() {
      if (!this.selectedDepartmentId) {
        return []
      }

      return this.levels.filter(
        (level) => String(level.department_id) === String(this.selectedDepartmentId)
      )
    },
  },
  async mounted() {
    await this.fetchDepartmentsAndLevels()
  },
  methods: {
    async fetchDepartmentsAndLevels() {
      try {
        const [departmentsResponse, levelsResponse] = await Promise.all([
          api.get('/departments'),
          api.get('/levels'),
        ])

        this.departments = departmentsResponse.data || []
        this.levels = levelsResponse.data || []
      } catch (error) {
        console.error('Failed to load departments or levels', error)
      }
    },
    handleFileChange(event) {
      this.fileStudentCourseRegistrations = event.target.files?.[0] || null
      this.successStudentCourseRegistrations = ''
      this.errorStudentCourseRegistrations = ''
      this.errorsStudentCourseRegistrations = []
      this.importedCountStudentCourseRegistrations = null
    },
    async uploadStudentCourseRegistrations() {
      const file = this.fileStudentCourseRegistrations
      if (!file) {
        this.errorStudentCourseRegistrations = 'Please select a file before uploading.'
        return
      }

      if (!this.selectedDepartmentId || !this.selectedLevelId || !this.selectedSemester || !this.selectedAcademicYear) {
        this.errorStudentCourseRegistrations = 'Please select department, level, semester, and academic year.'
        return
      }

      this.loadingStudentCourseRegistrations = true
      this.successStudentCourseRegistrations = ''
      this.errorStudentCourseRegistrations = ''
      this.errorsStudentCourseRegistrations = []
      this.importedCountStudentCourseRegistrations = null

      const formData = new FormData()
      formData.append('department_id', this.selectedDepartmentId)
      formData.append('level_id', this.selectedLevelId)
      formData.append('semester', this.selectedSemester)
      formData.append('academic_year', this.selectedAcademicYear)
      formData.append('file', file)

      try {
        const response = await api.post('/imports/student-course-registrations', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        this.importedCountStudentCourseRegistrations = response.data?.imported_count ?? null
        this.errorsStudentCourseRegistrations = Array.isArray(response.data?.errors) ? response.data.errors : []
        this.successStudentCourseRegistrations = response.data?.message || 'Student course registrations imported successfully.'
      } catch (error) {
        const backendMessage = error.response?.data?.message
        const backendErrors = Array.isArray(error.response?.data?.errors)
          ? error.response.data.errors
          : []

        this.errorStudentCourseRegistrations =
          backendMessage || 'Upload failed. Please check the file and try again.'
        this.errorsStudentCourseRegistrations = backendErrors
        this.importedCountStudentCourseRegistrations = error.response?.data?.imported_count ?? null
      } finally {
        this.loadingStudentCourseRegistrations = false
      }
    },
  },
}
</script>

<style scoped>
.import-data-page {
  min-height: 100vh;
  padding: 2rem 1.5rem 3rem;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.12), transparent 26%),
    linear-gradient(180deg, #061827 0%, #071b35 100%);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 1.75rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.badge {
  display: inline-flex;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 215, 103, 0.16);
  color: #fbe7a1;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.page-header h1 {
  margin: 0;
  font-size: 2.35rem;
  color: #fff;
}

.page-header .subtitle {
  margin: 0;
  color: rgba(245, 242, 233, 0.74);
}

.import-container {
  display: flex;
  justify-content: center;
  padding: 0 1rem;
}

.import-card {
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  max-width: 500px;
  width: 100%;
}

.import-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #f5e5b7;
  font-size: 1.2rem;
}

.file-label {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
  color: rgba(245, 242, 233, 0.88);
  font-size: 0.95rem;
}

.file-label input[type='file'] {
  width: 100%;
  padding: 0.85rem 0.8rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f2e9;
}

.button-primary {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #f5b636 0%, #f8d782 100%);
  color: #061827;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.button-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.status {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  font-size: 0.95rem;
}

.status.success {
  background: rgba(165, 119, 15, 0.18);
  border: 1px solid rgba(245, 191, 76, 0.2);
  color: #fff8db;
}

.status.error {
  background: rgba(175, 45, 45, 0.18);
  border: 1px solid rgba(255, 92, 92, 0.24);
  color: #ffdbdb;
}

.error-list {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
  color: #ffdbdb;
}

.error-list li {
  margin-bottom: 0.35rem;
}
</style>
