<template>
  <section class="doctor-page">
    <div class="doctor-card">
      <p class="badge">Doctor</p>
      <h1>Doctor Dashboard</h1>
      <p class="subtitle">This area is reserved for doctor access and timetable management.</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DoctorView',
}
</script>

<style scoped>
.doctor-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  color: #f5f2e9;
  background:
    radial-gradient(circle at top, rgba(255, 221, 120, 0.1), transparent 24%),
    linear-gradient(180deg, #061827 0%, #081d3f 100%);
}

.doctor-card {
  width: min(680px, 100%);
  padding: 2rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
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

h1 {
  margin: 1rem 0 0.5rem;
  font-size: clamp(2rem, 2.5vw, 2.4rem);
}

.subtitle {
  margin: 0;
  color: rgba(245, 242, 233, 0.8);
  line-height: 1.55;
}
</style>
