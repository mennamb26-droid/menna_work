<script setup>
import { RouterLink, useRouter, useRoute } from 'vue-router'
import api from './services/api'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const user = computed(() => {
  route.fullPath
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
})

const logout = async () => {
  try {
    await api.post('/logout')
  } catch (error) {
    console.error('Logout failed', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-copy">
        <p class="app-subtitle">University timetable management</p>
        <h1>College Scheduling System</h1>
      </div>

      <nav class="navbar">
        <template v-if="!user">
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
        </template>

        <template v-else-if="user.role === 'admin'">
          <RouterLink to="/admin">Admin Dashboard</RouterLink>
          <RouterLink to="/departments">Departments</RouterLink>
          <RouterLink to="/programs">Programs</RouterLink>
          <RouterLink to="/levels">Levels</RouterLink>
          <RouterLink to="/courses">Courses</RouterLink>
          <RouterLink to="/rooms">Rooms</RouterLink>
          <RouterLink to="/schedules">Schedules</RouterLink>
          <RouterLink to="/exam-generator">Exam Generator</RouterLink>
          <button class="nav-button" type="button" @click="logout">Logout</button>
        </template>

        <template v-else-if="user.role === 'doctor'">
          <RouterLink to="/doctor-dashboard">Doctor Dashboard</RouterLink>
          <button class="nav-button" type="button" @click="logout">Logout</button>
        </template>

        <template v-else-if="user.role === 'student'">
          <RouterLink to="/">Timetable</RouterLink>
          <button class="nav-button" type="button" @click="logout">Logout</button>
        </template>
      </nav>
    </header>

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.1), transparent 24%),
    linear-gradient(180deg, #061827 0%, #081d3f 100%);
  color: #f5f2e9;
}

.app-header {
  display: grid;
  gap: 1rem;
  padding: 1.75rem 1.25rem;
  background: rgba(6, 24, 42, 0.96);
  border-bottom: 1px solid rgba(255, 215, 103, 0.12);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
}

.app-header-copy {
  display: grid;
  gap: 0.35rem;
}

.app-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.95rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.app-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.8rem);
  line-height: 1.05;
  color: #fff;
}

.navbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
}

.navbar a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  color: #f5f2e9;
  background: rgba(255, 255, 255, 0.05);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.navbar a.router-link-active,
.navbar a.router-link-exact-active {
  background: rgba(255, 215, 103, 0.16);
  color: #08101b;
  border-color: rgba(255, 215, 103, 0.3);
}

.navbar a:hover,
.navbar .nav-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 215, 103, 0.16);
}

.navbar .nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  color: #f5f2e9;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.navbar .nav-button:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(255, 215, 103, 0.16);
}

.app-content {
  padding: 1.5rem 1rem 2rem;
}

@media (min-width: 768px) {
  .app-header {
    padding: 2rem 2rem 1.75rem;
  }

  .app-content {
    padding: 2rem;
  }
}
</style>
