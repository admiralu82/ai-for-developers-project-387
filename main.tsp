import "@typespec/http";

using Http;
@service(#{ title: "Calendar API" })
namespace CalendarService;
model EventType {
  eventTypeId: string;
  title: string;

  @minValue(10)
  @maxValue(120)
  durationMinutes: int32;

  color: string;
}

model Event {
  eventId: string;
  eventTypeId: string;

  @minLength(3)
  title: string;

  startTime: utcDateTime;

  @minLength(3)
  comment: string;
}

// отдельные DTO модели для создания
model CreateEventRequest {
  eventTypeId: string;
  startTime: utcDateTime;
  comment: string;
}

model CreateEventTypeRequest {
  @minLength(5)
  @maxLength(100)
  title: string;

  @minValue(10)
  @maxValue(120)
  durationMinutes: int32;

  color: string;
}

model ErrorResponse {
  code: string;
  message: string;
}

@route("/available-slots")
interface Slots {
  @get list(@query date: plainDate, @query eventTypeId: string): TimeSlot[];
}

model TimeSlot {
  startTime: utcDateTime;
  endTime: utcDateTime;
  available: boolean;
}

@route("/event-types")
interface EventTypes {
  @get list(): EventType[];

  @get getEventType(@path eventId: string):
    | {
        @statusCode statusCode: 200;
        @body eventType: EventType;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      }
    | {
        @statusCode statusCode: 404;
        @body error: ErrorResponse;
      };

  @post createEventType(@body eventType: CreateEventTypeRequest):
    | {
        @statusCode statusCode: 201;
        @body newEventType: EventType;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      };

  @put updateEventType(@path eventId: string, @body eventType: EventType):
    | {
        @statusCode statusCode: 200;
        @body updatedEventType: EventType;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      };

  @delete deleteEventType(@path eventId: string):
    | {
        @statusCode statusCode: 204;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      };
}

@route("/events")
interface Events {
  @get list(@query date?: plainDate): Event[];

  @get getEvent(@path eventId: string):
    | {
        @statusCode statusCode: 200;
        @body event: Event;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      }
    | {
        @statusCode statusCode: 404;
        @body error: ErrorResponse;
      };

  @post createEvent(@body event: CreateEventRequest):
    | {
        @statusCode statusCode: 201;
        @body newEvent: Event;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      }
    | {
        @statusCode statusCode: 409;
        @body error: ErrorResponse;
      };

  @put updateEvent(@path eventId: string, @body event: Event):
    | {
        @statusCode statusCode: 200;
        @body updatedEvent: Event;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      };

  @delete deleteEvent(@path eventId: string):
    | {
        @statusCode statusCode: 204;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ErrorResponse;
      };
}
