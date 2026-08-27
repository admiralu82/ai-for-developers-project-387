export const config = {
  maxBookingDaysAhead: 14,
  workingHours: {
    start: 9,
    end: 18
  },
  timeSlotInterval: 30
};

export const defaultEventTypes = [
  {
    eventTypeId: 'consultation',
    title: 'Консультация',
    durationMinutes: 60,
    color: '#C4612F'
  },
  {
    eventTypeId: 'short-meeting',
    title: 'Короткая встреча',
    durationMinutes: 30,
    color: '#8B7355'
  },
  {
    eventTypeId: 'workshop',
    title: 'Мастер-класс',
    durationMinutes: 120,
    color: '#A0826D'
  },
  {
    eventTypeId: 'interview',
    title: 'Собеседование',
    durationMinutes: 45,
    color: '#6B5744'
  }
];
