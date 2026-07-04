<template>
  <section class="resource-page">
    <h1>Regulations Management</h1>

    <div class="selector-row">
      <label>
        Choose Regulation
        <select v-model="selectedId" @change="onSelect">
          <option value="">-- Choose Regulation --</option>
          <option v-for="r in regulations" :key="r.id" :value="String(r.id)">
            {{ r.name }} ({{ r.year || '—' }})
          </option>
        </select>
      </label>
    </div>

    <div v-if="!loading && regulations.length === 0" class="status info">
      No regulations found. Run local regulation import command first.
    </div>

    <div v-if="selected" class="details-card">
      <div class="details-header">
        <div>
          <h2>{{ selected.name }}</h2>
          <p><strong>Year:</strong> {{ selected.year || '—' }}</p>
          <p><strong>Description:</strong> {{ selected.description || '—' }}</p>
          <p><strong>Active:</strong> {{ selected.is_active ? 'Yes' : 'No' }}</p>
        </div>

        <div class="summary-pill-row">
          <span class="stat-pill" v-if="selected.counts">
            Departments: {{ selected.counts.departments_count }}
          </span>
          <span class="stat-pill" v-if="selected.counts">
            Programs: {{ selected.counts.programs_count }}
          </span>
          <span class="stat-pill" v-if="selected.counts">
            Courses: {{ selected.counts.courses_count }}
          </span>
          <span class="stat-pill" v-if="selected.counts">
            Offerings: {{ selected.counts.course_offerings_count }}
          </span>
          <span class="stat-pill" v-if="selected.counts">
            Level counts: {{ selected.counts.level_student_counts_count }}
          </span>
          <span class="stat-pill" v-if="selected.counts">
            Registration counts: {{ selected.counts.course_registration_counts_count }}
          </span>
        </div>
      </div>

      <div v-if="selected.editable_sections?.length" class="selector-row">
        <label>
          What do you want to edit?
          <select v-model="activeSection">
            <option value="">-- Choose Section --</option>
            <option
              v-for="section in selected.editable_sections"
              :key="section.key"
              :value="section.key"
            >
              {{ section.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="section-content">
        <div v-if="activeSection === 'basic_info'" class="section-panel">
          <div class="section-card">
            <h3>Basic Info</h3>
            <form class="section-form" @submit.prevent="submitBasicInfo">
              <label>
                Name
                <input type="text" v-model="basicInfoForm.name" required />
              </label>
              <label>
                Year
                <input type="number" v-model.number="basicInfoForm.year" />
              </label>
              <label>
                Description
                <textarea v-model="basicInfoForm.description" rows="4"></textarea>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="basicInfoForm.is_active" />
                Active
              </label>
              <div class="form-actions">
                <button type="submit" :disabled="loading">Save Basic Info</button>
              </div>
            </form>
          </div>
        </div>

        <div v-else-if="activeSection === 'departments'" class="section-panel">
          <div class="section-card">
            <h3>Departments</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Department Name
                <input type="text" v-model="departmentForm.name" placeholder="Department name" />
              </label>
              <label>
                Department Code
                <input type="text" v-model="departmentForm.code" placeholder="Department code" />
              </label>
              <label>
                Description
                <textarea
                  v-model="departmentForm.description"
                  placeholder="Optional description"
                ></textarea>
              </label>
              <div class="form-actions">
                <button type="button" @click="submitDepartment" :disabled="loading">
                  {{ departmentForm.id ? 'Update Department' : 'Create Department' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="departmentForm.id"
                  @click="cancelDepartmentEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in departments" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.code || '—' }}</td>
                  <td>{{ item.description || '—' }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditDepartment(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteDepartment(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="departments.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'programs'" class="section-panel">
          <div class="section-card">
            <h3>Programs</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Program Name
                <input type="text" v-model="programForm.name" placeholder="Program name" />
              </label>
              <label>
                Program Code
                <input type="text" v-model="programForm.code" placeholder="Program code" />
              </label>
              <label>
                Type
                <input type="text" v-model="programForm.type" placeholder="Type" />
              </label>
              <label>
                Department
                <select v-model="programForm.department_id">
                  <option value="">None</option>
                  <option
                    v-for="department in departments"
                    :key="department.id"
                    :value="department.id"
                  >
                    {{ department.name }}
                  </option>
                </select>
              </label>
              <label>
                Description
                <textarea
                  v-model="programForm.description"
                  placeholder="Optional description"
                ></textarea>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="programForm.is_active" />
                Active
              </label>
              <div class="form-actions">
                <button type="button" @click="submitProgram" :disabled="loading">
                  {{ programForm.id ? 'Update Program' : 'Create Program' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="programForm.id"
                  @click="cancelProgramEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in programs" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.code || '—' }}</td>
                  <td>{{ item.type || '—' }}</td>
                  <td>{{ item.department?.name || '—' }}</td>
                  <td>{{ item.is_active ? 'Yes' : 'No' }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditProgram(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteProgram(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="programs.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'courses'" class="section-panel">
          <div class="section-card">
            <h3>Courses</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Course Name
                <input type="text" v-model="courseForm.name" placeholder="Course name" />
              </label>
              <label>
                Course Code
                <input type="text" v-model="courseForm.code" placeholder="Course code" />
              </label>
              <label>
                Department
                <select v-model="courseForm.department_id">
                  <option value="">None</option>
                  <option
                    v-for="department in departments"
                    :key="department.id"
                    :value="department.id"
                  >
                    {{ department.name }}
                  </option>
                </select>
              </label>
              <label>
                Program
                <select v-model="courseForm.program_id">
                  <option value="">None</option>
                  <option v-for="program in programs" :key="program.id" :value="program.id">
                    {{ program.name }}
                  </option>
                </select>
              </label>
              <label>
                Level
                <select v-model="courseForm.level_id">
                  <option value="">None</option>
                  <option v-for="level in levels" :key="level.id" :value="level.id">
                    {{ level.name || level.code || level.id }}
                  </option>
                </select>
              </label>
              <label>
                Semester
                <input type="text" v-model="courseForm.semester" placeholder="First Semester" />
              </label>
              <label>
                Type
                <input
                  type="text"
                  v-model="courseForm.course_type"
                  placeholder="elective or core"
                />
              </label>
              <label>
                Credit hours
                <input type="number" v-model="courseForm.credit_hours" placeholder="Credit hours" />
              </label>
              <div class="form-actions">
                <button type="button" @click="submitCourse" :disabled="loading">
                  {{ courseForm.id ? 'Update Course' : 'Create Course' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="courseForm.id"
                  @click="cancelCourseEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Program</th>
                  <th>Level</th>
                  <th>Semester</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredCourses" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.code || '—' }}</td>
                  <td>{{ item.program?.name || '—' }}</td>
                  <td>{{ item.level?.name || item.level?.code || '—' }}</td>
                  <td>{{ item.semester || '—' }}</td>
                  <td>{{ item.course_type || '—' }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditCourse(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-secondary"
                      v-if="isAdmin"
                      @click="editCourseDuration(item)"
                    >
                      Durations
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteCourse(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredCourses.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'course_durations'" class="section-panel">
          <div class="section-card">
            <h3>Course Durations</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Selected course
                <select v-model="durationForm.id">
                  <option value="">Select a course</option>
                  <option v-for="item in filteredCourses" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </label>
              <label>
                Lecture hours
                <input type="number" v-model="durationForm.lecture_hours" />
              </label>
              <label>
                Section hours
                <input type="number" v-model="durationForm.section_hours" />
              </label>
              <label>
                Midterm duration
                <input type="number" v-model="durationForm.midterm_duration" />
              </label>
              <label>
                Final duration
                <input type="number" v-model="durationForm.final_duration" />
              </label>
              <label>
                Practical exam duration
                <input type="number" v-model="durationForm.practical_exam_duration" />
              </label>
              <div class="form-actions">
                <button type="button" @click="submitDuration" :disabled="loading">
                  Save durations
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  @click="resetDurationForm"
                  :disabled="loading"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'elective_offerings'" class="section-panel">
          <div class="section-card">
            <h3>Elective Offerings</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Course
                <select v-model="offeringForm.course_id">
                  <option value="">Select course</option>
                  <option v-for="item in filteredCourses" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </label>
              <label>
                Semester
                <select v-model="offeringForm.semester">
                  <option>First Semester</option>
                  <option>Second Semester</option>
                  <option>Summer Semester</option>
                </select>
              </label>
              <label>
                Status
                <select v-model="offeringForm.status">
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="pending">pending</option>
                </select>
              </label>
              <label>
                Opening rule
                <select v-model="offeringForm.opening_rule">
                  <option value="manual">manual</option>
                  <option value="by_enrollment">by_enrollment</option>
                </select>
              </label>
              <label>
                Minimum students
                <input type="number" v-model="offeringForm.min_students" />
              </label>
              <label>
                Academic year
                <input type="text" v-model="offeringForm.academic_year" placeholder="2025/2026" />
              </label>
              <label>
                Notes
                <textarea v-model="offeringForm.note" placeholder="Optional note"></textarea>
              </label>
              <div class="form-actions">
                <button type="button" @click="submitOffering" :disabled="loading">
                  {{ offeringForm.id ? 'Update Offering' : 'Create Offering' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="offeringForm.id"
                  @click="cancelOfferingEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Academic Year</th>
                  <th>Current Students</th>
                  <th>Status</th>
                  <th>Rule</th>
                  <th>Min students</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredOfferings" :key="item.id">
                  <td>{{ item.course?.name || item.course_id }}</td>
                  <td>{{ item.semester }}</td>
                  <td>{{ item.academic_year || '—' }}</td>
                  <td>{{ item.current_students ?? '—' }}</td>
                  <td>{{ item.status }}</td>
                  <td>{{ item.opening_rule }}</td>
                  <td>{{ item.min_students ?? '—' }}</td>
                  <td>{{ item.note || '—' }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditOffering(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteOffering(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredOfferings.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'level_student_counts'" class="section-panel">
          <div class="section-card">
            <h3>Level Student Counts</h3>
            <div v-if="isAdmin" class="section-form">
              <label>
                Department
                <select v-model="levelCountForm.department_id">
                  <option value="">Select department</option>
                  <option
                    v-for="department in departments"
                    :key="department.id"
                    :value="department.id"
                  >
                    {{ department.name }}
                  </option>
                </select>
              </label>
              <label>
                Program
                <select v-model="levelCountForm.program_id">
                  <option value="">None</option>
                  <option v-for="program in programs" :key="program.id" :value="program.id">
                    {{ program.name }}
                  </option>
                </select>
              </label>
              <label>
                Level
                <select v-model="levelCountForm.level_id">
                  <option value="">Select level</option>
                  <option v-for="level in levels" :key="level.id" :value="level.id">
                    {{ level.name || level.code || level.id }}
                  </option>
                </select>
              </label>
              <label>
                Semester
                <select v-model="levelCountForm.semester">
                  <option>First Semester</option>
                  <option>Second Semester</option>
                  <option>Summer Semester</option>
                </select>
              </label>
              <label>
                Students count
                <input type="number" v-model="levelCountForm.students_count" />
              </label>
              <label>
                Max group size
                <input type="number" v-model="levelCountForm.max_group_size" />
              </label>
              <div class="form-actions">
                <button type="button" @click="submitLevelCount" :disabled="loading">
                  {{ levelCountForm.id ? 'Update Count' : 'Create Count' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="levelCountForm.id"
                  @click="cancelLevelCountEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Level</th>
                  <th>Semester</th>
                  <th>Students</th>
                  <th>Max group size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredLevelCounts" :key="item.id">
                  <td>{{ item.department?.name || '—' }}</td>
                  <td>{{ item.program?.name || '—' }}</td>
                  <td>{{ item.level?.name || item.level?.code || '—' }}</td>
                  <td>{{ item.semester }}</td>
                  <td>{{ item.students_count }}</td>
                  <td>{{ item.max_group_size }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditLevelCount(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteLevelCount(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredLevelCounts.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>

        <div v-else-if="activeSection === 'course_registration_counts'" class="section-panel">
          <div class="section-card">
            <h3>Course Registration Counts</h3>
            <div v-if="isAdmin" class="section-actions">
              <label>
                Batch semester
                <select v-model="courseBatchSemester">
                  <option>First Semester</option>
                  <option>Second Semester</option>
                  <option>Summer Semester</option>
                </select>
              </label>
              <label>
                Student level
                <select v-model="courseBatchStudentLevelId">
                  <option value="">Any student level</option>
                  <option
                    v-for="level in levels"
                    :key="`batch_student_${level.id}`"
                    :value="level.id"
                  >
                    {{ level.name || level.code || level.id }}
                  </option>
                </select>
              </label>
              <button
                type="button"
                class="button-primary"
                @click="generateCourseScheduleBatches"
                :disabled="courseBatchLoading"
              >
                {{ courseBatchLoading ? 'Generating...' : 'Generate Course Batches' }}
              </button>
            </div>

            <div v-if="courseBatchResult" class="batch-result">
              <p class="status success" v-if="courseBatchResult.generated_batches_count >= 0">
                Generated {{ courseBatchResult.generated_batches_count }} course schedule batches.
              </p>
              <div v-if="courseBatchResult.warnings?.length" class="status warning">
                <p>Warnings:</p>
                <ul>
                  <li v-for="(warning, idx) in courseBatchResult.warnings" :key="idx">
                    {{ warning }}
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="isAdmin" class="section-form">
              <label>
                Course
                <select v-model="registrationCountForm.course_id">
                  <option value="">Select course</option>
                  <option v-for="item in filteredCourses" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </label>
              <label>
                Department
                <select v-model="registrationCountForm.department_id">
                  <option value="">None</option>
                  <option
                    v-for="department in departments"
                    :key="department.id"
                    :value="department.id"
                  >
                    {{ department.name }}
                  </option>
                </select>
              </label>
              <label>
                Program
                <select v-model="registrationCountForm.program_id">
                  <option value="">None</option>
                  <option v-for="program in programs" :key="program.id" :value="program.id">
                    {{ program.name }}
                  </option>
                </select>
              </label>
              <label>
                Level
                <select v-model="registrationCountForm.level_id">
                  <option value="">None</option>
                  <option v-for="level in levels" :key="level.id" :value="level.id">
                    {{ level.name || level.code || level.id }}
                  </option>
                </select>
              </label>
              <label>
                Student Level
                <select v-model="registrationCountForm.student_level_id">
                  <option value="">Same as course level</option>
                  <option v-for="level in levels" :key="`student_${level.id}`" :value="level.id">
                    {{ level.name || level.code || level.id }}
                  </option>
                </select>
              </label>
              <label>
                Semester
                <select v-model="registrationCountForm.semester">
                  <option>First Semester</option>
                  <option>Second Semester</option>
                  <option>Summer Semester</option>
                </select>
              </label>
              <label>
                Students count
                <input type="number" v-model="registrationCountForm.students_count" />
              </label>
              <label>
                Status
                <select v-model="registrationCountForm.status">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <div class="form-actions">
                <button type="button" @click="submitRegistrationCount" :disabled="loading">
                  {{ registrationCountForm.id ? 'Update Count' : 'Create Count' }}
                </button>
                <button
                  type="button"
                  class="button-secondary"
                  v-if="registrationCountForm.id"
                  @click="cancelRegistrationCountEdit"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>

            <table class="section-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Course Level</th>
                  <th>Student Level</th>
                  <th>Semester</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredRegistrationCounts" :key="item.id">
                  <td>{{ item.course?.name || '—' }}</td>
                  <td>{{ item.department?.name || '—' }}</td>
                  <td>{{ item.program?.name || '—' }}</td>
                  <td>{{ item.level?.name || item.level?.code || '—' }}</td>
                  <td>
                    {{
                      item.studentLevel?.name ||
                      item.studentLevel?.code ||
                      item.level?.name ||
                      item.level?.code ||
                      '—'
                    }}
                  </td>
                  <td>{{ item.semester }}</td>
                  <td>{{ item.students_count }}</td>
                  <td>{{ item.status }}</td>
                  <td class="actions-cell">
                    <button type="button" v-if="isAdmin" @click="startEditRegistrationCount(item)">
                      Edit
                    </button>
                    <button
                      type="button"
                      class="button-danger"
                      v-if="isAdmin"
                      @click="deleteRegistrationCount(item)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredRegistrationCounts.length === 0" class="status info">
              No data found for this section.
            </div>
          </div>
        </div>
      </div>

      <div v-if="sectionErrors" class="status error">
        {{ sectionErrors }}
      </div>
    </div>

    <div v-if="loading" class="status">Loading regulations...</div>
    <div v-else-if="error" class="status error">{{ error }}</div>
    <div v-else-if="success" class="status success">{{ success }}</div>
  </section>
</template>

<script>
import api from '../services/api'
import { parseApiError } from '../services/apiError'

export default {
  name: 'Regulations',
  data() {
    return {
      currentUser: null,
      regulations: [],
      departments: [],
      programs: [],
      levels: [],
      courses: [],
      courseOfferings: [],
      levelStudentCounts: [],
      courseRegistrationCounts: [],
      loading: false,
      error: null,
      success: null,
      selectedId: '',
      selected: null,
      activeSection: '',
      basicInfoForm: {
        name: '',
        year: null,
        description: '',
        is_active: false,
      },
      departmentForm: {
        id: null,
        name: '',
        code: '',
        description: '',
      },
      programForm: {
        id: null,
        name: '',
        code: '',
        type: '',
        department_id: '',
        description: '',
        is_active: true,
      },
      courseForm: {
        id: null,
        name: '',
        code: '',
        credit_hours: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: '',
        course_type: '',
      },
      durationForm: {
        id: null,
        lecture_hours: '',
        section_hours: '',
        midterm_duration: '',
        final_duration: '',
        practical_exam_duration: '',
      },
      offeringForm: {
        id: null,
        course_id: '',
        semester: 'First Semester',
        academic_year: '',
        status: 'pending',
        opening_rule: 'manual',
        min_students: '',
        note: '',
      },
      levelCountForm: {
        id: null,
        department_id: '',
        program_id: '',
        level_id: '',
        semester: 'First Semester',
        students_count: '',
        max_group_size: '',
      },
      registrationCountForm: {
        id: null,
        course_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        student_level_id: '',
        semester: 'First Semester',
        students_count: '',
        status: 'active',
      },
      courseBatchSemester: 'First Semester',
      courseBatchStudentLevelId: '',
      courseBatchResult: null,
      courseBatchLoading: false,
      validationErrors: [],
      sectionErrors: null,
    }
  },
  computed: {
    isAdmin() {
      return this.currentUser?.role === 'admin'
    },
    filteredCourses() {
      return this.courses.filter((item) => String(item.regulation_id) === String(this.selectedId))
    },
    filteredOfferings() {
      return this.courseOfferings.filter(
        (item) => String(item.regulation_id) === String(this.selectedId),
      )
    },
    filteredLevelCounts() {
      return this.levelStudentCounts.filter(
        (item) => String(item.regulation_id) === String(this.selectedId),
      )
    },
    filteredRegistrationCounts() {
      return this.courseRegistrationCounts.filter(
        (item) => String(item.regulation_id) === String(this.selectedId),
      )
    },
    sectionLabels() {
      return {
        basic_info: 'Basic Info',
        departments: 'Departments',
        programs: 'Programs',
        courses: 'Courses',
        course_durations: 'Course Durations',
        elective_offerings: 'Elective Offerings',
        level_student_counts: 'Level Student Counts',
        course_registration_counts: 'Course Registration Counts',
      }
    },
  },
  watch: {
    activeSection(newSection) {
      if (!newSection || !this.selectedId) {
        return
      }
      this.loadSectionData()
    },
  },
  async mounted() {
    this.currentUser = this.getCurrentUser()
    await this.fetchRegulations()
  },
  methods: {
    async fetchGlobalData() {
      try {
        const [departments, programs, levels, courses, offerings, levelCounts, registrationCounts] =
          await Promise.all([
            api.get('/departments'),
            api.get('/programs'),
            api.get('/levels'),
            api.get('/courses', {
              params: this.selectedId ? { regulation_id: this.selectedId } : {},
            }),
            api.get('/course-offerings', {
              params: this.selectedId ? { regulation_id: this.selectedId } : {},
            }),
            api.get('/level-student-counts', {
              params: this.selectedId ? { regulation_id: this.selectedId } : {},
            }),
            api.get('/course-registration-counts', {
              params: this.selectedId ? { regulation_id: this.selectedId } : {},
            }),
          ])

        this.departments = Array.isArray(departments.data)
          ? departments.data
          : departments.data.data || []
        this.programs = Array.isArray(programs.data) ? programs.data : programs.data.data || []
        this.levels = Array.isArray(levels.data) ? levels.data : levels.data.data || []
        this.courses = Array.isArray(courses.data) ? courses.data : courses.data.data || []
        this.courseOfferings = Array.isArray(offerings.data)
          ? offerings.data
          : offerings.data.data || []
        this.levelStudentCounts = Array.isArray(levelCounts.data)
          ? levelCounts.data
          : levelCounts.data.data || []
        this.courseRegistrationCounts = Array.isArray(registrationCounts.data)
          ? registrationCounts.data
          : registrationCounts.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchRegulations() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/regulations')
        this.regulations = Array.isArray(response.data) ? response.data : response.data.data || []

        if (this.selectedId) {
          const found = this.regulations.find((r) => String(r.id) === String(this.selectedId))
          if (!found) {
            this.selectedId = ''
            this.selected = null
          }
        }
      } catch (err) {
        console.error(err)
        this.error = 'Unable to load regulations. Please try again.'
      } finally {
        this.loading = false
      }
    },
    async fetchRegulationDetails(id) {
      this.error = null
      this.sectionErrors = null
      try {
        const response = await api.get(`/regulations/${id}/details`)
        this.selected = {
          ...response.data.regulation,
          counts: response.data.counts,
          editable_sections: response.data.editable_sections,
        }
        this.activeSection = ''
        this.basicInfoForm = {
          name: this.selected.name || '',
          year: this.selected.year || null,
          description: this.selected.description || '',
          is_active: this.selected.is_active,
        }
      } catch (err) {
        console.error(err)
        this.error = 'Unable to load regulation details. Please try again.'
      }
    },
    async onSelect() {
      if (!this.selectedId) {
        this.selected = null
        this.activeSection = ''
        return
      }

      this.loading = true
      try {
        await this.fetchRegulationDetails(this.selectedId)
        await this.fetchGlobalData()
      } finally {
        this.loading = false
      }
    },
    async submitBasicInfo() {
      if (!this.selected) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      this.success = null
      try {
        await api.put(`/regulations/${this.selected.id}`, {
          name: this.basicInfoForm.name,
          year: this.basicInfoForm.year,
          description: this.basicInfoForm.description,
          is_active: this.basicInfoForm.is_active,
        })
        this.success = 'Basic info saved successfully.'
        await this.fetchRegulations()
        await this.fetchRegulationDetails(this.selectedId)
      } catch (err) {
        console.error(err)
        const { summary } = parseApiError(err, 'Unable to save regulation info. Please try again.')
        this.sectionErrors = summary
      } finally {
        this.loading = false
      }
    },
    handleApiError(error, fallbackMessage) {
      const { summary, errors } = parseApiError(error, fallbackMessage)
      this.sectionErrors = summary
      this.validationErrors = errors
    },
    getCurrentUser() {
      const rawUser = localStorage.getItem('user')
      return rawUser ? JSON.parse(rawUser) : null
    },
    async submitDepartment() {
      if (!this.departmentForm.name.trim() || !this.departmentForm.code.trim()) {
        this.sectionErrors = 'Department name and code are required.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          name: this.departmentForm.name,
          code: this.departmentForm.code,
          description: this.departmentForm.description,
        }
        if (this.departmentForm.id) {
          await api.put(`/departments/${this.departmentForm.id}`, payload)
          this.success = 'Department updated successfully.'
        } else {
          await api.post('/departments', payload)
          this.success = 'Department created successfully.'
        }
        this.resetDepartmentForm()
        await this.fetchDepartments()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save department. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditDepartment(item) {
      this.departmentForm = {
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
      }
      this.sectionErrors = null
    },
    cancelDepartmentEdit() {
      this.resetDepartmentForm()
      this.sectionErrors = null
    },
    async deleteDepartment(item) {
      if (!confirm(`Delete department "${item.name}"?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/departments/${item.id}`)
        this.success = 'Department deleted successfully.'
        await this.fetchDepartments()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete department. Please try again.')
      } finally {
        this.loading = false
      }
    },
    resetDepartmentForm() {
      this.departmentForm = {
        id: null,
        name: '',
        code: '',
        description: '',
      }
    },
    async submitProgram() {
      if (!this.programForm.name.trim()) {
        this.sectionErrors = 'Program name is required.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          name: this.programForm.name,
          code: this.programForm.code || null,
          type: this.programForm.type || null,
          department_id: this.programForm.department_id || null,
          description: this.programForm.description || null,
          is_active: Boolean(this.programForm.is_active),
        }
        if (this.programForm.id) {
          await api.put(`/programs/${this.programForm.id}`, payload)
          this.success = 'Program updated successfully.'
        } else {
          await api.post('/programs', payload)
          this.success = 'Program created successfully.'
        }
        this.resetProgramForm()
        await this.fetchPrograms()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save program. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditProgram(item) {
      this.programForm = {
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        type: item.type || '',
        department_id: item.department?.id || '',
        description: item.description || '',
        is_active: Boolean(item.is_active),
      }
      this.sectionErrors = null
    },
    cancelProgramEdit() {
      this.resetProgramForm()
      this.sectionErrors = null
    },
    async deleteProgram(item) {
      if (!confirm(`Delete program "${item.name}"?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/programs/${item.id}`)
        this.success = 'Program deleted successfully.'
        await this.fetchPrograms()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete program. Please try again.')
      } finally {
        this.loading = false
      }
    },
    resetProgramForm() {
      this.programForm = {
        id: null,
        name: '',
        code: '',
        type: '',
        department_id: '',
        description: '',
        is_active: true,
      }
    },
    async submitCourse() {
      if (!this.courseForm.name.trim()) {
        this.sectionErrors = 'Course name is required.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          name: this.courseForm.name,
          code: this.courseForm.code || null,
          credit_hours: this.courseForm.credit_hours || null,
          department_id: this.courseForm.department_id || null,
          program_id: this.courseForm.program_id || null,
          level_id: this.courseForm.level_id || null,
          semester: this.courseForm.semester || null,
          course_type: this.courseForm.course_type || null,
          regulation_id: this.selectedId || null,
        }
        if (this.courseForm.id) {
          await api.put(`/courses/${this.courseForm.id}`, payload)
          this.success = 'Course updated successfully.'
        } else {
          await api.post('/courses', payload)
          this.success = 'Course created successfully.'
        }
        this.resetCourseForm()
        await this.fetchCourses()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save course. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditCourse(item) {
      this.courseForm = {
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        credit_hours: item.credit_hours || '',
        department_id: item.department?.id || '',
        program_id: item.program?.id || '',
        level_id: item.level?.id || '',
        semester: item.semester || '',
        course_type: item.course_type || '',
      }
      this.sectionErrors = null
    },
    cancelCourseEdit() {
      this.resetCourseForm()
      this.sectionErrors = null
    },
    async deleteCourse(item) {
      if (!confirm(`Delete course "${item.name}"?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/courses/${item.id}`)
        this.success = 'Course deleted successfully.'
        await this.fetchCourses()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete course. Please try again.')
      } finally {
        this.loading = false
      }
    },
    resetCourseForm() {
      this.courseForm = {
        id: null,
        name: '',
        code: '',
        credit_hours: '',
        department_id: '',
        program_id: '',
        level_id: '',
        semester: '',
        course_type: '',
      }
    },
    async submitDuration() {
      if (!this.durationForm.id) {
        this.sectionErrors = 'Select a course to update duration fields.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          lecture_hours: this.durationForm.lecture_hours || null,
          section_hours: this.durationForm.section_hours || null,
          midterm_duration: this.durationForm.midterm_duration || null,
          final_duration: this.durationForm.final_duration || null,
          practical_exam_duration: this.durationForm.practical_exam_duration || null,
        }
        await api.put(`/courses/${this.durationForm.id}`, payload)
        this.success = 'Course duration updated successfully.'
        this.resetDurationForm()
        await this.fetchCourses()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save course duration. Please try again.')
      } finally {
        this.loading = false
      }
    },
    editCourseDuration(item) {
      this.durationForm = {
        id: item.id,
        lecture_hours: item.lecture_hours || '',
        section_hours: item.section_hours || '',
        midterm_duration: item.midterm_duration || '',
        final_duration: item.final_duration || '',
        practical_exam_duration: item.practical_exam_duration || '',
      }
      this.activeSection = 'course_durations'
      this.sectionErrors = null
    },
    resetDurationForm() {
      this.durationForm = {
        id: null,
        lecture_hours: '',
        section_hours: '',
        midterm_duration: '',
        final_duration: '',
        practical_exam_duration: '',
      }
    },
    async submitOffering() {
      if (!this.offeringForm.course_id) {
        this.sectionErrors = 'Course selection is required for elective offerings.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          course_id: this.offeringForm.course_id,
          regulation_id: this.selectedId,
          semester: this.offeringForm.semester,
          academic_year: this.offeringForm.academic_year || null,
          status: this.offeringForm.status,
          opening_rule: this.offeringForm.opening_rule,
          min_students: this.offeringForm.min_students || null,
          note: this.offeringForm.note || null,
        }
        if (this.offeringForm.id) {
          await api.put(`/course-offerings/${this.offeringForm.id}`, payload)
          this.success = 'Course offering updated successfully.'
        } else {
          await api.post('/course-offerings', payload)
          this.success = 'Course offering created successfully.'
        }
        this.resetOfferingForm()
        await this.fetchCourseOfferings()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save course offering. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditOffering(item) {
      this.offeringForm = {
        id: item.id,
        course_id: item.course?.id || item.course_id || '',
        semester: item.semester || 'First Semester',
        academic_year: item.academic_year || '',
        status: item.status || 'pending',
        opening_rule: item.opening_rule || 'manual',
        min_students: item.min_students || '',
        note: item.note || '',
      }
      this.sectionErrors = null
      this.activeSection = 'elective_offerings'
    },
    cancelOfferingEdit() {
      this.resetOfferingForm()
      this.sectionErrors = null
    },
    async deleteOffering(item) {
      if (!confirm(`Delete course offering for course ID ${item.course_id}?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/course-offerings/${item.id}`)
        this.success = 'Course offering deleted successfully.'
        await this.fetchCourseOfferings()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete course offering. Please try again.')
      } finally {
        this.loading = false
      }
    },
    resetOfferingForm() {
      this.offeringForm = {
        id: null,
        course_id: '',
        semester: 'First Semester',
        academic_year: '',
        status: 'pending',
        opening_rule: 'manual',
        min_students: '',
        note: '',
      }
    },
    async submitLevelCount() {
      if (!this.levelCountForm.department_id || !this.levelCountForm.level_id) {
        this.sectionErrors = 'Department and level are required.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          regulation_id: this.selectedId,
          department_id: this.levelCountForm.department_id,
          program_id: this.levelCountForm.program_id || null,
          level_id: this.levelCountForm.level_id,
          semester: this.levelCountForm.semester,
          students_count: this.levelCountForm.students_count || 0,
          max_group_size: this.levelCountForm.max_group_size || 1,
        }
        if (this.levelCountForm.id) {
          await api.put(`/level-student-counts/${this.levelCountForm.id}`, payload)
          this.success = 'Level student count updated successfully.'
        } else {
          await api.post('/level-student-counts', payload)
          this.success = 'Level student count created successfully.'
        }
        this.resetLevelCountForm()
        await this.fetchLevelStudentCounts()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save level student count. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditLevelCount(item) {
      this.levelCountForm = {
        id: item.id,
        department_id: item.department?.id || item.department_id || '',
        program_id: item.program?.id || item.program_id || '',
        level_id: item.level?.id || item.level_id || '',
        semester: item.semester || 'First Semester',
        students_count: item.students_count || '',
        max_group_size: item.max_group_size || '',
      }
      this.sectionErrors = null
      this.activeSection = 'level_student_counts'
    },
    cancelLevelCountEdit() {
      this.resetLevelCountForm()
      this.sectionErrors = null
    },
    async deleteLevelCount(item) {
      if (!confirm(`Delete level student count ID ${item.id}?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/level-student-counts/${item.id}`)
        this.success = 'Level student count deleted successfully.'
        await this.fetchLevelStudentCounts()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete level student count. Please try again.')
      } finally {
        this.loading = false
      }
    },
    resetLevelCountForm() {
      this.levelCountForm = {
        id: null,
        department_id: '',
        program_id: '',
        level_id: '',
        semester: 'First Semester',
        students_count: '',
        max_group_size: '',
      }
    },
    async submitRegistrationCount() {
      if (!this.registrationCountForm.course_id) {
        this.sectionErrors = 'Course is required.'
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        const payload = {
          course_id: this.registrationCountForm.course_id,
          regulation_id: this.selectedId,
          department_id: this.registrationCountForm.department_id || null,
          program_id: this.registrationCountForm.program_id || null,
          level_id: this.registrationCountForm.level_id || null,
          student_level_id: this.registrationCountForm.student_level_id || null,
          semester: this.registrationCountForm.semester,
          students_count: this.registrationCountForm.students_count || 0,
          status: this.registrationCountForm.status,
        }
        if (this.registrationCountForm.id) {
          await api.put(`/course-registration-counts/${this.registrationCountForm.id}`, payload)
          this.success = 'Course registration count updated successfully.'
        } else {
          await api.post('/course-registration-counts', payload)
          this.success = 'Course registration count created successfully.'
        }
        this.resetRegistrationCountForm()
        await this.fetchCourseRegistrationCounts()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to save course registration count. Please try again.')
      } finally {
        this.loading = false
      }
    },
    startEditRegistrationCount(item) {
      this.registrationCountForm = {
        id: item.id,
        course_id: item.course?.id || item.course_id || '',
        department_id: item.department?.id || item.department_id || '',
        program_id: item.program?.id || item.program_id || '',
        level_id: item.level?.id || item.level_id || '',
        student_level_id:
          item.studentLevel?.id || item.student_level_id || item.level?.id || item.level_id || '',
        semester: item.semester || 'First Semester',
        students_count: item.students_count || '',
        status: item.status || 'active',
      }
      this.sectionErrors = null
      this.activeSection = 'course_registration_counts'
    },
    cancelRegistrationCountEdit() {
      this.resetRegistrationCountForm()
      this.sectionErrors = null
    },
    async deleteRegistrationCount(item) {
      if (!confirm(`Delete course registration count ID ${item.id}?`)) {
        return
      }
      this.loading = true
      this.sectionErrors = null
      try {
        await api.delete(`/course-registration-counts/${item.id}`)
        this.success = 'Course registration count deleted successfully.'
        await this.fetchCourseRegistrationCounts()
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to delete course registration count. Please try again.')
      } finally {
        this.loading = false
      }
    },
    async generateCourseScheduleBatches() {
      if (!this.selectedId) {
        this.sectionErrors = 'Select a regulation before generating course batches.'
        return
      }

      this.courseBatchLoading = true
      this.sectionErrors = null
      this.success = null
      this.courseBatchResult = null

      try {
        const response = await api.post('/course-schedule-batches/generate', {
          regulation_id: this.selectedId,
          semester: this.courseBatchSemester,
          student_level_id: this.courseBatchStudentLevelId || null,
        })

        this.courseBatchResult = response.data
        this.success = `Generated ${response.data.generated_batches_count} course schedule batches.`
      } catch (err) {
        console.error(err)
        this.handleApiError(err, 'Unable to generate course schedule batches. Please try again.')
      } finally {
        this.courseBatchLoading = false
      }
    },
    resetRegistrationCountForm() {
      this.registrationCountForm = {
        id: null,
        course_id: '',
        department_id: '',
        program_id: '',
        level_id: '',
        student_level_id: '',
        semester: 'First Semester',
        students_count: '',
        status: 'active',
      }
    },
    async fetchDepartments() {
      try {
        const response = await api.get('/departments')
        this.departments = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchPrograms() {
      try {
        const response = await api.get('/programs')
        this.programs = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchLevels() {
      try {
        const response = await api.get('/levels')
        this.levels = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchCourses() {
      try {
        const response = await api.get('/courses', {
          params: this.selectedId ? { regulation_id: this.selectedId } : {},
        })
        this.courses = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchCourseOfferings() {
      try {
        const response = await api.get('/course-offerings', {
          params: this.selectedId ? { regulation_id: this.selectedId } : {},
        })
        this.courseOfferings = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchLevelStudentCounts() {
      try {
        const response = await api.get('/level-student-counts', {
          params: this.selectedId ? { regulation_id: this.selectedId } : {},
        })
        this.levelStudentCounts = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async fetchCourseRegistrationCounts() {
      try {
        const response = await api.get('/course-registration-counts', {
          params: this.selectedId ? { regulation_id: this.selectedId } : {},
        })
        this.courseRegistrationCounts = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
      } catch (err) {
        console.error(err)
      }
    },
    async loadSectionData() {
      this.sectionErrors = null
      this.success = null
      this.loading = true

      try {
        switch (this.activeSection) {
          case 'basic_info':
            break
          case 'departments':
            await this.fetchDepartments()
            break
          case 'programs':
            await this.fetchPrograms()
            break
          case 'courses':
          case 'course_durations':
            await this.fetchCourses()
            break
          case 'elective_offerings':
            await this.fetchCourseOfferings()
            break
          case 'level_student_counts':
            await this.fetchLevelStudentCounts()
            break
          case 'course_registration_counts':
            await this.fetchCourseRegistrationCounts()
            break
          default:
            break
        }
      } catch (err) {
        console.error(err)
        this.sectionErrors = 'Unable to load section data. Please try again.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.resource-page {
  max-width: 1060px;
  margin: 0 auto;
  padding: 1.5rem;
}

.selector-row {
  margin-bottom: 1rem;
}

.details-card,
.section-card {
  padding: 1rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.details-card h2,
.section-card h3 {
  margin-bottom: 0.75rem;
}

.section-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.section-tabs button {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.section-tabs button.active {
  background: rgba(255, 255, 255, 0.12);
}

.section-content {
  margin-bottom: 1.5rem;
}

.section-panel {
  display: grid;
  gap: 1rem;
}

.resource-form,
.section-form {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
}

.resource-form label,
.section-form label {
  display: grid;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.resource-form input,
.resource-form textarea,
.resource-form select,
.section-form input,
.section-form textarea,
.section-form select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.resource-form button,
.section-form button,
.resource-table button {
  padding: 0.9rem 1.25rem;
  border: none;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, var(--accent), #f1c56c);
  color: #08101b;
  cursor: pointer;
}

.resource-table,
.section-table {
  width: 100%;
  border-collapse: collapse;
}

.resource-table th,
.resource-table td,
.section-table th,
.section-table td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  color: rgba(255, 255, 255, 0.9);
}

.resource-table th,
.section-table th {
  background: rgba(255, 255, 255, 0.08);
}

.summary-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-pill {
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
}

.status {
  padding: 1rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f5;
}

.status.error {
  background: rgba(255, 72, 66, 0.16);
  color: #ffb3ac;
}

.status.success {
  background: rgba(52, 199, 89, 0.14);
  color: #d4ffde;
}

.status.info {
  background: rgba(84, 152, 255, 0.12);
  color: #dbe8ff;
}

@media (max-width: 768px) {
  .section-tabs {
    flex-direction: column;
  }
}
</style>
