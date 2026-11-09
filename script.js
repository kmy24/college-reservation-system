const API_URL = "https://script.google.com/macros/s/AKfycbw2y2Dxe80jOfsS5DyocQ1codzgpxNh7UAVSs33TtXpqI8DPDB1IWNIqbjgw889hMh2DA/exec";

// =====================================================
// PIC IN CHARGE - EDIT THIS BLOCK WHENEVER THE PIC CHANGES
// =====================================================
const PIC_INFO = {
  name: "HAKIMIE",
  // Shown on the page, e.g. "012-345 6789". Leave "" to hide.
  phone: "",
  // WhatsApp number with country code, digits only, e.g. "60123456789".
  // Leave "" to hide the WhatsApp button.
  whatsapp: ""
};

let facilities = [];
let bookings = [];

// Hourly rows: 7-8am up to 10-11pm (extends automatically if a booking is outside this range)
const DEFAULT_FIRST_HOUR = 7;
const DEFAULT_LAST_HOUR = 23; // exclusive end

const filterDate = document.getElementById("filterDate");
const filterFacility = document.getElementById("filterFacility");
const facilityInput = document.getElementById("facility");
const bookingForm = document.getElementById("bookingForm");
const schedule = document.getElementById("schedule");
const bookingMessage = document.getElementById("bookingMessage");
const liveCheck = document.getElementById("liveCheck");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");

// ---------- PIC INFO ----------

function renderPicInfo() {
  document.getElementById("picName").textContent = PIC_INFO.name;

  const phoneRow = document.getElementById("picPhoneRow");
  if (PIC_INFO.phone) {
    document.getElementById("picPhone").textContent = PIC_INFO.phone;
    phoneRow.hidden = false;
  } else {
    phoneRow.hidden = true;
  }

  const wa = document.getElementById("picWhatsapp");
  if (PIC_INFO.whatsapp) {
    wa.href = "https://wa.me/" + PIC_INFO.whatsapp.replace(/\D/g, "");
    wa.hidden = false;
  } else {
    wa.hidden = true;
  }
}

// ---------- DATE AND TIME ----------

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const h = hours % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

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

function formatDateRange(start, end) {
  return start === end
    ? formatDate(start)
    : `${formatDate(start)} to ${formatDate(end)}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function hourString(h) {
  return `${pad(h)}:00`;
}

// "7 - 8 AM" or "11 AM - 12 PM"
function hourLabel(h) {
  const s = h % 12 || 12;
  const e = (h + 1) % 12 || 12;
  const sSuffix = h % 24 >= 12 ? "PM" : "AM";
  const eSuffix = (h + 1) % 24 >= 12 ? "PM" : "AM";

  return sSuffix === eSuffix
    ? `${s} - ${e} ${eSuffix}`
    : `${s} ${sSuffix} - ${e} ${eSuffix}`;
}

function toHours(time) {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
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
    .tb-modal.success .tb-modal-icon { background: #dcfce7; color: #15803d; }
    .tb-modal.conflict .tb-modal-icon { background: #fef3c7; color: #b45309; }
    .tb-modal.error .tb-modal-icon { background: #fee2e2; color: #b91c1c; }
    .tb-modal h2 { margin: 0 0 10px; font-size: 1.45rem; line-height: 1.3; }
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
    .tb-modal-detail { display: flex; justify-content: space-between; gap: 16px; }
    .tb-modal-detail span { color: #6b7280; }
    .tb-modal-detail strong { text-align: right; overflow-wrap: anywhere; }
    .tb-modal-booking-id {
      display: block;
      margin-top: 5px;
      color: #166534;
      font-size: 1.45rem;
      letter-spacing: .04em;
    }
    .tb-modal-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
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
    .tb-modal-primary { background: #166534; color: #fff; }
    .tb-modal-secondary { background: #f3f4f6; color: #1f2937; }
    .tb-modal-button:focus-visible { outline: 3px solid #86efac; outline-offset: 3px; }
    @media (max-width: 480px) {
      .tb-modal { padding: 22px; }
      .tb-modal-detail { flex-direction: column; gap: 3px; }
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

  overlay.querySelector("#tbModalClose").addEventListener("click", closeBookingModal);
  overlay.querySelector("#tbModalCopy").addEventListener("click", copyBookingId);

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

      const start = String(item.bookingDate).slice(0, 10);
      const end = item.endDate
        ? String(item.endDate).slice(0, 10)
        : start;

      return {
        id: item.bookingId,
        facilityId: String(item.facilityId),
        facility: facility ? facility.name : item.facilityId,
        date: start,
        endDate: end < start ? start : end,
        start: String(item.startTime).slice(0, 5),
        end: String(item.endTime).slice(0, 5),
        name: item.bookerName || "",
        club: item.clubName || "",
        project: item.projectName || "",
        purpose: item.purpose || "",
        pic: facility ? facility.pic : "the facility PIC",
        picContact: facility ? facility.picContact : "",
        status: String(item.status || "").toLowerCase()
      };
    });

    populateFacilityOptions();
    renderSchedule();
    updateLiveCheck();
    hideMessage();
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
  const previousForm = facilityInput.value;
  const previousFilter = filterFacility.value;

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

  // Keep the user's previous choices after a refresh.
  if (facilities.some(f => f.name === previousForm)) {
    facilityInput.value = previousForm;
  }

  if (previousFilter === "all" || facilities.some(f => f.name === previousFilter)) {
    filterFacility.value = previousFilter || "all";
  }
}

// ---------- CONFLICT DETECTION ----------

// Back-to-back bookings are allowed (09:00-11:00 and 11:00-12:00 do not overlap).
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

const ACTIVE_STATUSES = ["confirmed", "pending"];

// A booking covers the given date if the date is between its start and end date.
function bookingCoversDate(booking, date) {
  return booking.date <= date && date <= booking.endDate;
}

// Finds an existing booking that clashes with the requested date range and time.
function getConflict(facility, startDate, endDate, start, end) {
  const selectedFacility = facilities.find(
    item => item.name === facility
  );

  if (!selectedFacility) return undefined;

  return bookings.find(booking =>
    booking.facilityId === selectedFacility.id &&
    ACTIVE_STATUSES.includes(booking.status) &&
    booking.date <= endDate &&
    startDate <= booking.endDate &&
    overlaps(start, end, booking.start, booking.end)
  );
}

// What the user is currently choosing in the booking form.
function getSelection() {
  const facility = facilityInput.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value || startDate;
  const start = startTimeInput.value;
  const end = endTimeInput.value;

  if (!facility || !startDate || !start || !end || start >= end || endDate < startDate) {
    return null;
  }

  return { facility, startDate, endDate, start, end };
}

function updateLiveCheck() {
  const selection = getSelection();

  if (!selection) {
    liveCheck.hidden = true;
    renderSchedule();
    return;
  }

  const conflict = getConflict(
    selection.facility,
    selection.startDate,
    selection.endDate,
    selection.start,
    selection.end
  );

  liveCheck.hidden = false;

  if (conflict) {
    liveCheck.className = "live-check clash";
    liveCheck.textContent =
      `⚠ Clash: ${selection.facility} is already booked ` +
      `${formatTime(conflict.start)} - ${formatTime(conflict.end)}` +
      (conflict.date === conflict.endDate
        ? ` on ${formatDate(conflict.date)}`
        : ` from ${formatDate(conflict.date)} to ${formatDate(conflict.endDate)}`) +
      `. Please choose another time or contact the PIC in charge.`;
  } else {
    liveCheck.className = "live-check ok";
    liveCheck.textContent = "✓ No clash found. This time is available.";
  }

  renderSchedule();
}

// ---------- SCHEDULE TABLE ----------

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
    ? facilities
    : facilities.filter(item => item.name === selectedFacility);

  if (facilitiesToShow.length === 0) {
    schedule.textContent = "No facilities available for this selection.";
    return;
  }

  // Active bookings on this date, per facility
  const dayBookings = {};

  facilitiesToShow.forEach(facility => {
    dayBookings[facility.id] = bookings.filter(booking =>
      booking.facilityId === facility.id &&
      ACTIVE_STATUSES.includes(booking.status) &&
      bookingCoversDate(booking, date)
    );
  });

  // Row range: 7am-11pm by default, extended if a booking falls outside.
  let firstHour = DEFAULT_FIRST_HOUR;
  let lastHour = DEFAULT_LAST_HOUR;

  Object.values(dayBookings).flat().forEach(booking => {
    firstHour = Math.min(firstHour, Math.floor(toHours(booking.start)));
    lastHour = Math.max(lastHour, Math.min(24, Math.ceil(toHours(booking.end))));
  });

  const selection = getSelection();

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";

  const table = document.createElement("table");
  table.className = "schedule-table";

  // Header
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const timeHead = document.createElement("th");
  timeHead.className = "time-col";
  timeHead.textContent = "TIME";
  headRow.appendChild(timeHead);

  facilitiesToShow.forEach(facility => {
    const th = document.createElement("th");
    th.textContent = facility.name;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");

  for (let h = firstHour; h < lastHour; h++) {
    const slotStart = hourString(h);
    const slotEnd = hourString(h + 1);

    const row = document.createElement("tr");

    const timeCell = document.createElement("th");
    timeCell.className = "time-col";
    timeCell.scope = "row";
    timeCell.textContent = hourLabel(h);
    row.appendChild(timeCell);

    facilitiesToShow.forEach(facility => {
      const cell = document.createElement("td");

      const hits = dayBookings[facility.id].filter(booking =>
        overlaps(slotStart, slotEnd, booking.start, booking.end)
      );

      if (hits.length > 0) {
        cell.className = "cell-booked";

        const label = document.createElement("span");
        label.className = "cell-title";
        label.textContent = "BOOKED";
        cell.appendChild(label);

        hits.forEach(booking => {
          const who = document.createElement("span");
          who.className = "cell-line";
          who.textContent = booking.club || booking.name || "Reserved";
          cell.appendChild(who);

          const time = document.createElement("span");
          time.className = "cell-line small";
          time.textContent =
            `${formatTime(booking.start)} - ${formatTime(booking.end)}` +
            (booking.status === "pending" ? " (Pending)" : "");
          cell.appendChild(time);
        });
      } else {
        cell.className = "cell-available";
        cell.textContent = "Available";
      }

      // Outline the time the user is choosing in the form
      if (
        selection &&
        selection.facility === facility.name &&
        selection.startDate <= date &&
        date <= selection.endDate &&
        overlaps(slotStart, slotEnd, selection.start, selection.end)
      ) {
        cell.classList.add("cell-selected");

        if (hits.length > 0) {
          cell.classList.add("cell-clash");
        }
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  wrap.appendChild(table);

  schedule.replaceChildren(wrap);
}

// ---------- DATE FILTERS AND BUTTONS ----------

function setDefaultDates() {
  const today = localDateString();

  filterDate.min = today;
  startDateInput.min = today;
  endDateInput.min = today;

  startDateInput.value = filterDate.value && filterDate.value >= today
    ? filterDate.value
    : today;
  endDateInput.value = startDateInput.value;
}

filterDate.value = localDateString();
setDefaultDates();

filterDate.addEventListener("change", () => {
  if (!filterDate.value) return;

  startDateInput.value = filterDate.value;

  if (!endDateInput.value || endDateInput.value < startDateInput.value) {
    endDateInput.value = startDateInput.value;
  }

  endDateInput.min = startDateInput.value;
  updateLiveCheck();
});

filterFacility.addEventListener("change", () => {
  if (filterFacility.value !== "all") {
    facilityInput.value = filterFacility.value;
  }
  updateLiveCheck();
});

document.getElementById("refreshButton").addEventListener("click", () => {
  loadBackendData();
});

facilityInput.addEventListener("change", () => {
  filterFacility.value = facilityInput.value || "all";
  updateLiveCheck();
});

startDateInput.addEventListener("change", () => {
  if (!startDateInput.value) return;

  filterDate.value = startDateInput.value;
  endDateInput.min = startDateInput.value;

  if (!endDateInput.value || endDateInput.value < startDateInput.value) {
    endDateInput.value = startDateInput.value;
  }

  updateLiveCheck();
});

endDateInput.addEventListener("change", updateLiveCheck);
startTimeInput.addEventListener("input", updateLiveCheck);
endTimeInput.addEventListener("input", updateLiveCheck);

// ---------- BOOKING FORM ----------

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();

  const facilityName = facilityInput.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const name = document.getElementById("bookerName").value.trim();
  const matricNo = document.getElementById("matricNo").value.trim();
  const contact = document.getElementById("bookerContact").value.trim();
  const clubName = document.getElementById("clubName").value.trim();
  const projectName = document.getElementById("projectName").value.trim();
  const position = document.getElementById("position").value.trim();
  const purpose = document.getElementById("purpose").value.trim();

  // Basic validation
  if (
    !facilityName || !startDate || !endDate || !start || !end ||
    !name || !matricNo || !contact || !clubName ||
    !projectName || !position || !purpose
  ) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (endDate < startDate) {
    showMessage("End date cannot be earlier than start date.", "error");
    return;
  }

  if (start >= end) {
    showMessage("End time must be later than start time.", "error");
    return;
  }

  const selectedFacility = facilities.find(
    item => item.name === facilityName
  );

  if (!selectedFacility) {
    showMessage("Please select a valid facility.", "error");
    return;
  }

  const dateText = formatDateRange(startDate, endDate);
  const timeText = `${formatTime(start)} - ${formatTime(end)}`;

  // Check existing bookings in the loaded data.
  const conflict = getConflict(facilityName, startDate, endDate, start, end);

  if (conflict) {
    showBookingModal({
      type: "conflict",
      title: "Booking Unavailable",
      message:
        "This facility is already booked during the selected time. " +
        "Please choose another time. If your need is urgent or important, " +
        "contact the PIC in charge.",
      details: [
        { label: "Facility", value: facilityName },
        { label: "Date", value: dateText },
        { label: "Time", value: timeText },
        {
          label: "PIC",
          value: (conflict.pic || PIC_INFO.name) +
            (conflict.picContact ? " (" + conflict.picContact + ")" : "")
        }
      ]
    });

    return;
  }

  const payload = {
    facilityId: selectedFacility.id,
    startDate: startDate,
    endDate: endDate,
    startTime: start,
    endTime: end,
    bookerName: name,
    matricNo: matricNo,
    bookerContact: contact,
    clubName: clubName,
    projectName: projectName,
    position: position,
    purpose: purpose
  };

  const submitButton = bookingForm.querySelector('button[type="submit"]');

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
        result.conflict ||
        /clash|conflict|overlap|already booked|not available|booking exists/i.test(
          serverMessage
        );

      showBookingModal({
        type: isConflict ? "conflict" : "error",
        title: isConflict
          ? "Booking Unavailable"
          : "Booking Could Not Be Submitted",
        message: serverMessage,
        details: [
          { label: "Facility", value: facilityName },
          { label: "Date", value: dateText },
          { label: "Time", value: timeText },
          {
            label: "PIC",
            value: (result.picName || PIC_INFO.name) +
              (result.picContact ? " (" + result.picContact + ")" : "")
          }
        ]
      });

      showMessage(serverMessage, "error");
      return;
    }

    // Show the newly saved booking on its start date.
    filterDate.value = startDate;

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
        { label: "Date", value: dateText },
        { label: "Time", value: timeText },
        { label: "Status", value: "Pending" }
      ]
    });

    bookingForm.reset();
    setDefaultDates();
    updateLiveCheck();

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
        { label: "Date", value: dateText },
        { label: "Time", value: timeText }
      ]
    });

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Check and submit booking";
  }
});

// ---------- INITIAL LOAD ----------

renderPicInfo();
loadBackendData();
