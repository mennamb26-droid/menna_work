import { createRouter, createWebHistory } from 'vue-router'
import Schedules from '../views/Schedules.vue'
import Departments from '../views/Departments.vue'
import Levels from '../views/Levels.vue'
import Programs from '../views/Programs.vue'
import Courses from '../views/Courses.vue'
import Rooms from '../views/Rooms.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Doctors from '../views/Doctors.vue'
import TimetableView from '../views/TimetableView.vue'
import LoginView from '../views/Login.vue'
import Register from '../views/Register.vue'
import ExamGenerator from '../views/ExamGenerator.vue'
import DoctorDashboard from '../views/DoctorDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TimetableView,
      meta: {
        requiresAuth: true,
        role: 'student',
      },
    },
    {
      path: '/schedules',
      name: 'schedules',
      component: Schedules,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/exam-generator',
      name: 'exam-generator',
      component: ExamGenerator,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/departments',
      name: 'departments',
      component: Departments,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/programs',
      name: 'programs',
      component: Programs,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/levels',
      name: 'levels',
      component: Levels,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/courses',
      name: 'courses',
      component: Courses,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/rooms',
      name: 'rooms',
      component: Rooms,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/timetable',
      name: 'timetable',
      component: TimetableView,
      meta: {
        requiresAuth: true,
        role: 'student',
      },
    },
    {
      path: '/doctor-dashboard',
      name: 'doctor-dashboard',
      component: DoctorDashboard,
      meta: {
        requiresAuth: true,
        role: 'doctor',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/doctors',
      name: 'doctors',
      component: Doctors,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
    {
      path: '/admin',

      name: 'admin',
      component: AdminDashboard,
      meta: {
        requiresAuth: true,
        role: 'admin',
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) : null

  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next({ name: 'login' })
    }

    const roleMeta = to.meta.role
    if (roleMeta) {
      const allowedRoles = Array.isArray(roleMeta) ? roleMeta : [roleMeta]
      if (!allowedRoles.includes(user.role)) {
        return next({ name: 'login' })
      }
    }
  }

  return next()
})

export default router
