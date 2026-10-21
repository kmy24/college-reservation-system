
const API_URL = "https://script.google.com/macros/s/AKfycbw2y2Dxe80jOfsS5DyocQ1codzgpxNh7UAVSs33TtXpqI8DPDB1IWNIqbjgw889hMh2DA/exec";

let facilities = [];
let bookings = [];

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

// ---------- DATE AND TIME ----------

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}

// ---------- MESSAGES ----------

function showMessage(message, type) {
  bookingMessage.textContent = message;
  bookingMessage.className = `message ${type}`;
  bookingMessage.hidden = false;
}

function hideMessage() {
  bookingMessage.hidden = true;
  bookingMessage.textContent = "";
}

// ---------- BACKEND CONNECTION ----------

async function loadBackendData() {
  try {
    showMessage("Loading facilities and bookings...", "success");

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Backend request failed.");
    }

    facilities = (data.facilities || [])
      .filter(item => item.active)
      .map(item => ({
        id: String(item.facilityId),
        name: item.facilityName,
        type: item.type,
        location: item.location,
        pic: item.picName || "the facility PIC",
        picContact: item.picContact || "",
        active: item.active
      }));

    bookings = (data.bookings || []).map(item => {
      const facility = facilities.find(
        f => f.id === String(item.facilityId)
      );

      return {
        id: item.bookingId,
        facilityId: String(item.facilityId),
        facility: facility ? facility.name : item.facilityId,
        date: String(item.bookingDate).slice(0, 10),
        start: String(item.startTime).slice(0, 5),
        end: String(item.endTime).slice(0, 5),
        name: item.bookerName || "",
        purpose: item.purpose || "",
        pic: facility ? facility.pic : "the facility PIC",
        picContact: facility ? facility.picContact : "",
        status: String(item.status || "").toLowerCase()
      };
    });

    populateFacilityOptions();
    renderSchedule();
    hideMessage();

    console.log("Backend data loaded:", data);
  } catch (error) {
    console.error("Backend connection failed:", error);

    showMessage(
      "Unable to load college reservation data. Check your connection and backend URL, then try refreshing.",
      "error"
    );
  }
}

// ---------- FACILITY DROPDOWNS ----------

function populateFacilityOptions() {
  facilityInput.replaceChildren();
  filterFacility.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a facility";
  facilityInput.appendChild(placeholder);

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All facilities";
  filterFacility.appendChild(allOption);

  facilities.forEach(facility => {
    const bookingOption = document.createElement("option");
    bookingOption.value = facility.name;
    bookingOption.textContent = facility.name;
    facilityInput.appendChild(bookingOption);

    const filterOption = document.createElement("option");
    filterOption.value = facility.name;
    filterOption.textContent = facility.name;
    filterFacility.appendChild(filterOption);
  });
}

// ---------- CONFLICT DETECTION ----------

// Back-to-back bookings are allowed.
// Example: 09:00-11:00 and 11:00-12:00 do not overlap.
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getConflict(facility, date, start, end) {
  const selectedFacility = facilities.find(
    item => item.name === facility
  );

  if (!selectedFacility) return undefined;

  return bookings.find(booking =>
    booking.facilityId === selectedFacility.id &&
    booking.date === date &&
    ["confirmed", "pending"].includes(booking.status) &&
    overlaps(start, end, booking.start, booking.end)
  );
}

// ---------- SCHEDULE DISPLAY ----------

function renderSchedule() {
  const date = filterDate.value;
  const selectedFacility = filterFacility.value || "all";

  if (!date) {
    schedule.textContent = "Please select a date.";
    return;
  }

  const title = document.getElementById("scheduleTitle");
  const subtitle = document.getElementById("scheduleSubtitle");

  if (title) {
    title.textContent = selectedFacility === "all"
      ? "Facility schedule"
      : selectedFacility;
  }

  if (subtitle) {
    subtitle.textContent = formatDate(date);
  }

  const facilitiesToShow = selectedFacility === "all"
    ? facilities.map(item => item.name)
    : [selectedFacility];

  const rows = [];

  facilitiesToShow.forEach(facilityName => {
    const facility = facilities.find(
      item => item.name === facilityName
    );

    if (!facility) return;

    timeSlots.forEach(slot => {
      const conflict = getConflict(
        facilityName,
        date,
        slot.start,
        slot.end
      );

      rows.push({
        facility: facilityName,
        start: slot.start,
        end: slot.end,
        booked: Boolean(conflict),
        details: conflict
          ? `Reserved. Contact ${conflict.pic}.`
          : "Available for reservation"
      });
    });

    // Include reservations outside the standard time slots.
    bookings
      .filter(booking =>
        booking.facilityId === facility.id &&
        booking.date === date &&
        ["confirmed", "pending"].includes(booking.status) &&
        !timeSlots.some(slot =>
          overlaps(
            booking.start,
            booking.end,
            slot.start,
            slot.end
          )
        )
      )
      .forEach(booking => {
        rows.push({
          facility: facilityName,
          start: booking.start,
          end: booking.end,
          booked: true,
          details: `Reserved. Contact ${booking.pic}.`
        });
      });
  });

  rows.sort((a, b) =>
    a.start.localeCompare(b.start) ||
    a.facility.localeCompare(b.facility)
  );

  if (rows.length === 0) {
    schedule.textContent = "No facilities available for this selection.";
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
    status.className =
      `status ${row.booked ? "booked" : "available"}`;
    status.textContent = row.booked ? "Booked" : "Available";

    element.append(time, details, status);
    schedule.appendChild(element);
  });
}

// ---------- DATE FILTERS AND BUTTONS ----------

const today = localDateString();

filterDate.value = today;
bookingDate.value = today;
filterDate.min = today;
bookingDate.min = today;

filterDate.addEventListener("change", () => {
  bookingDate.value = filterDate.value;
  renderSchedule();
});

filterFacility.addEventListener("change", renderSchedule);

document.getElementById("refreshButton").addEventListener("click", () => {
  loadBackendData();
});

facilityInput.addEventListener("change", () => {
  filterFacility.value = facilityInput.value || "all";
  renderSchedule();
});

bookingDate.addEventListener("change", () => {
  filterDate.value = bookingDate.value;
  renderSchedule();
});

// ---------- BOOKING FORM ----------

// This currently checks conflicts locally only.
// It does NOT save bookings to Google Sheets yet.

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();

  const facilityName = facilityInput.value;
  const date = bookingDate.value;
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const name = document.getElementById("bookerName").value.trim();
  const contact = document.getElementById("bookerContact").value.trim();
  const purpose = document.getElementById("purpose").value.trim();

  // Basic validation
  if (!facilityName || !date || !start || !end || !name || !purpose) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (start >= end) {
    showMessage("End time must be later than start time.", "error");
    return;
  }

  // Convert facility name to its ID, e.g. Discussion Room A -> F001
  const selectedFacility = facilities.find(
    item => item.name === facilityName
  );

  if (!selectedFacility) {
    showMessage("Please select a valid facility.", "error");
    return;
  }

  // Check existing bookings in the loaded calendar data
  const conflict = getConflict(facilityName, date, start, end);

  if (conflict) {
    showMessage(
      "This facility is already booked during that time. " +
      "Please contact the existing booking PIC: " +
      (conflict.pic || "Contact the college bureau") +
      (conflict.picContact ? " (" + conflict.picContact + ")" : ""),
      "error"
    );
    return;
  }

  const payload = {
    facilityId: selectedFacility.id,
    bookingDate: date,
    startTime: start,
    endTime: end,
    bookerName: name,
    bookerContact: contact,
    purpose: purpose
  };

  const submitButton = bookingForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("The server returned HTTP " + response.status);
    }

    const result = await response.json();

    if (!result.success) {
      showMessage(
        result.message +
        (result.picName ? " PIC: " + result.picName : "") +
        (result.picContact ? " (" + result.picContact + ")" : ""),
        "error"
      );
      return;
    }

    // Show the newly saved booking on its selected date.
    filterDate.value = date;

    // Reload actual data from Google Sheets.
    await loadBackendData();

    showMessage(
      result.message + " Booking ID: " + result.bookingId,
      "success"
    );

    bookingForm.reset();
    bookingDate.value = localDateString();
    bookingDate.min = localDateString();

  } catch (error) {
    console.error("Booking submission failed:", error);

    showMessage(
      "We could not confirm the reservation response. " +
      "Check the Bookings sheet before submitting again. " +
      "If necessary, refresh the page and try again later.",
      "error"
    );

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Check and submit booking";
  }
});


// ---------- INITIAL LOAD ----------

loadBackendData();
