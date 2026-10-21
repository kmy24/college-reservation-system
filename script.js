
const facilities = [
  "Discussion Room A",
  "Multipurpose Room",
  "Badminton Court 1",
  "Basketball Court"
];

const timeSlots = [
  { start: "09:00", end: "11:00" },
  { start: "11:00", end: "13:00" },
  { start: "14:00", end: "16:00" },
  { start: "16:00", end: "18:00" }
];

const filterDate = document.getElementById("filterDate");
const filterFacility = document.getElementById("filterFacility");
const bookingDate = document.getElementById("bookingDate");
const facilityInput = document.getElementById("facility");
const bookingForm = document.getElementById("bookingForm");
const schedule = document.getElementById("schedule");
const bookingMessage = document.getElementById("bookingMessage");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = localDateString();

filterDate.value = today;
bookingDate.value = today;
filterDate.min = today;
bookingDate.min = today;

// Demonstration data only. These records are not real bookings.
let bookings = [
  {
    id: 1,
    facility: "Discussion Room A",
    date: today,
    start: "10:00",
    end: "11:30",
    name: "Demo Student A",
    purpose: "Group discussion",
    pic: "Demo PIC A",
    status: "confirmed"
  },
  {
    id: 2,
    facility: "Badminton Court 1",
    date: today,
    start: "14:00",
    end: "16:00",
    name: "Demo Student B",
    purpose: "Sports activity",
    pic: "Demo PIC B",
    status: "confirmed"
  }
];

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-MY",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );
}

// Two bookings overlap when each starts before the other one ends.
// Back-to-back reservations are allowed.
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getConflict(facility, date, start, end) {
  return bookings.find(booking =>
    booking.facility === facility &&
    booking.date === date &&
    booking.status === "confirmed" &&
    overlaps(start, end, booking.start, booking.end)
  );
}

function showMessage(message, type) {
  bookingMessage.textContent = message;
  bookingMessage.className = `message ${type}`;
  bookingMessage.hidden = false;
}

function hideMessage() {
  bookingMessage.hidden = true;
  bookingMessage.textContent = "";
}

function renderSchedule() {
  const date = filterDate.value;
  const selectedFacility = filterFacility.value;

  if (!date) {
    schedule.innerHTML = "<p class='muted'>Please select a date.</p>";
    return;
  }

  document.getElementById("scheduleTitle").textContent =
    selectedFacility === "all"
      ? "Facility schedule"
      : selectedFacility;

  document.getElementById("scheduleSubtitle").textContent =
    formatDate(date);

  const facilitiesToShow = selectedFacility === "all"
    ? facilities
    : [selectedFacility];

  const rows = [];

  facilitiesToShow.forEach(facility => {
    timeSlots.forEach(slot => {
      const conflict = getConflict(
        facility,
        date,
        slot.start,
        slot.end
      );

      if (conflict) {
        rows.push({
          facility,
          start: slot.start,
          end: slot.end,
          booked: true,
          details: `PIC: ${conflict.pic}`
        });
      } else {
        rows.push({
          facility,
          start: slot.start,
          end: slot.end,
          booked: false,
          details: "Available for reservation"
        });
      }
    });

    // Also display bookings outside the standard demo time slots.
    bookings
      .filter(b =>
        b.facility === facility &&
        b.date === date &&
        b.status === "confirmed" &&
        !timeSlots.some(slot =>
          overlaps(b.start, b.end, slot.start, slot.end)
        )
      )
      .forEach(b => {
        rows.push({
          facility,
          start: b.start,
          end: b.end,
          booked: true,
          details: `PIC: ${b.pic}`
        });
      });
  });

  rows.sort((a, b) =>
    a.start.localeCompare(b.start) ||
    a.facility.localeCompare(b.facility)
  );

  if (rows.length === 0) {
    schedule.innerHTML =
      "<p class='muted'>No schedule available for this selection.</p>";
    return;
  }

  schedule.replaceChildren();

  rows.forEach(row => {
    const element = document.createElement("div");
    element.className = "schedule-row";

    const time = document.createElement("div");
    time.className = "schedule-time";
    time.textContent =
      `${formatTime(row.start)} – ${formatTime(row.end)}`;

    const details = document.createElement("div");
    details.className = "schedule-details";

    const name = document.createElement("strong");
    name.textContent = row.facility;

    const description = document.createElement("span");
    description.textContent = row.details;

    details.append(name, description);

    const status = document.createElement("span");
    status.className = `status ${row.booked ? "booked" : "available"}`;
    status.textContent = row.booked ? "Booked" : "Available";

    element.append(time, details, status);
    schedule.append(element);
  });
}

filterDate.addEventListener("change", () => {
  bookingDate.value = filterDate.value;
  renderSchedule();
});

filterFacility.addEventListener("change", renderSchedule);

document.getElementById("refreshButton").addEventListener("click", () => {
  renderSchedule();
  showMessage("Schedule refreshed.", "success");
});

facilityInput.addEventListener("change", () => {
  filterFacility.value = facilityInput.value || "all";
  renderSchedule();
});

bookingDate.addEventListener("change", () => {
  filterDate.value = bookingDate.value;
  renderSchedule();
});

bookingForm.addEventListener("submit", event => {
  event.preventDefault();
  hideMessage();

  const facility = facilityInput.value;
  const date = bookingDate.value;
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const name = document.getElementById("bookerName").value.trim();
  const purpose = document.getElementById("purpose").value.trim();

  if (!facility || !date || !start || !end || !name || !purpose) {
    showMessage("Please complete all booking fields.", "error");
    return;
  }

  if (date < localDateString()) {
    showMessage("Please select today or a future date.", "error");
    return;
  }

  if (end <= start) {
    showMessage("End time must be later than start time.", "error");
    return;
  }

  const conflict = getConflict(facility, date, start, end);

  if (conflict) {
    showMessage(
      `Booking conflict: this facility is already booked from ` +
      `${formatTime(conflict.start)} to ${formatTime(conflict.end)}. ` +
      `Please contact ${conflict.pic} or choose another time.`,
      "error"
    );
    return;
  }

  bookings.push({
    id: Date.now(),
    facility,
    date,
    start,
    end,
    name,
    purpose,
    pic: name,
    status: "confirmed"
  });

  filterDate.value = date;
  filterFacility.value = facility;

  renderSchedule();

  showMessage(
    "Demo booking added successfully! It only exists in this browser session and is not a real confirmed college reservation.",
    "success"
  );

  bookingForm.reset();
  bookingDate.value = date;
  filterDate.value = date;
  facilityInput.value = facility;
  document.getElementById("bookerName").focus();
});

renderSchedule();
