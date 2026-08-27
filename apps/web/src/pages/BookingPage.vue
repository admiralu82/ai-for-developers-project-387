<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api.js';

const eventTypes = ref([]);
const selectedEventType = ref(null);
const selectedDate = ref('');
const selectedSlot = ref(null);
const comment = ref('');
const slots = ref([]);
const loading = ref(false);
const error = ref('');
const success = ref(false);

function toDateInputValue(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const minDate = computed(() => toDateInputValue(new Date()));

const maxDate = computed(() => {
  const today = new Date();
  const max = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() + 14
  ));
  return toDateInputValue(max);
});

onMounted(async () => {
  try {
    eventTypes.value = await api.getEventTypes();
  } catch (err) {
    error.value = 'Не удалось загрузить типы событий';
  }
});

async function loadSlots() {
  if (!selectedEventType.value || !selectedDate.value) return;

  loading.value = true;
  error.value = '';
  try {
    slots.value = await api.getAvailableSlots(selectedDate.value, selectedEventType.value.eventTypeId);
    selectedSlot.value = null;
  } catch (err) {
    error.value = 'Не удалось загрузить доступные слоты';
  } finally {
    loading.value = false;
  }
}

function selectEventType(type) {
  selectedEventType.value = type;
  slots.value = [];
  selectedSlot.value = null;
  if (selectedDate.value) {
    loadSlots();
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

async function bookEvent() {
  if (!selectedSlot.value || !comment.value.trim()) {
    error.value = 'Заполните все поля';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await api.createEvent({
      eventTypeId: selectedEventType.value.eventTypeId,
      startTime: selectedSlot.value.startTime,
      comment: comment.value
    });
    success.value = true;
    setTimeout(() => {
      resetForm();
    }, 10_000);
  } catch (err) {
    error.value = err.message || 'Не удалось создать бронирование';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  selectedEventType.value = null;
  selectedDate.value = '';
  selectedSlot.value = null;
  comment.value = '';
  slots.value = [];
  success.value = false;
  error.value = '';
}
</script>

<template>
  <div class="booking-page">
    <nav class="nav">
      <div class="nav-content">
        <h3>Календарь бронирования</h3>
        <router-link to="/admin" class="nav-link">Панель администратора</router-link>
      </div>
    </nav>

    <div class="hero">
      <div class="hero-content">
        <span class="eyebrow">Простое бронирование</span>
        <h1>Забронируйте <em>время</em> для встречи</h1>
        <p class="subtitle">Выберите тип события, дату и удобное время</p>
      </div>
    </div>

    <main class="container">
      <!-- <div v-if="success" class="success-message">
        <p>✓ Бронирование успешно создано!</p>
      </div>

      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div> -->

      <!-- Step 1: Select Event Type -->
      <section class="step">
        <h2>1. Выберите тип события</h2>
        <div class="event-types">
          <button v-for="type in eventTypes" :key="type.eventTypeId" class="event-type-card"
            :class="{ selected: selectedEventType?.eventTypeId === type.eventTypeId }"
            :style="{ '--card-color': type.color }" @click="selectEventType(type)">
            <div class="card-header">
              <h3>{{ type.title }}</h3>
              <span class="duration">{{ type.durationMinutes }} мин</span>
            </div>
          </button>
        </div>
      </section>

      <!-- Step 2: Select Date -->
      <section v-if="selectedEventType" class="step">
        <h2>2. Выберите дату</h2>
        <input type="date" v-model="selectedDate" @change="loadSlots" :min="minDate" :max="maxDate"
          class="date-input" />
        <p class="hint">Можно забронировать на {{ maxDate.split('-').reverse().join('.') }}</p>
      </section>

      <!-- Step 3: Select Time Slot -->
      <section v-if="selectedDate && slots.length > 0" class="step">
        <h2>3. Выберите время</h2>
        <div class="slots">
          <button v-for="slot in slots" :key="slot.startTime" class="slot-button"
            :class="{ selected: selectedSlot?.startTime === slot.startTime, unavailable: !slot.available }"
            :disabled="!slot.available" @click="selectedSlot = slot">
            {{ formatTime(slot.startTime) }}
          </button>
        </div>
      </section>

      <!-- Step 4: Contact Info -->
      <section v-if="selectedSlot" class="step">
        <h2>4. Ваши данные</h2>
        <textarea v-model="comment" placeholder="Имя и контактная информация" class="comment-input" rows="4"></textarea>

        <div class="booking-summary">
          <h3>Детали бронирования</h3>
          <p><strong>Событие:</strong> {{ selectedEventType.title }}</p>
          <p><strong>Дата:</strong> {{ formatDate(selectedDate) }}</p>
          <p><strong>Время:</strong> {{ formatTime(selectedSlot.startTime) }} - {{ formatTime(selectedSlot.endTime) }}
          </p>
        </div>

        <button @click="bookEvent" :disabled="loading || !comment.trim()" class="submit-button">
          {{ loading ? 'Бронирование...' : 'Забронировать' }}
        </button>
      </section>

      <div v-if="success" class="success-message">
        <p>✓ Бронирование успешно создано!</p>
      </div>

      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.booking-page {
  min-height: 100vh;
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

.nav-link {
  color: var(--accent-terracotta);
  text-decoration: none;
  font-weight: 400;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--accent-hover);
}

.hero {
  background: var(--surface-white);
  border-bottom: 1px solid var(--border-hairline);
  padding: 4rem 2rem;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.eyebrow {
  display: inline-block;
  background: var(--accent-tint);
  color: var(--accent-terracotta);
  padding: 0.35rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 3rem;
  line-height: 1.1;
  margin-bottom: 1rem;
}

.hero h1 em {
  color: var(--accent-terracotta);
  font-style: italic;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  font-weight: 300;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.step {
  background: var(--surface-white);
  border: 1px solid var(--border-hairline);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(31, 36, 33, 0.05);
}

.step h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-ink);
}

.event-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.event-type-card {
  background: var(--surface-light);
  border: 2px solid var(--border-hairline);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: left;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.event-type-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
  opacity: 0.5;
  transition: opacity 0.2s;
}

.event-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 36, 33, 0.1);
  border-color: var(--card-color);
}

.event-type-card:hover::before {
  opacity: 1;
}

.event-type-card.selected {
  border-color: var(--card-color);
  background: var(--surface-white);
  box-shadow: 0 4px 12px rgba(31, 36, 33, 0.15);
}

.event-type-card.selected::before {
  opacity: 1;
  height: 6px;
}

.card-header h3 {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: var(--text-ink);
}

.duration {
  display: inline-block;
  background: var(--accent-tint);
  color: var(--accent-terracotta);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 400;
}

.date-input {
  width: 100%;
  max-width: 300px;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--surface-light);
  color: var(--text-ink);
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: var(--accent-terracotta);
  background: var(--surface-white);
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.slot-button {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  background: var(--surface-light);
  color: var(--text-ink);
  font-weight: 400;
  transition: all 0.2s;
}

.slot-button:hover:not(:disabled) {
  border-color: var(--accent-terracotta);
  background: var(--surface-white);
  transform: translateY(-1px);
}

.slot-button.selected {
  border-color: var(--accent-terracotta);
  background: var(--accent-terracotta);
  color: white;
}

.slot-button.unavailable {
  opacity: 0.4;
  cursor: not-allowed;
  text-decoration: line-through;
}

.comment-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-hairline);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--surface-light);
  color: var(--text-ink);
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: var(--accent-terracotta);
  background: var(--surface-white);
}

.booking-summary {
  background: var(--accent-tint);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.booking-summary h3 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: var(--text-ink);
}

.booking-summary p {
  margin: 0.5rem 0;
  color: var(--text-ink);
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
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 400;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>
