# Hotel Management System – Feature Requirements (v2.1)

This document outlines the functional and technical requirements for new features to be integrated into the Hotel Management System (HMS). The goal is to ensure seamless integration with the existing infrastructure.

---

## 🔑 Core Integration Requirements

### 1. Authentication & Authorization

-   **JWT-Based Authentication**: All new API endpoints must be secured using the existing JWT-based authentication system.
-   **Role-Based Access Control (RBAC)**: Feature access must be restricted based on user roles (e.g., Manager, Front Desk, Housekeeping Supervisor, Staff). Permissions should be granular.

### 2. API Endpoint Strategy

-   **RESTful Principles**: All new endpoints must adhere to RESTful design principles.
-   **Standardized Responses**: API responses must follow a consistent format for successes and errors.
-   **Versioning**: New endpoints should be versioned (e.g., `/api/v2/...`) to avoid conflicts with existing APIs.

---

## 🧭 Dashboard Module

### 1. Real-Time Availability and Pricing on Calendar

-   **Requirement**: Display a calendar view showing room availability and dynamic pricing.
-   **UI**: The calendar should allow date range selection and display room types vertically and dates horizontally.
-   **API Endpoint**: `GET /api/v2/dashboard/availability-calendar?startDate={date}&endDate={date}`
    -   Returns a matrix of room types, dates, availability counts, and daily rates.

### 2. Occupancy Heatmaps

-   **Requirement**: Visualize daily, weekly, or monthly occupancy rates using a color-coded heatmap.
-   **UI**: A heatmap component that changes color intensity based on occupancy percentage.
-   **API Endpoint**: `GET /api/v2/dashboard/occupancy-heatmap?period={daily|weekly|monthly}`
    -   Returns data structured for heatmap visualization (e.g., `[{date: 'YYYY-MM-DD', occupancy: 85}, ...]`).

### 3. Revenue per Available Room (RevPAR)

-   **Requirement**: Calculate and display real-time and historical RevPAR.
-   **Formula**: `RevPAR = Total Room Revenue / Number of Available Rooms`
-   **API Endpoint**: `GET /api/v2/dashboard/revpar?period={today|7d|30d|custom}&startDate={date}&endDate={date}`
    -   Returns calculated RevPAR, total revenue, and available rooms for the specified period.

---

## 📅 Booking Module

### 1. Booking Modifications and Cancellations

-   **Requirement**: Allow authorized staff to modify or cancel existing individual guest bookings.
-   **API Endpoints**:
    -   `PUT /api/v2/bookings/{bookingId}`: To update dates, room types, or guest details.
    -   `POST /api/v2/bookings/{bookingId}/cancel`: To cancel a booking, applying relevant cancellation policies.

### 2. Custom Billing for Amenities and Services

-   **Requirement**: Add custom charges (e.g., minibar, airport transfer) to an individual booking.
-   **UI**: A modal in the booking details view to add line items with descriptions and prices.
-   **API Endpoint**: `POST /api/v2/bookings/{bookingId}/charges`
    -   Accepts an array of charge items to be added to the guest's folio.

---

## 🧹 Housekeeping Management Module

### 1. Room Cleaning Status Tracking

-   **Requirement**: Track and update room cleaning statuses in real-time.
-   **Statuses**: `Clean`, `Dirty`, `In-Progress`, `Out-of-Service`.
-   **API Endpoint**: `PUT /api/v2/rooms/{roomId}/status`
    -   Payload: `{ status: 'Clean' }`.

### 2. Automated Room Status Updates

-   **Requirement**: Automatically update room status based on guest check-in/check-out events.
-   **Triggers**:
    -   On **Check-in**: Status changes to `Occupied`.
    -   On **Check-out**: Status changes to `Dirty`.
-   **Implementation**: This will be handled by the backend logic, triggered by the existing check-in/out processes.

### 3. Housekeeper Task Assignments

-   **Requirement**: Allow supervisors to assign rooms to housekeepers.
-   **UI**: A drag-and-drop interface to assign rooms from an "Unassigned" list to available housekeepers.
-   **API Endpoint**: `POST /api/v2/housekeeping/assignments`
    -   Payload: `{ housekeeperId: '...', roomIds: ['...', '...'] }`.

---

## 🧾 Point of Sale (POS) Module

### 1. Restaurant/Bar & Service Integration

-   **Requirement**: Record guest purchases from various POS stations (restaurant, bar, spa, laundry) and post charges to their room account.
-   **API Endpoint**: `POST /api/v2/pos/charges`
    -   Payload: `{ bookingId: '...', items: [{ description: '...', amount: ... }], outlet: 'Restaurant' }`.
    -   This single endpoint will handle charges from all integrated services.

### 2. Consolidated Room Bill

-   **Requirement**: Ensure all POS purchases are consolidated into the guest’s final bill in real-time.
-   **Implementation**: The `POST /api/v2/pos/charges` endpoint will ensure immediate posting to the guest's folio, making it visible on their bill instantly.

---

## ✅ Next Steps

-   **API Documentation**: Create detailed documentation to be build for all new `v2` endpoints.
-   **Frontend Implementation**: Develop Vue components for each new feature, consuming the defined endpoints.
-   **Database Schema**: document database schemas to support new data requirements (e.g., task assignments, POS charges).
-   **User interface** The new user interface should reflect existing user interface in place.
-   **User Experience**: Ensure the new features enhance the user experience, not hinder it.
