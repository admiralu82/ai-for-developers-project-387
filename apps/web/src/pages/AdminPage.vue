<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api.js';

const events = ref([]);
const loading = ref(false);
const error = ref('');
const filterDate = ref('');

onMounted(async () => {
  await loadEvents();
});

async function loadEvents() {
  loading.value = true;
  error.value = '';
  try {
    events.value = await api.getEvents(filterDate.value || null);
  } catch (err) {
    error.value = 'Не удалось загрузить события';
  } finally {
    loading.value = false;
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Вы уверены, что хотите удалить это бронирование?')) return;
  
  try {
    await api.deleteEvent(eventId);
    await loadEvents();
  } catch (err) {
    error.value = 'Не удалось удалить событие';
  }
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}
</script>

<template>
  <div class="admin-page">
    <nav class="nav">
      <div class="nav-content">
        <h3>Панель администратора</h3>
        <div class="nav-links">
          <router-link to="/admin/addevent" class="nav-link">Типы событий</router-link>
          <router-link to="/" class="nav-link">На главную</router-link>
        </div>
      </div>
    </nav>

    <main class="container">
      <div class="header">
        <h1>Управление <em>бронированиями</em></h1>
        <div class="filter-section">
          <input
            type="date"
            v-model="filterDate"
            @change="loadEvents"
            class="date-input"
            placeholder="Фильтр по дате"
          />
          <button @click="filterDate = ''; loadEvents()" class="clear-button">
            Все даты
          </button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>

      <div v-if="loading" class="loading">
        <p>Загрузка...</p>
      </div>

      <div v-else-if="events.length === 0" class="empty-state">
        <p>Нет бронирований</p>
      </div>

      <div v-else class="events-grid">
        <div v-for="event in events" :key="event.eventId" class="event-card">
          <div class="event-header">
            <h3>{{ event.title }}</h3>
            <button @click="deleteEvent(event.eventId)" class="delete-button">
              ×
            </button>
          </div>
          <div class="event-body">
            <p class="event-time">{{ formatDateTime(event.startTime) }}</p>
            <p class="event-comment">{{ event.comment }}</p>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <h3>Всего бронирований</h3>
          <p class="stat-value">{{ events.length }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: var(--bg-cream);
}

.nav {
  position: sticky;
  top: 0;
  background: rgba(251, 249, 245, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-hairline);
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav h3 {
  font-size: 1rem;
  color: var(--text-ink);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--accent-terracotta);
  text-decoration: none;
  font-weight: 400;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--accent-hover);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.header {
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.header h1 em {
  color: var(--accent-terracotta);
  font-style: italic;
}

.filter-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--surface-white);
  color: var(--text-ink);
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: var(--accent-terracotta);
}

.clear-button {
  padding: 0.75rem 1.5rem;
  background: var(--surface-light);
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  color: var(--text-ink);
  font-weight: 400;
  transition: all 0.2s;
}

.clear-button:hover {
  border-color: var(--accent-terracotta);
  background: var(--surface-white);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: var(--surface-white);
  border: 1px solid var(--border-hairline);
  border-radius: 12px;
  color: var(--text-muted);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.event-card {
  background: var(--surface-white);
  border: 1px solid var(--border-hairline);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 36, 33, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-hairline);
}

.event-header h3 {
  font-size: 1.25rem;
  color: var(--text-ink);
}

.delete-button {
  background: transparent;
  color: var(--text-muted);
  font-size: 2rem;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
}

.delete-button:hover {
  background: #f8d7da;
  color: #721c24;
}

.event-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-time {
  color: var(--accent-terracotta);
  font-weight: 400;
  font-size: 0.95rem;
}

.event-comment {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--accent-tint);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.stat-card h3 {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  font-weight: 400;
}

.stat-value {
  font-size: 3rem;
  font-weight: 300;
  color: var(--accent-terracotta);
  font-family: 'Fraunces', serif;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
}
</style>
