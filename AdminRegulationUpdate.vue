<template>
  <section class="admin-regulation-update-page">
    <header class="page-header">
      <div>
        <p class="badge">Admin</p>
        <h1>Update Regulation Data</h1>
        <p class="subtitle">Upload a regulation file to update courses and doctors for the selected regulation.</p>
      </div>
    </header>

    <section class="panel update-panel">
      <div class="form-row">
        <label>
          Regulation
          <select v-model="selectedRegulationId">
            <option value="">Select regulation</option>
            <option v-for="regulation in regulations" :key="regulation.id" :value="String(regulation.id)">
              {{ regulation.name }}{{ regulation.year ? ' (' + regulation.year + ')' : '' }}
            </option>
          </select>
        </label>

        <label class="file-label">
          Upload File
          <input type="file" accept=".xlsx,.xls,.csv" @change="handleFileChange" />
        </label>
      </div>

      <div class="actions-row">
        <button type="button" class="primary-button" :disabled="loading" @click="updateRegulation">
          <span v-if="loading">Updating...</span>
          <span v-else>Update Regulation</span>
        </button>
      </div>

      <div v-if="error" class="notification error-notice">{{ error }}</div>
      <div v-if="success" class="notification success-notice">{{ success }}</div>
    </section>

    <section v-if="reportVisible" class="panel report-panel">
      <h2>Update Report</h2>
      <div class="report-grid">
        <article class="report-card">
          <span>Created Courses</span>
          <strong>{{ report.created_courses_count }}</strong>
        </article>
        <article class="report-card">
          <span>Updated Courses</span>
          <strong>{{ report.updated_courses_count }}</strong>
        </article>
        <article class="report-card">
          <span>Created Doctors</span>
          <strong>{{ report.created_doctors_count }}</strong>
        </article>
        <article class="report-card">
          <span>Updated Doctors</span>
          <strong>{{ report.updated_doctors_count }}</strong>
        </article>
        <article class="report-card">
          <span>Skipped Rows</span>
          <strong>{{ report.skipped_rows }}</strong>
        </article>
      </div>

      <div v-if="report.errors.length" class="errors-table-wrapper">
        <h3>Errors</h3>
        <table class="errors-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in report.errors" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'AdminRegulationUpdate',
  data() {
    return {
      regulations: [],
      selectedRegulationId: this.$route.params.id ? String(this.$route.params.id) : '',
      file: null,
      loading: false,
      success: '',
      error: '',
      report: {
        created_courses_count: 0,
        updated_courses_count: 0,
        created_doctors_count: 0,
        updated_doctors_count: 0,
        skipped_rows: 0,
        errors: [],
      },
    }
  },
  computed: {
    reportVisible() {
      return (
        this.report.created_courses_count > 0 ||
        this.report.updated_courses_count > 0 ||
        this.report.created_doctors_count > 0 ||
        this.report.updated_doctors_count > 0 ||
        this.report.skipped_rows > 0 ||
        this.report.errors.length > 0
      )
    },
  },
  async mounted() {
    await this.fetchRegulations()
    if (!this.selectedRegulationId && this.$route.params.id) {
      this.selectedRegulationId = String(this.$route.params.id)
    }
  },
  methods: {
    async fetchRegulations() {
      try {
        const response = await api.get('/regulations')
        this.regulations = Array.isArray(response.data) ? response.data : response.data.data || []
        if (!this.selectedRegulationId && this.$route.params.id) {
          const routeId = String(this.$route.params.id)
          if (this.regulations.some((reg) => String(reg.id) === routeId)) {
            this.selectedRegulationId = routeId
          }
        }
      } catch (err) {
        console.error(err)
        this.error = 'Unable to load regulations. Please try again.'
      }
    },
    handleFileChange(event) {
      this.file = event.target.files?.[0] || null
      this.success = ''
      this.error = ''
      this.report = {
        created_courses_count: 0,
        updated_courses_count: 0,
        created_doctors_count: 0,
        updated_doctors_count: 0,
        skipped_rows: 0,
        errors: [],
      }
    },
    async updateRegulation() {
      this.error = ''
      this.success = ''
      this.report = {
        created_courses_count: 0,
        updated_courses_count: 0,
        created_doctors_count: 0,
        updated_doctors_count: 0,
        skipped_rows: 0,
        errors: [],
      }

      const regulationId = this.selectedRegulationId || this.$route.params.id
      if (!regulationId) {
        this.error = 'Please select a regulation.'
        return
      }

      if (!this.file) {
        this.error = 'Please select a file to upload.'
        return
      }

      const formData = new FormData()
      formData.append('file', this.file)

      this.loading = true
      try {
        const response = await api.post(`/regulations/${regulationId}/update-from-file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        const data = response.data || {}
        this.report = {
          created_courses_count: data.created_courses_count || 0,
          updated_courses_count: data.updated_courses_count || 0,
          created_doctors_count: data.created_doctors_count || 0,
          updated_doctors_count: data.updated_doctors_count || 0,
          skipped_rows: data.skipped_rows || 0,
          errors: Array.isArray(data.errors) ? data.errors : [],
        }
        this.success = 'Regulation update completed.'
      } catch (err) {
        console.error(err)
        this.error = err.response?.data?.message || 'Unable to update regulation. Please try again.'
        const errors = err.response?.data?.errors
        if (Array.isArray(errors)) {
          this.report.errors = errors
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.admin-regulation-update-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
  color: #f3f1e8;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.badge {
  display: inline-block;
  background: rgba(216, 171, 37, 0.18);
  color: #f8d96c;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.page-header h1 {
  margin: 0.25rem 0 0;
  font-size: clamp(1.8rem, 2.3vw, 2.4rem);
}

.subtitle {
  margin: 0.65rem 0 0;
  color: #d6c99c;
}

.panel {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
  align-items: end;
}

.form-row label {
  display: grid;
  gap: 0.55rem;
  color: #e6dcb2;
}

.form-row select,
.form-row input[type='file'] {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  color: #f3f1e8;
}

.file-label input[type='file'] {
  padding: 0.5rem 0;
}

.actions-row {
  margin-top: 1rem;
}

.primary-button {
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  padding: 0.95rem 1.75rem;
  background: linear-gradient(135deg, #d8ab25, #f8d96c);
  color: #08101b;
}

.notification {
  border-radius: 0.95rem;
  padding: 0.95rem 1rem;
  margin-top: 1rem;
  font-weight: 600;
}

.success-notice {
  background: rgba(116, 196, 112, 0.18);
  color: #e5ffea;
}

.error-notice {
  background: rgba(248, 98, 98, 0.16);
  color: #ffd9d9;
}

.report-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 1rem;
}

.report-card {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 103, 0.12);
  border-radius: 1rem;
}

.report-card span {
  display: block;
  color: #d6c99c;
  margin-bottom: 0.5rem;
}

.report-card strong {
  font-size: 1.6rem;
  color: #fff;
}

.errors-table-wrapper {
  margin-top: 1.5rem;
}

.errors-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.04);
}

.errors-table th,
.errors-table td {
  padding: 0.85rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f3f1e8;
}

.errors-table th {
  background: rgba(255, 255, 255, 0.08);
  text-align: left;
}

@media (max-width: 760px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
