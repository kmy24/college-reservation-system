# TazBooked — KK10 Residential College Room Booking System

**TazBooked** is a web-based room booking system developed for **Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya**. Students can check room availability hour by hour, submit a reservation, and receive an email when the person in charge (PIC) approves it.

The system reduces scheduling conflicts, simplifies reservation management, and keeps all records in Google Sheets.

> A full step-by-step **User Guide** (for students and for the PIC/administrator) is available as a Google Doc: *TazBooked User Guide*. Add its share link here: `[User Guide](PASTE-LINK-HERE)`

## 🎯 Project Objectives

- Provide students with an accessible online room booking platform.
- Show availability for any selected day in a clear hourly table.
- Prevent overlapping reservations for the same room.
- Collect complete applicant and project details for each booking.
- Let the PIC approve bookings from Google Sheets and notify applicants automatically by email.
- Centralise facility and booking records in Google Sheets.

## ✨ Features

### 1. Dashboard and Rules
- Short, focused dashboard with a direct link to the booking form.
- Rules & Regulations for room reservations and general reminders, including what to do when there is a clash that is urgent or important (contact the PIC in charge).

### 2. Facility Availability (hourly table)
- Table view with one row per hour (7–8 AM, 8–9 AM, and so on) and one column per facility.
- Booked cells show the JKP/club name and booked time; Pending bookings are labelled.
- Filter by date and by facility.
- **Day navigator:** a 7-day strip showing "Free" or the number of bookings for each day, with previous/next day buttons and a Today button, so users can view availability on other days.
- Hours outside the standard 7 AM – 11 PM range appear automatically if a booking falls there.

### 3. Online Booking Form
All fields are required and labelled in capital letters:

| Field | Description |
|---|---|
| NAME | Applicant's full name |
| MATRIC NO. | Applicant's matric number |
| TELEPHONE NO. | Contact number |
| EMAIL | Where the approval email is sent |
| JKP/CLUB NAME | Committee or club using the room |
| PROJECT/PROGRAMME | Name of the project or programme |
| POSITION OF APPLICANT IN THE PROJECT | Applicant's role |
| PURPOSE OF RESERVATION | Reason for the booking |
| START DATE / END DATE | Supports single-day and multi-day bookings |
| START TIME / END TIME | Daily time window (applies to each day in the range) |
| FACILITY | Room to be booked |

### 4. Conflict Detection
- **Live check** under the form tells the user if the chosen time clashes, and the chosen time is outlined in the availability table (red with "CLASH" if it overlaps).
- The front end checks for overlaps before submitting, and the backend checks again when saving (with a script lock to prevent two simultaneous bookings).
- Date ranges and time ranges are both compared; back-to-back bookings (e.g. 9–11 and 11–12) are allowed.
- `Pending` and `Approved` bookings block the time; `Rejected` and `Cancelled` free it.

### 5. Booking Reference and Pop-ups
- Success, clash, and error pop-ups.
- Booking ID shown with a **Copy Booking ID** button.

### 6. Approval Status and Email Notification
- New bookings are saved with the status **Pending**.
- The PIC changes the **STATUS** dropdown in Google Sheets (Pending, Approved, Rejected, Cancelled).
- When set to **Approved**, an email is sent automatically to the applicant containing the Booking ID, status, facility, date, time, applicant and project details, reminders, and the PIC's contact.
- When set to **Rejected**, the applicant receives a "Booking Not Approved" email with the booking details, next steps, and the PIC's contact. No email is sent for Cancelled.
- Column **EMAIL SENT** records `SENT Approved` or `SENT Rejected` with a timestamp (or `FAILED` with the reason). Each status is emailed once; a failed email can be retried by setting the status again.

### 7. PIC Information (easy to change)
- The *Before you book* panel shows the PIC in charge. Change the name, phone number, and WhatsApp number in the `PIC_INFO` block at the top of `script.js`.

### 8. Privacy
- Matric number, telephone number, and email are stored in the sheet but are **not** sent to the public website. The public page only receives non-sensitive booking details (club name, project, purpose, times, status).

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Responsive styling, availability table, day navigator |
| JavaScript | Form validation, hourly table, live clash check, pop-ups |
| Google Apps Script | Backend API, conflict checking, status dropdown, approval emails |
| Google Sheets | Stores facilities and bookings |
| Gmail (MailApp) | Sends approval emails |
| GitHub / GitHub Pages | Source control and hosting |

## ⚙️ System Architecture

```text
                 STUDENT                         PIC / ADMIN
                    |                                 |
                    v                                 v
          +--------------------+            +--------------------+
          |  TazBooked Website |            |    Google Sheets   |
          |    HTML, CSS, JS   |            |  (set STATUS cell) |
          +--------------------+            +--------------------+
                    |                                 |
                    v                                 | edit trigger
          +--------------------+                      v
          | Google Apps Script | <--------------------+
          |  doGet / doPost    |
          |  onBookingStatusEdit
          +--------------------+
              |            |
              v            v
   +----------------+   +-----------------------+
   |  Google Sheets |   | Approval email (Gmail)|
   | Facilities     |   | sent to the applicant |
   | Bookings       |   +-----------------------+
   +----------------+
```

**How it works**

1. The student opens the website, which loads facilities and bookings from the Apps Script web app.
2. The student checks the hourly availability table and fills in the booking form.
3. The website checks for overlaps and shows a live clash message.
4. On submit, Apps Script validates the request, checks for conflicts again, and saves the booking as **Pending**.
5. The PIC reviews the booking in Google Sheets and sets the status to **Approved**.
6. An installable edit trigger sends the approval email to the applicant and marks the row as sent.

## 📋 Booking Workflow (student)

1. Open the TazBooked website and read the Rules & Regulations.
2. Choose a date (or use the day strip) and check the availability table.
3. Complete the booking form; watch the live clash message.
4. Submit and save the **Booking ID**.
5. Wait for the approval email.
6. Contact the PIC on duty to arrange key collection, and return the key and leave the room clean after use.
7. To cancel, or if there is an urgent clash, contact the PIC in charge.

> **Important:** An online submission is **Pending** until approved. Students should keep their Booking ID and follow the KK10 procedures for key collection.

## 🗂️ Data Storage

### Facilities sheet

| Column | Header | Notes |
|---|---|---|
| A | FACILITY ID | e.g. `F001` |
| B | FACILITY NAME | Shown on the website |
| C | TYPE | e.g. Room |
| D | LOCATION | |
| E | PIC NAME | Used in clash messages and emails |
| F | PIC CONTACT | Used in clash messages and emails |
| G | ACTIVE | Checkbox (TRUE = shown on the website) |

The facilities shown on the website depend on the rows marked **Active**.

### Bookings sheet

| Column | Header | Notes |
|---|---|---|
| A | BOOKING ID | Generated automatically |
| B | FACILITY ID | Matches the Facilities sheet |
| C | START DATE | `yyyy-mm-dd` |
| D | START TIME | `hh:mm` |
| E | END TIME | `hh:mm` |
| F | NAME | |
| G | TELEPHONE NO. | Private |
| H | PURPOSE OF RESERVATION | |
| I | STATUS | Dropdown: Pending, Approved, Rejected, Cancelled |
| J | CREATED AT | Timestamp |
| K | END DATE | Empty in old rows = single-day booking |
| L | MATRIC NO. | Private |
| M | JKP/CLUB NAME | |
| N | PROJECT/PROGRAMME | |
| O | POSITION OF APPLICANT IN THE PROJECT | |
| P | EMAIL | Approval email recipient |
| Q | EMAIL SENT | Filled automatically |

Old rows with the status `Confirmed` still block the time slot.

## 🚀 Deployment

### Backend — Google Apps Script

1. Create the Google Sheet with the **Facilities** and **Bookings** tabs.
2. Open **Extensions → Apps Script** and paste in `Code.gs`. Save.
3. Run **`setupBookingsSheet`** once (writes headers A–Q and adds the STATUS dropdown).
4. Run **`authorizeEmail`** once and accept the permissions (sends a test email to you).
5. Run **`createEditTrigger`** once (installs the trigger that sends approval emails).
6. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*. Copy the web app URL.
7. After any later change to `Code.gs`: **Deploy → Manage deployments → Edit → New version**.

### Frontend — GitHub Pages

1. Put the web app URL into `API_URL` at the top of `script.js`.
2. Edit `PIC_INFO` in `script.js` with the current PIC details.
3. Upload `index.html`, `style.css`, and `script.js` to the repository.
4. In **Settings → Pages**, choose the branch and save. Wait for the site to publish.

**Security note:** Do not make the spreadsheet public. It contains matric numbers, telephone numbers, and email addresses. Keep Apps Script and Sheets permissions restricted to the PIC/administrator.

## 👩‍💼 PIC / Administrator Guide (quick version)

- **Approve a booking:** set STATUS to **Approved** in the Bookings sheet; the applicant is emailed automatically.
- **Reject:** set STATUS to **Rejected**; the time becomes free and the applicant is emailed.
- **Cancel:** set STATUS to **Cancelled**; the time becomes free. No email is sent.
- **Email failed:** column Q shows the reason. Fix it (for example add a missing email in column P), set STATUS to Pending, then back to Approved.
- **Add or hide a room:** add a row in Facilities, or untick **Active**.
- **Change the PIC on the website:** edit `PIC_INFO` in `script.js`.
- **Email limits:** about 100 emails/day on a personal Gmail account, about 1,500/day on Google Workspace.

## 🧪 Testing

| Test Case | Expected Result |
|---|---|
| Load the website | Facilities and bookings load; the hourly table is shown |
| Click a day in the day strip / use ← → / Today | The table updates to that date |
| Select a facility | The table shows only that facility's column |
| Submit a valid booking | Success pop-up with Booking ID; row added as Pending |
| Choose a time that overlaps a booking | Live clash message; table cell outlined red; submission rejected |
| Back-to-back booking (e.g. 11–12 after 9–11) | Accepted |
| Multi-day booking | Blocks the time on every day in the range |
| Leave a field empty / invalid email | Validation message |
| End date before start date, or end time before start time | Validation message |
| Set STATUS to Approved | Approval email is sent; column Q shows SENT |
| Set STATUS to Rejected | Rejection email is sent; the time becomes available again |
| Set STATUS to Cancelled | The time becomes available again; no email |
| Backend connection fails | Error message is displayed |

## 🔮 Future Improvements

- Notifications for cancelled bookings, and a reason field for rejections.
- Booking cancellation and modification from the website.
- WhatsApp notifications.
- Booking history for individual students.
- Reports and statistics on room usage.
- Stronger authentication and access control.

These are potential enhancements and are not part of the current version.

## 🎓 Project Context

TazBooked is a practical software development project that addresses room reservation challenges in a residential college. It applies web development, backend integration, data management, validation, and user interface design to a real campus use case.

## 👨‍💻 Author

**HakimieAbdKadir**

Developed for **Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya**.

---

*TazBooked — Making KK10 room reservations simpler and more organised.*
