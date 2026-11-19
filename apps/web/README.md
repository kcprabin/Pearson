# User Frontend - Travallee Hotel Management System

The public-facing website for the Travallee Hotel Management Platform. Browse hotels, search availability, and manage bookings through a modern, responsive React and TypeScript interface.

## Overview

### Features

* Hotel Browsing - Discover available hotels and rooms
* Search & Filter - Find rooms by date, location, price, and amenities
* Booking System - Manage reservations with ease
* User Accounts - Register, log in, and manage bookings
* Payment Integration - Secure payment processing
* Reviews & Ratings - View guest reviews and ratings
* Responsive Design - Optimized for desktop, tablet, and mobile devices

---

## Technology Stack

* **React 19.2** with **TypeScript 5.9**
* **Vite 8.0** for fast builds and development
* **Tailwind CSS 3.4** for styling
* **React Router v6** for navigation
* **Zustand** for state management (optional)

---

## Project Structure

```text
src/
├── Pages/
│   ├── InitialHome.tsx
│   ├── AboutUs.tsx
│   ├── Services.tsx
│   ├── ContactUs.tsx
│   └── Loginpage.tsx
├── Components/
│   ├── InitialNav.tsx
│   ├── Herosection.tsx
│   └── Footer.tsx
├── Contexts/
│   └── Authcontext.tsx
├── Routes/
│   └── Route.tsx
├── App.tsx
└── main.tsx
```

---

## Getting Started

### Prerequisites

* Node.js 18.0.0 or higher
* npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Application runs at:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_AUTH_SERVICE_URL=http://localhost:3000/api/v1

# Application Settings
VITE_APP_NAME=Travallee
VITE_MOCK_API=true
```

---

## Styling

* Tailwind CSS for utility-first styling
* Global styles located in `src/App.css`
* Mobile-first responsive design
* Plus Jakarta Sans font family

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code
```

---

## Development Guidelines

1. Follow TypeScript best practices.
2. Keep components modular and reusable.
3. Use environment variables for configuration values.
4. Maintain responsive design principles.
5. Write clean and maintainable code.
6. Test changes before deployment.

---

## Contributing

Refer to the project's `CONTRIBUTING.md` file for contribution guidelines and development standards.

---

## License

This project is licensed under the MIT License.

---

**Part of the Travallee Hotel Management System**
