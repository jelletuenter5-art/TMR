const catalog = require("../data/courses.json");
// Lazy require to avoid a load-order issue — bookings-store doesn't need
// courses.js, so there's no real cycle, but this keeps the dependency
// direction obvious (courses is the more "core" module).
const bookingsStore = require("./bookings-store");

const PLACEHOLDER_PRICES = Boolean(catalog.pricesArePlaceholder);
const courses = catalog.courses;

function withLiveSessions(course) {
  return {
    ...course,
    isPlaceholder: PLACEHOLDER_PRICES,
    sessions: course.sessions.map((session) => ({
      ...session,
      spotsLeft: Math.max(0, session.spotsTotal - session.spotsBooked - bookingsStore.countConfirmedForSession(session.id)),
    })),
  };
}

function listCourses() {
  return courses.map(withLiveSessions);
}

function getCourse(id) {
  const found = courses.find((c) => c.id === id);
  return found ? withLiveSessions(found) : null;
}

function getSession(sessionId) {
  for (const course of courses) {
    const session = course.sessions.find((s) => s.id === sessionId);
    if (session) return { course: withLiveSessions(course), session: withLiveSessions(course).sessions.find((s) => s.id === sessionId) };
  }
  return null;
}

module.exports = { listCourses, getCourse, getSession };
