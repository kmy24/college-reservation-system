const API_URL = "https://script.google.com/macros/s/AKfycbw2y2Dxe80jOfsS5DyocQ1codzgpxNh7UAVSs33TtXpqI8DPDB1IWNIqbjgw889hMh2DA/exec";

let facilities = [];
let bookings = [];

const timeSlots = [
  { start: "07:00", end: "09:00" },
  { start: "09:00", end: "11:00" },
  { start: "11:00", end: "13:00" },
  { start: "13:00", end: "15:00" },
  { start: "15:00", end: "17:00" },
  { start: "17:00", end: "19:00" },
  { start: "19:00", end: "21:00" },
  { start: "21:00", end: "23:00" }
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

// ---------- BOOKING POP-UP ----------
// The modal is created here so the existing HTML does not need a new section.

function createBookingModal() {
  if (document.getElementById("bookingModal")) return;

  const style = document.createElement("style");
  style.textContent = `
    .tb-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(15, 23, 42, 0.62);
      backdrop-filter: blur(3px);
    }
    .tb-modal-overlay[hidden] { display: none !important; }
    .tb-modal {
      width: min(100%, 470px);
      max-height: 90vh;
      overflow-y: auto;
      background: #fff;
      color: #1f2937;
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
      font-family: inherit;
      animation: tb-modal-in 160ms ease-out;
    }
    @keyframes tb-modal-in {
      from { opacity: 0; transform: translateY(8px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .tb-modal-icon {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      margin-bottom: 16px;
      border-radius: 50%;
      font-size: 28px;
      font-weight: 700;
    }
    .tb-modal.success .tb-modal-icon {
      background: #dcfce7;
      color: #15803d;
    }
    .tb-modal.conflict .tb-modal-icon {
      background: #fef3c7;
      color: #b45309;
    }
    .tb-modal.error .tb-modal-icon {
      background: #fee2e2;
      color: #b91c1c;
    }
    .tb-modal h2 {
      margin: 0 0 10px;
      font-size: 1.45rem;
      line-height: 1.3;
    }
    .tb-modal-message {
      margin: 0 0 18px;
      color: #4b5563;
      line-height: 1.6;
      white-space: pre-line;
    }
    .tb-modal-details {
      display: grid;
      gap: 10px;
      margin: 18px 0;
      padding: 15px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }
    .tb-modal-detail {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .tb-modal-detail span { color: #6b7280; }
    .tb-modal-detail strong {
      text-align: right;
      overflow-wrap: anywhere;
    }
    .tb-modal-booking-id {
      display: block;
      margin-top: 5px;
      color: #166534;
      font-size: 1.45rem;
      letter-spacing: .04em;
    }
    .tb-modal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }
    .tb-modal-button {
      flex: 1;
      min-height: 44px;
      border: 0;
      border-radius: 9px;
      padding: 11px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .tb-modal-primary {
      background: #166534;
      color: #fff;
    }
    .tb-modal-secondary {
      background: #f3f4f6;
      color: #1f2937;
    }
    .tb-modal-button:focus-visible {
      outline: 3px solid #86efac;
      outline-offset: 3px;
    }
    @media (max-width: 480px) {
      .tb-modal { padding: 22px; }
      .tb-modal-detail {
        flex-direction: column;
        gap: 3px;
      }
      .tb-modal-detail strong { text-align: left; }
    }
  `;

  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "bookingModal";
  overlay.className = "tb-modal-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <section class="tb-modal" role="dialog" aria-modal="true"
      aria-labelledby="tbModalTitle" aria-describedby="tbModalMessage" tabindex="-1">
      <div class="tb-modal-icon" id="tbModalIcon" aria-hidden="true">✓</div>
      <h2 id="tbModalTitle">Booking status</h2>
      <p class="tb-modal-message" id="tbModalMessage"></p>
      <div class="tb-modal-details" id="tbModalDetails" hidden></div>
      <div class="tb-modal-actions">
        <button type="button" class="tb-modal-button tb-modal-secondary" id="tbModalCopy" hidden>
          Copy Booking ID
        </button>
        <button type="button" class="tb-modal-button tb-modal-primary" id="tbModalClose">
          OK
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector("#tbModalClose");
  closeButton.addEventListener("click", closeBookingModal);

  overlay.querySelector("#tbModalCopy").addEventListener(
    "click",
    copyBookingId
  );

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeBookingModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeBookingModal();
    }
  });
}

let currentModalBookingId = "";

function closeBookingModal() {
  const overlay = document.getElementById("bookingModal");
  if (overlay) overlay.hidden = true;
}

async function copyBookingId() {
  if (!currentModalBookingId) return;

  try {
    await navigator.clipboard.writeText(currentModalBookingId);

    const button = document.getElementById("tbModalCopy");
    button.textContent = "Copied!";

    setTimeout(() => {
      if (button.isConnected) {
        button.textContent = "Copy Booking ID";
      }
    }, 1500);
  } catch (error) {
    // The ID remains visible so the student can copy it manually if clipboard access is blocked.
    showMessage(
      "Please copy your Booking ID manually: " + currentModalBookingId,
      "success"
    );
  }
}

function showBookingModal({
  type = "error",
  title,
  message,
  bookingId = "",
  details = []
}) {
  createBookingModal();

  const overlay = document.getElementById("bookingModal");
  const modal = overlay.querySelector(".tb-modal");
  const icon = document.getElementById("tbModalIcon");
  const detailsBox = document.getElementById("tbModalDetails");
  const copyButton = document.getElementById("tbModalCopy");

  modal.className = `tb-modal ${type}`;

  icon.textContent =
    type === "success" ? "✓" :
    type === "conflict" ? "!" : "×";

  document.getElementById("tbModalTitle").textContent = title;
  document.getElementById("tbModalMessage").textContent = message;

  detailsBox.replaceChildren();

  const detailItems = [...details];

  if (bookingId) {
    detailItems.unshift({
      label: "Booking ID",
      value: bookingId,
      bookingId: true
    });
  }

  detailItems.forEach(item => {
    const row = document.createElement("div");
    row.className = "tb-modal-detail";

    const label = document.createElement("span");
    label.textContent = item.label;

    const value = document.createElement("strong");
    value.textContent = item.value;

    if (item.bookingId) {
      value.className = "tb-modal-booking-id";
    }

    row.append(label, value);
    detailsBox.appendChild(row);
  });

  detailsBox.hidden = detailItems.length === 0;

  currentModalBookingId = bookingId || "";
  copyButton.hidden = !bookingId;
  copyButton.textContent = "Copy Booking ID";

  overlay.hidden = false;
  overlay.querySelector(".tb-modal").focus();
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

  // Check existing bookings in the loaded calendar data.
  const conflict = getConflict(facilityName, date, start, end);

  if (conflict) {
    showBookingModal({
      type: "conflict",
      title: "Booking Unavailable",
      message:
        "This facility is already booked during the selected time. " +
        "Please choose another time or contact the PIC for confirmation.",
      details: [
        { label: "Facility", value: facilityName },
        { label: "Date", value: formatDate(date) },
        {
          label: "Time",
          value: `${formatTime(start)} – ${formatTime(end)}`
        },
        {
          label: "PIC",
          value: (conflict.pic || "College bureau") +
            (conflict.picContact ? " (" + conflict.picContact + ")" : "")
        }
      ]
    });

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
      const serverMessage =
        result.message || "The booking could not be submitted.";

      const isConflict =
        /clash|conflict|overlap|already booked|not available|booking exists/i.test(
          serverMessage
        );

      if (isConflict) {
        showBookingModal({
          type: "conflict",
          title: "Booking Unavailable",
          message: serverMessage,
          details: [
            { label: "Facility", value: facilityName },
            { label: "Date", value: formatDate(date) },
            {
              label: "Time",
              value: `${formatTime(start)} – ${formatTime(end)}`
            },
            {
              label: "PIC",
              value: (result.picName || "Please contact the PIC on duty") +
                (result.picContact ? " (" + result.picContact + ")" : "")
            }
          ]
        });
      } else {
        showBookingModal({
          type: "error",
          title: "Booking Could Not Be Submitted",
          message: serverMessage +
            (result.picName ? "\nPIC: " + result.picName : "") +
            (result.picContact ? " (" + result.picContact + ")" : ""),
          details: [
            { label: "Facility", value: facilityName },
            { label: "Date", value: formatDate(date) },
            {
              label: "Time",
              value: `${formatTime(start)} – ${formatTime(end)}`
            }
          ]
        });
      }

      showMessage(serverMessage, "error");
      return;
    }

    // Show the newly saved booking on its selected date.
    filterDate.value = date;

    // Reload actual data from Google Sheets.
    await loadBackendData();

    hideMessage();

    showBookingModal({
      type: "success",
      title: "Booking Submitted Successfully!",
      message:
        (result.message || "Your booking has been submitted successfully.") +
        "\nPlease keep your Booking ID for future reference.",
      bookingId: result.bookingId || "",
      details: [
        { label: "Facility", value: facilityName },
        { label: "Date", value: formatDate(date) },
        {
          label: "Time",
          value: `${formatTime(start)} – ${formatTime(end)}`
        },
        { label: "Status", value: "Pending" }
      ]
    });

    bookingForm.reset();
    bookingDate.value = localDateString();
    bookingDate.min = localDateString();

  } catch (error) {
    console.error("Booking submission failed:", error);

    const errorMessage =
      "We could not confirm the reservation response. " +
      "Check the Bookings sheet before submitting again. " +
      "If necessary, refresh the page and try again later.";

    showMessage(errorMessage, "error");

    showBookingModal({
      type: "error",
      title: "Unable to Confirm Booking",
      message: errorMessage,
      details: [
        { label: "Facility", value: facilityName },
        {
          label: "Date",
          value: date ? formatDate(date) : "Not selected"
        },
        {
          label: "Time",
          value: start && end
            ? `${formatTime(start)} – ${formatTime(end)}`
            : "Not selected"
        }
      ]
    });

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Check and submit booking";
  }
});

// ---------- INITIAL LOAD ----------

loadBackendData();
