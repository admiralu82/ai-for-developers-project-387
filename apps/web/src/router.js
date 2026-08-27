import { createRouter, createWebHistory } from 'vue-router';
import BookingPage from './pages/BookingPage.vue';
import AdminPage from './pages/AdminPage.vue';
import AddEventPage from './pages/AddEventPage.vue';

const routes = [
  {
    path: '/',
    name: 'Booking',
    component: BookingPage
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage
  },
  {
    path: '/admin/addevent',
    name: 'AddEvent',
    component: AddEventPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
