<template>
  <section class="login-page">
    <div class="login-card">
      <div class="login-header">
        <p class="badge">Sign up</p>
        <h1>Create your account</h1>
        <p class="subtitle">Register as a doctor or student using your registration code.</p>
      </div>

      <form class="login-form" @submit.prevent="submitRegister">
        <label class="field-group">
          <span>Name</span>
          <input
            type="text"
            v-model="name"
            placeholder="Your full name"
            autocomplete="name"
            required
          />
          <p v-if="errors.name" class="field-error">{{ errors.name[0] }}</p>
        </label>

        <label class="field-group">
          <span>Email</span>
          <input
            type="email"
            v-model="email"
            placeholder="name@example.com"
            autocomplete="email"
            required
          />
          <p v-if="errors.email" class="field-error">{{ errors.email[0] }}</p>
        </label>

        <label class="field-group">
          <span>Password</span>
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            autocomplete="new-password"
            required
          />
          <p v-if="errors.password" class="field-error">{{ errors.password[0] }}</p>
        </label>

        <label class="field-group">
          <span>Confirm Password</span>
          <input
            type="password"
            v-model="password_confirmation"
            placeholder="Confirm password"
            autocomplete="new-password"
            required
          />
          <p v-if="errors.password_confirmation" class="field-error">
            {{ errors.password_confirmation[0] }}
          </p>
        </label>

        <label class="field-group">
          <span>Registration Code</span>
          <input
            type="text"
            v-model="registration_code"
            placeholder="Enter registration code"
            autocomplete="off"
            required
          />
          <p class="helper-text">
            Admin code: ADM2026<br />Doctor code: DOC2026<br />Student code: STU2026
          </p>
          <p v-if="errors.registration_code" class="field-error">
            {{ errors.registration_code[0] }}
          </p>
        </label>

        <div class="form-footer">
          <button class="button-primary" type="submit" :disabled="loading">
            <span v-if="loading">Registering...</span>
            <span v-else>Register</span>
          </button>
        </div>

        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="error" class="error-message">{{ error }}</p>

        <p class="small-text">Already registered? <router-link to="/login">Log in</router-link></p>
      </form>
    </div>
  </section>
</template>

<script>
import api from '../services/api'

export default {
  name: 'RegisterView',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      registration_code: '',
      loading: false,
      error: null,
      successMessage: null,
      errors: {},
    }
  },
  methods: {
    async submitRegister() {
      this.loading = true
      this.error = null
      this.successMessage = null
      this.errors = {}

      try {
        await api.post('/register', {
          name: this.name,
          email: this.email,
          password: this.password,
          password_confirmation: this.password_confirmation,
          registration_code: this.registration_code,
        })

        this.successMessage = 'Registration successful. Redirecting to login...'
        setTimeout(() => {
          this.$router.push('/login')
        }, 1200)
      } catch (err) {
        const response = err.response?.data || {}

        if (response.errors) {
          this.errors = response.errors
          const validationMessages = Object.values(response.errors)
            .flat()
            .filter(Boolean)
          this.error =
            validationMessages.join(' ') || response.message || 'Registration failed. Check the form.'
        } else {
          this.error = response.message || 'Registration failed. Please try again.'
        }
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

.field-error {
  margin: 0;
  color: #ff9a9a;
  font-size: 0.9rem;
}

.helper-text {
  margin: 0;
  color: rgba(245, 242, 233, 0.72);
  font-size: 0.95rem;
  line-height: 1.5;
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
  color: #ffb3b3;
  font-size: 0.95rem;
}

.success-message {
  margin: 0;
  color: #d5f7c4;
  font-size: 0.95rem;
}

.small-text {
  margin: 0;
  color: rgba(245, 242, 233, 0.75);
  font-size: 0.95rem;
}

.small-text a {
  color: #ffd666;
  text-decoration: underline;
}
</style>
