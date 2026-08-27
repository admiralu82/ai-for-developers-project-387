<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api.js';

const eventTypes = ref([]);
const loading = ref(false);
const error = ref('');
const success = ref('');

// Form fields
const title = ref('');
const durationMinutes = ref(60);
const color = ref('#C4612F');

onMounted(async () => {
  await loadEventTypes();
});

async function loadEventTypes() {
  loading.value = true;
  error.value = '';
  try {
    eventTypes.value = await api.getEventTypes();
  } catch (err) {
    error.value = 'Не удалось загрузить типы событий';
  } finally {
    loading.value = false;
  }
}

async function createEventType() {
  if (!title.value || title.value.length < 5) {
    error.value = 'Название должно содержать минимум 5 символов';
    return;
  }

  if (durationMinutes.value < 10 || durationMinutes.value > 120) {
    error.value = 'Продолжительность должна быть от 10 до 120 минут';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    await api.createEventType({
      title: title.value,
      durationMinutes: durationMinutes.value,
      color: color.value
    });
    
    success.value = 'Тип события успешно создан!';
    title.value = '';
    durationMinutes.value = 60;
    color.value = '#C4612F';
    
    await loadEventTypes();
    
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err) {
    error.value = err.message || 'Не удалось создать тип события';
  } finally {
    loading.value = false;
  }
}

async function deleteEventType(eventTypeId) {
  if (!confirm('Вы уверены, что хотите удалить этот тип события?')) return;
  
  try {
    await api.deleteEventType(eventTypeId);
    await loadEventTypes();
  } catch (err) {
    error.value = 'Не удалось удалить тип события';
  }
}

const colorPresets = [
  '#C4612F', // terracotta
  '#8B7355', // warm brown
  '#A0826D', // sand
  '#6B5744', // dark brown
  '#D4A574', // caramel
  '#B8956A', // tan
];
</script>

<template>
  <div class="add-event-page">
    <nav class="nav">
      <div class="nav-content">
        <h3>Управление типами событий</h3>
        <div class="nav-links">
          <router-link to="/admin" class="nav-link">Бронирования</router-link>
          <router-link to="/" class="nav-link">На главную</router-link>
        </div>
      </div>
    </nav>

    <main class="container">
      <div class="header">
        <h1>Типы <em>событий</em></h1>
        <p class="subtitle">Создавайте и управляйте типами событий для бронирования</p>
      </div>

      <div class="layout">
        <!-- Create Form -->
        <section class="form-section">
          <h2>Создать новый тип</h2>

          <div v-if="success" class="success-message">
            <p>{{ success }}</p>
          </div>

          <div v-if="error" class="error-message">
            <p>{{ error }}</p>
          </div>

          <form @submit.prevent="createEventType" class="form">
            <div class="form-group">
              <label for="title">Название события</label>
              <input
                id="title"
                v-model="title"
                type="text"
                placeholder="Консультация, Встреча, Мастер-класс..."
                class="input"
                required
                minlength="5"
                maxlength="100"
              />
              <span class="hint">Минимум 5 символов</span>
            </div>

            <div class="form-group">
              <label for="duration">Продолжительность (минуты)</label>
              <input
                id="duration"
                v-model.number="durationMinutes"
                type="number"
                min="10"
                max="120"
                step="5"
                class="input"
                required
              />
              <span class="hint">От 10 до 120 минут</span>
            </div>

            <div class="form-group">
              <label for="color">Цвет</label>
              <div class="color-picker">
                <input
                  id="color"
                  v-model="color"
                  type="color"
                  class="color-input"
                />
                <div class="color-presets">
                  <button
                    v-for="preset in colorPresets"
                    :key="preset"
                    type="button"
                    class="color-preset"
                    :style="{ backgroundColor: preset }"
                    :class="{ active: color === preset }"
                    @click="color = preset"
                  ></button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="submit-button"
            >
              {{ loading ? 'Создание...' : 'Создать тип события' }}
            </button>
          </form>
        </section>

        <!-- Existing Event Types -->
        <section class="list-section">
          <h2>Существующие типы</h2>

          <div v-if="loading && eventTypes.length === 0" class="loading">
            <p>Загрузка...</p>
          </div>

          <div v-else-if="eventTypes.length === 0" class="empty-state">
            <p>Нет типов событий</p>
          </div>

          <div v-else class="event-types-list">
            <div
              v-for="type in eventTypes"
              :key="type.eventTypeId"
              class="event-type-item"
              :style="{ '--type-color': type.color }"
            >
              <div class="type-info">
                <h3>{{ type.title }}</h3>
                <div class="type-meta">
                  <span class="duration-badge">{{ type.durationMinutes }} мин</span>
                  <span class="color-badge" :style="{ backgroundColor: type.color }"></span>
                </div>
              </div>
              <button
                @click="deleteEventType(type.eventTypeId)"
                class="delete-button"
                title="Удалить"
              >
                ×
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.add-event-page {
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
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.header h1 em {
  color: var(--accent-terracotta);
  font-style: italic;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  font-weight: 300;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.form-section,
.list-section {
  background: var(--surface-white);
  border: 1px solid var(--border-hairline);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(31, 36, 33, 0.05);
}

.form-section h2,
.list-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-ink);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 400;
  color: var(--text-ink);
  font-size: 0.95rem;
}

.input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--surface-light);
  color: var(--text-ink);
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--accent-terracotta);
  background: var(--surface-white);
}

.hint {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.color-picker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-input {
  width: 100%;
  height: 50px;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  cursor: pointer;
}

.color-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-preset {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: var(--text-ink);
  box-shadow: 0 0 0 2px var(--surface-white);
}

.submit-button {
  width: 100%;
  padding: 1rem 2rem;
  background: var(--accent-terracotta);
  color: white;
  font-size: 1.125rem;
  font-weight: 400;
  border-radius: 999px;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(196, 97, 47, 0.3);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 400;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  background: var(--surface-light);
  border-radius: 8px;
}

.event-types-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: var(--surface-light);
  border: 2px solid var(--border-hairline);
  border-left: 4px solid var(--type-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.event-type-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(31, 36, 33, 0.08);
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-info h3 {
  font-size: 1.125rem;
  color: var(--text-ink);
}

.type-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.duration-badge {
  display: inline-block;
  background: var(--accent-tint);
  color: var(--accent-terracotta);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 400;
}

.color-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--surface-white);
  box-shadow: 0 0 0 1px var(--border-hairline);
}

.delete-button {
  background: transparent;
  color: var(--text-muted);
  font-size: 1.75rem;
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
</style>
