<template>
  <section class="login-page">
    <div class="login-card">
      <div class="login-header">
        <p class="badge">Sign in</p>
        <h1>University Portal Login</h1>
        <p class="subtitle">Enter your credentials to access your dashboard.</p>
      </div>

      <form class="login-form" @submit.prevent="submitLogin">
        <label class="field-group">
          <span>Email</span>
          <input
            type="email"
            v-model="email"
            placeholder="name@school.edu"
            autocomplete="email"
            required
          />
        </label>

        <label class="field-group">
          <span>Password</span>
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            autocomplete="current-password"
            required
          />
        </label>

        <div class="form-footer">
          <button class="button-primary" type="submit" :disabled="loading">
            <span v-if="loading">Signing in...</span>
            <span v-else>Log In</span>
          </button>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <p class="small-text">
          Don&apos;t have an account? <router-link to="/register">Sign up</router-link>
        </p>
      </form>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: null,
    }
  },
  methods: {
    async submitLogin() {
      this.loading = true
      this.error = null

      try {
        const response = await api.post('/login', {
          email: this.email,
          password: this.password,
        })

        const data = response.data
        const user = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(user))
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`

        if (user.role === 'admin') {
          this.$router.push('/admin')
        } else if (user.role === 'doctor') {
          this.$router.push('/doctor-dashboard')
        } else {
          this.$router.push('/')
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Check your credentials.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.1), transparent 24%),
    linear-gradient(180deg, #061827 0%, #081d3f 100%);
  color: #f5f2e9;
}

.login-card {
  width: min(520px, 100%);
  padding: 2rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
}

.login-header {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(216, 171, 37, 0.18);
  color: #f2d78d;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-header h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.4rem);
}

.subtitle {
  margin: 0;
  color: rgba(245, 242, 233, 0.8);
  line-height: 1.55;
}

.login-form {
  display: grid;
  gap: 1.25rem;
}

.field-group {
  display: grid;
  gap: 0.65rem;
  color: #f5f2e9;
  font-weight: 600;
}

.field-group input {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f2e9;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field-group input:focus {
  border-color: rgba(255, 215, 103, 0.35);
  box-shadow: 0 0 0 4px rgba(255, 215, 103, 0.1);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.button-primary {
  border: none;
  border-radius: 999px;
  padding: 0.95rem 1.3rem;
  color: #08101b;
  background: linear-gradient(135deg, #ffd666 0%, #e2b830 100%);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.button-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.error-message {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: rgba(208, 12, 27, 0.18);
  color: #ffd7e1;
  border: 1px solid rgba(208, 12, 27, 0.28);
}
</style>
