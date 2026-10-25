# TazBooked — KK10 Residential College Facility Booking System

**TazBooked** is a web-based facility booking system developed for **Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya**. It provides students with a convenient way to check facility availability and submit reservations for college rooms and sports courts.

The system aims to improve the existing booking process by reducing scheduling conflicts, simplifying reservation management, and making facility availability easier to access.

## 🎯 Project Objectives

- Provide students with an accessible online facility booking platform.
- Display facility availability based on the selected date and time.
- Prevent overlapping reservations for the same facility.
- Centralise facility and booking records using Google Sheets.
- Simplify the reservation process for students and the college management.
- Reduce the need for manual availability checking.

## ✨ Features

### 1. Facility Availability Calendar
- View facility availability by date.
- Check available and booked time slots.
- Filter the schedule by facility.
- View reservation time slots throughout the day.

### 2. Online Facility Booking
- Select a facility, date, start time, and end time.
- Enter the booker's name, contact information, and booking purpose.
- Submit a reservation through the website.
- Receive a confirmation pop-up after a successful submission.

### 3. Booking Conflict Detection
- Check for overlapping reservations before submitting a booking.
- Prevent conflicting reservations for the same facility.
- Allow back-to-back bookings when their time periods do not overlap.
- Inform users when a selected time slot is unavailable.

### 4. Booking Reference
- Display the Booking ID when it is returned by the backend.
- Allow users to copy their Booking ID.
- Encourage students to keep their Booking ID for future reference.

### 5. Centralised Data Management
- Store facility information and booking records in Google Sheets.
- Retrieve facility and reservation data through Google Apps Script.
- Refresh the website to retrieve the latest available data.

### 6. User-Friendly Interface
- Responsive web interface for convenient access.
- Clear booking status and availability indicators.
- Pop-up messages for successful submissions, unavailable time slots, and errors.
- Contact information to help students reach the person in charge (PIC).

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Structures the website content. |
| CSS3 | Styles the website and provides a responsive layout. |
| JavaScript | Handles booking forms, availability display, validation, and pop-ups. |
| Google Apps Script | Connects the frontend to the booking data and processes reservation requests. |
| Google Sheets | Stores facility details and booking records. |
| GitHub | Hosts the source code and supports version control. |
| GitHub Pages | Deploys the website for online access. |

## ⚙️ System Architecture

TazBooked uses a lightweight web architecture that connects the frontend to an online backend and data store.

```text
                 STUDENT
                    |
                    v
          +--------------------+
          |  TazBooked Website |
          |    HTML, CSS, JS   |
          +--------------------+
                    |
                    v
          +--------------------+
          | Google Apps Script |
          |       Backend      |
          +--------------------+
                    |
                    v
          +--------------------+
          |    Google Sheets   |
          |                    |
          |    - Facilities    |
          |    - Bookings      |
          +--------------------+
```

**How it works:**

1. Students open the TazBooked website.
2. The website retrieves facility information and booking records from the backend.
3. Students select a facility and preferred time slot.
4. The system checks availability and validates the reservation request.
5. Google Apps Script processes the request and checks for booking conflicts.
6. Valid reservations are saved to Google Sheets.
7. The website displays the result and refreshes the booking information.

## 📋 Booking Workflow

1. Open the TazBooked website.
2. Select the desired date and facility.
3. Check the availability calendar.
4. Complete the booking form.
5. Review the selected date and time.
6. Submit the reservation.
7. Check the pop-up message and save the Booking ID when provided.
8. Follow the relevant KK10 facility booking procedures.

> **Important:** A successful online submission does not necessarily replace the college's existing procedures. For room reservations, students should contact the PIC or office to arrange key collection and confirm the necessary arrangements. Students should keep their Booking ID and contact the PIC if a scheduling conflict occurs or if they need to cancel a reservation.

## 🏢 Facilities

The system can manage different types of facilities through the `Facilities` sheet.

Examples of facilities configured during development include:

- Discussion Room A
- Multipurpose Room
- Badminton Court 1
- Basketball Court

Facility information includes its ID, name, type, location, person in charge, contact information, and active status.

The facilities displayed on the website depend on the records configured in Google Sheets.

## 🗂️ Data Storage

The Google Sheets spreadsheet contains two main worksheets.

### Facilities

Stores information about facilities available for reservation.

Typical fields include:

- `facilityId`
- `facilityName`
- `type`
- `location`
- `picName`
- `picContact`
- `active`

### Bookings

Stores submitted reservation records.

Typical fields include:

- `bookingId`
- `facilityId`
- `bookingDate`
- `startTime`
- `endTime`
- `bookerName`
- `bookerContact`
- `purpose`
- `status`

The exact column names and structure should match the Google Apps Script implementation.

## 🚀 Deployment

The frontend is deployed using GitHub Pages, while the backend runs as a Google Apps Script web app.

### Frontend — GitHub Pages

1. Open the `college-reservation-system` repository.
2. Upload or update the website files, including `index.html`, `style.css`, and `script.js` if these are the filenames used in the repository.
3. Open the repository's **Settings**.
4. Navigate to **Pages**.
5. Configure the deployment source and branch.
6. Save the settings and wait for GitHub Pages to publish the website.

### Backend — Google Apps Script

1. Create or open the Google Apps Script project.
2. Connect the script to the appropriate Google Sheets spreadsheet.
3. Ensure the backend supports retrieving facility and booking data and processing reservation requests.
4. Deploy the project as a web app.
5. Configure the deployment permissions appropriately.
6. Set the web app endpoint in `script.js` to the deployed Apps Script URL.

**Important:** Do not publish private credentials, sensitive contact information, or unrestricted access to data that should remain confidential. Configure Google Sheets and Apps Script permissions carefully.

## 🧪 Testing

The following scenarios can be used to test the booking system:

| Test Case | Expected Result |
|---|---|
| Load the website | Facility and booking information are displayed. |
| Select a facility and date | The schedule reflects the selected filters. |
| Submit a valid booking | The reservation is saved and a success message is displayed. |
| Book an already-reserved time slot | The system rejects the overlapping reservation. |
| Submit a back-to-back booking | The booking is accepted if the time periods do not overlap. |
| Leave required fields empty | The form displays a validation message. |
| Backend connection fails | The website displays an error message. |
| Submit a reservation successfully | The Booking ID is displayed if returned by the backend. |

## 🔮 Future Improvements

Potential improvements include:

- Automated email or WhatsApp notifications for relevant parties.
- An administrative dashboard for managing reservations.
- Booking cancellation and modification functionality.
- More advanced booking status management.
- Booking history for individual students.
- Improved mobile accessibility.
- Reports and statistics on facility usage.
- Stronger authentication and access control.

These are potential future enhancements and may not be implemented in the current version.

## 🎓 Project Context

TazBooked is a practical software development project designed to address facility reservation challenges in a residential college environment. It applies web development, backend integration, data management, validation, and user interface design to a real-world campus use case.

## 👨‍💻 Author

**HakimieAbdKadir**

Developed for **Kolej Kediaman Tun Ahmad Zaidi (KK10), Universiti Malaya**.

---

*TazBooked — Making KK10 facility reservations simpler and more organised.*
