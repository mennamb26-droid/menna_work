<template>
  <section class="rooms-page">
    <header class="page-header">
      <div>
        <p class="page-label">إدارة أماكن الدراسة والمحاضرات</p>
        <h1>إدارة أماكن الدراسة والمحاضرات</h1>
        <p class="page-note">Initial rooms are loaded by developer command from database/data. Admin can add or edit rooms manually here.</p>
      </div>
    </header>

    <section v-if="isAdmin" class="panel add-room-panel">
      <h2 class="panel-title">إنشاء مكان جديد</h2>
      <form @submit.prevent="saveRoom" class="add-room-form">
        <div class="add-room-row">
          <label>
            اسم المكان
            <input type="text" v-model.trim="form.name" placeholder="اكتب اسم المكان" required />
          </label>

          <label>
            نوع المكان
            <select v-model="form.type" required>
              <option disabled value="">اختر النوع</option>
              <option value="hall">قاعة</option>
              <option value="lab">معمل</option>
              <option value="amphitheater">مدرج</option>
              <option value="complex">مجمع</option>
            </select>
          </label>

          <label>
            السعة
            <input type="number" v-model.number="form.capacity" min="1" placeholder="أدخل السعة" required />
          </label>
        </div>

        <div class="add-room-row">
          <label>
            القسم
            <select v-model="form.department_id" :disabled="form.is_general" :required="!form.is_general">
              <option value="">اختر القسم</option>
              <option v-for="department in departments" :key="department.id" :value="department.id">
                {{ department.name }}
              </option>
            </select>
          </label>

          <label class="checkbox-inline">
            <input type="checkbox" v-model="form.is_general" /> مكان عام
          </label>

          <label class="checkbox-inline">
            <input type="checkbox" v-model="form.is_active" /> مفعل
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="primary-button">حفظ المكان</button>
          <button type="button" class="secondary-button" @click="resetForm">مسح النموذج</button>
        </div>

        <div v-if="success" class="notification success-notice">{{ success }}</div>
        <div v-if="error" class="notification error-notice">{{ error }}</div>
        <ul v-if="validationErrors.length" class="validation-list modal-validation">
          <li v-for="(message, index) in validationErrors" :key="index">{{ message }}</li>
        </ul>
      </form>
    </section>

    <div class="stats-grid">
      <article class="stat-card">
        <p>إجمالي الأماكن</p>
        <strong>{{ totalPlaces }}</strong>
      </article>
      <article class="stat-card">
        <p>المخصصة للأقسام</p>
        <strong>{{ assignedToDepartments }}</strong>
      </article>
      <article class="stat-card">
        <p>أماكن عامة</p>
        <strong>{{ generalPlaces }}</strong>
      </article>
      <article class="stat-card">
        <p>إجمالي السعة</p>
        <strong>{{ totalCapacity }}</strong>
      </article>
    </div>

    <section class="panel filters-panel">
      <div class="search-row">
        <input
          type="search"
          v-model="searchTerm"
          placeholder="ابحث باسم المكان"
          aria-label="Search rooms by name"
        />
        <select v-model="selectedDepartment">
          <option value="all">كل الأقسام</option>
          <option v-for="department in departments" :key="department.id" :value="department.id">
            {{ department.name }}
          </option>
        </select>
        <label class="checkbox-inline">
          <input type="checkbox" v-model="showGeneralOnly" /> الأماكن العامة فقط
        </label>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="{ active: selectedType === tab.value }"
          @click="selectType(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <div v-if="loading" class="status-box">تحميل الأماكن...</div>
    <div v-else-if="error" class="status-box status-error">
      <p>{{ error }}</p>
      <ul v-if="validationErrors.length" class="validation-list">
        <li v-for="(message, index) in validationErrors" :key="index">
          {{ message }}
        </li>
      </ul>
    </div>

    <div class="rooms-grid" v-else>
      <article v-for="room in filteredRooms" :key="room.id" class="room-card">
        <div class="room-badge">
          <span class="room-icon" :class="roomTypeClass(room.type)">
            {{ roomTypeIcon(room.type) }}
          </span>
          <strong class="room-name">{{ room.name || 'بدون اسم' }}</strong>
        </div>

        <div class="room-detail">
          <span>النوع</span>
          <strong>{{ typeLabel(room.type) }}</strong>
        </div>
        <div class="room-detail">
          <span>السعة</span>
          <strong>{{ room.capacity || 0 }}</strong>
        </div>
        <div class="room-detail">
          <span>القسم</span>
          <strong>{{ getDepartmentName(room) }}</strong>
        </div>
        <div class="room-status" :class="{ active: room.is_active, inactive: !room.is_active }">
          {{ room.is_active ? 'نشط' : 'غير نشط' }}
        </div>

        <div class="room-actions" v-if="isAdmin">
          <button type="button" @click="editRoom(room)">تعديل</button>
          <button type="button" class="danger" @click="deleteRoom(room)">حذف</button>
        </div>
      </article>

      <div v-if="!filteredRooms.length" class="empty-state">
        لا توجد أماكن تطابق البحث أو الفلتر.
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card">
        <header class="modal-header">
          <h2>{{ editing ? 'تعديل المكان' : 'إضافة مكان جديد' }}</h2>
          <button type="button" class="close-button" @click="closeModal">×</button>
        </header>

        <form @submit.prevent="saveRoom" class="modal-form">
          <label>
            اسم المكان
            <input type="text" v-model="form.name" placeholder="اكتب اسم المكان" required />
          </label>

          <label>
            نوع المكان
            <select v-model="form.type" required>
              <option disabled value="">اختر النوع</option>
              <option value="hall">قاعة</option>
              <option value="lab">معمل</option>
              <option value="amphitheater">مدرج</option>
              <option value="complex">مجمع</option>
            </select>
          </label>

          <label>
            السعة
            <input
              type="number"
              v-model.number="form.capacity"
              min="1"
              placeholder="أدخل السعة"
              required
            />
          </label>

          <label>
            القسم
            <select v-model="form.department_id" :disabled="form.is_general">
              <option value="">بدون قسم</option>
              <option v-for="department in departments" :key="department.id" :value="department.id">
                {{ department.name }}
              </option>
            </select>
          </label>

          <label class="checkbox-inline">
            <input type="checkbox" v-model="form.is_general" /> مكان عام
          </label>
          <label class="checkbox-inline">
            <input type="checkbox" v-model="form.is_active" /> مفعل
          </label>

          <div class="modal-actions">
            <button type="submit" class="primary-button">
              {{ editing ? 'حفظ التعديلات' : 'حفظ المكان' }}
            </button>
            <button type="button" class="secondary-button" @click="closeModal">إلغاء</button>
          </div>

          <div v-if="success" class="notification success-notice">{{ success }}</div>
          <div v-if="error" class="notification error-notice">{{ error }}</div>
          <ul v-if="validationErrors.length" class="validation-list modal-validation">
            <li v-for="(message, index) in validationErrors" :key="index">
              {{ message }}
            </li>
          </ul>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  data() {
    return {
      rooms: [],
      departments: [],
      currentUser: null,
      loading: false,
      error: null,
      success: null,
      validationErrors: [],
      showModal: false,
      editing: false,
      searchTerm: '',
      selectedType: 'all',
      selectedDepartment: 'all',
      showGeneralOnly: false,
      tabs: [
        { label: 'الكل', value: 'all' },
        { label: 'القاعات', value: 'hall' },
        { label: 'المختبرات', value: 'lab' },
        { label: 'المدرجات', value: 'amphitheater' },
        { label: 'المجمعات', value: 'complex' },
      ],
      form: {
        id: null,
        name: '',
        type: '',
        capacity: null,
        department_id: '',
        is_general: false,
        is_active: true,
      },
    }
  },

  computed: {
    filteredRooms() {
      return this.rooms
        .filter((room) => {
          const text = room.name ? room.name.toString().toLowerCase() : ''
          return text.includes(this.searchTerm.toLowerCase().trim())
        })
        .filter((room) => {
          if (this.selectedType === 'all') {
            return true
          }
          return room.type === this.selectedType
        })
        .filter((room) => {
          if (this.selectedDepartment === 'all') {
            return true
          }
          return (
            String(room.department_id || room.department?.id || '').trim() ===
            String(this.selectedDepartment)
          )
        })
        .filter((room) => {
          if (!this.showGeneralOnly) {
            return true
          }
          return Boolean(room.is_general)
        })
    },

    totalPlaces() {
      return this.rooms.length
    },

    assignedToDepartments() {
      return this.rooms.filter((room) => !room.is_general).length
    },

    generalPlaces() {
      return this.rooms.filter((room) => Boolean(room.is_general)).length
    },

    totalCapacity() {
      return this.rooms.reduce((sum, room) => sum + Number(room.capacity || 0), 0)
    },

    isAdmin() {
      return this.currentUser?.role === 'admin'
    },
  },

  async mounted() {
    this.currentUser = this.getCurrentUser()
    await Promise.all([this.fetchRooms(), this.fetchDepartments()])
  },

  methods: {
    async fetchRooms() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/rooms')
        this.rooms = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'تعذر تحميل الأماكن. حاول مرة أخرى.')
      } finally {
        this.loading = false
      }
    },

    async fetchDepartments() {
      try {
        const response = await api.get('/departments')
        this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'تعذر تحميل الأقسام. حاول مرة أخرى.')
      }
    },

    closeModal(clearSuccess = true) {
      this.showModal = false
      this.resetForm()
      this.error = null
      if (clearSuccess) {
        this.success = null
      }
    },

    selectType(type) {
      this.selectedType = type
    },

    editRoom(room) {
      this.editing = true
      this.showModal = true
      this.form.id = room.id
      this.form.name = room.name || ''
      this.form.type = room.type || ''
      this.form.capacity = room.capacity || null
      this.form.department_id = room.is_general
        ? ''
        : room.department_id || room.department?.id || ''
      this.form.is_general = Boolean(room.is_general)
      this.form.is_active = room.is_active !== undefined ? room.is_active : true
      this.error = null
      this.success = null
      this.validationErrors = []
    },

    async saveRoom() {
      if (!this.form.name.trim() || !this.form.type || !this.form.capacity) {
        this.error = 'الاسم والنوع والسعة مطلوبة.'
        return
      }

      if (!this.form.is_general && !this.form.department_id) {
        this.error = 'اختر القسم أو فعل المكان العام.'
        return
      }

      this.loading = true
      this.error = null
      this.success = null
      this.validationErrors = []

      const payload = {
        name: this.form.name,
        type: this.form.type,
        capacity: this.form.capacity,
        department_id: this.form.is_general ? null : this.form.department_id || null,
        is_general: this.form.is_general,
        is_active: this.form.is_active,
      }

      try {
        if (this.editing && this.form.id) {
          await api.put(`/rooms/${this.form.id}`, payload)
          this.success = 'تم تعديل المكان بنجاح.'
          await this.fetchRooms()
          this.closeModal(false)
        } else {
          await api.post('/rooms', payload)
          this.success = 'تم إضافة المكان بنجاح.'
          await this.fetchRooms()
          this.resetForm()
        }
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'تعذر حفظ المكان. حاول مرة أخرى.')
      } finally {
        this.loading = false
      }
    },

    async deleteRoom(room) {
      if (!this.isAdmin) {
        return
      }

      const confirmed = window.confirm(`هل أنت متأكد من حذف المكان ${room.name}?`)
      if (!confirmed) {
        return
      }

      this.loading = true
      this.error = null
      this.success = null
      this.validationErrors = []

      try {
        await api.delete(`/rooms/${room.id}`)
        this.success = 'تم حذف المكان بنجاح.'
        await this.fetchRooms()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'تعذر حذف المكان. حاول مرة أخرى.')
      } finally {
        this.loading = false
      }
    },

    getCurrentUser() {
      const rawUser = localStorage.getItem('user')
      return rawUser ? JSON.parse(rawUser) : null
    },

    getDepartmentName(room) {
      if (room.is_general) {
        return 'عام'
      }

      if (room.department && room.department.name) {
        return room.department.name
      }

      const departmentId = room.department_id || room.department?.id
      const matched = this.departments.find((dept) => String(dept.id) === String(departmentId))
      return matched ? matched.name : 'غير محدد'
    },

    roomTypeIcon(type) {
      switch (type) {
        case 'hall':
          return '🏛️'
        case 'lab':
          return '🧪'
        case 'amphitheater':
          return '🎤'
        case 'complex':
          return '🏢'
        default:
          return '📍'
      }
    },

    roomTypeClass(type) {
      return {
        hall: type === 'hall',
        lab: type === 'lab',
        amphitheater: type === 'amphitheater',
        complex: type === 'complex',
      }
    },

    typeLabel(type) {
      switch (type) {
        case 'hall':
          return 'قاعة'
        case 'lab':
          return 'معمل'
        case 'amphitheater':
          return 'مدرج'
        case 'complex':
          return 'مجمع'
        default:
          return 'غير معروف'
      }
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
        name: '',
        type: '',
        capacity: null,
        department_id: '',
        is_general: false,
        is_active: true,
      }
      this.validationErrors = []
    },
  },
}
</script>

<style scoped>
.rooms-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
  color: #f3f1e8;
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
  color: #f4e5b6;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.6rem);
}

.page-note {
  margin-top: 0.75rem;
  color: rgba(243, 241, 232, 0.82);
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 720px;
}

.primary-button,
.secondary-button {
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.primary-button {
  background: linear-gradient(135deg, #d8ab25, #f8d96c);
  color: #08101b;
  padding: 0.95rem 1.5rem;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.08);
  color: #f3f1e8;
  padding: 0.95rem 1.3rem;
}

.primary-button:hover,
.secondary-button:hover,
.tabs button:hover,
.room-actions button:hover,
.modal-actions button:hover {
  transform: translateY(-1px);
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 1.5rem;
}

.stat-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 103, 0.18);
  border-radius: 1rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.stat-card p {
  margin: 0 0 0.5rem;
  color: #d6c99c;
}

.stat-card strong {
  font-size: 2rem;
  display: block;
  color: #fff;
}

.panel {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  margin-bottom: 1.5rem;
}

.add-room-panel {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(216, 171, 37, 0.18);
}

.panel-title {
  margin: 0 0 1rem;
  color: #f4e9c9;
  font-size: 1.05rem;
}

.add-room-form {
  display: grid;
  gap: 1rem;
}

.add-room-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.add-room-row label {
  display: grid;
  gap: 0.55rem;
  color: #e6dcb2;
}

.add-room-form input,
.add-room-form select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  color: #f3f1e8;
}

.add-room-form .form-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 12, 29, 0.78);
  display: grid;
  place-items: center;
  padding: 1.25rem;
  z-index: 40;
}

.search-row input,
.search-row select {
  width: 100%;
  padding: 0.95rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.95rem;
  color: #f6f3ea;
}

.search-row input::placeholder {
  color: rgba(243, 241, 232, 0.64);
}

.checkbox-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: #ece3b3;
}

.checkbox-inline input {
  width: 1rem;
  height: 1rem;
}

.tabs {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tabs button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f4e9c9;
  padding: 0.75rem 1rem;
  border-radius: 999px;
}

.tabs button.active {
  background: linear-gradient(135deg, #d8ab25, #f8d96c);
  color: #08101b;
  border-color: transparent;
}

.rooms-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.room-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 103, 0.12);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: grid;
  gap: 0.85rem;
}

.room-badge {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.room-icon {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  font-size: 1.4rem;
}

.room-icon.hall {
  background: rgba(216, 171, 37, 0.18);
}

.room-icon.lab {
  background: rgba(65, 145, 255, 0.16);
}

.room-icon.amphitheater {
  background: rgba(255, 129, 129, 0.16);
}

.room-icon.complex {
  background: rgba(120, 181, 82, 0.16);
}

.room-name {
  font-size: 1.05rem;
  color: #fff;
}

.room-detail {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: #dcd3af;
}

.room-detail strong {
  color: #fff;
}

.room-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  width: fit-content;
  font-weight: 700;
}

.room-status.active {
  background: rgba(97, 199, 142, 0.16);
  color: #d9f7e5;
}

.room-status.inactive {
  background: rgba(248, 98, 98, 0.16);
  color: #ffe3e3;
}

.room-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.room-actions button {
  flex: 1;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  color: #f3f1e8;
  cursor: pointer;
}

.room-actions button.danger {
  background: rgba(248, 98, 98, 0.16);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 1.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 1rem;
  color: #dcd3af;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 12, 29, 0.78);
  display: grid;
  place-items: center;
  padding: 1.25rem;
  z-index: 40;
}

.modal-card {
  width: min(100%, 560px);
  background: #081627;
  border: 1px solid rgba(255, 215, 103, 0.16);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.modal-header h2 {
  margin: 0;
}

.close-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  width: 2.5rem;
  height: 2.5rem;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
}

.modal-form {
  display: grid;
  gap: 1rem;
}

.modal-form label {
  display: grid;
  gap: 0.5rem;
  color: #e6dcb2;
}

.modal-form input,
.modal-form select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  color: #f3f1e8;
}

.modal-actions {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.notification {
  border-radius: 0.95rem;
  padding: 0.9rem 1rem;
  margin-top: 0.75rem;
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

.status-box {
  padding: 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: #f3f1e8;
  margin-bottom: 1.5rem;
}

.status-error {
  border: 1px solid rgba(248, 98, 98, 0.2);
}

.validation-list {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
  color: #f8d7da;
}

.validation-list li {
  margin-bottom: 0.4rem;
}

@media (max-width: 880px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page-header,
  .modal-header {
    flex-direction: column;
    align-items: stretch;
  }

  .room-actions {
    flex-direction: column;
  }
}
</style>
