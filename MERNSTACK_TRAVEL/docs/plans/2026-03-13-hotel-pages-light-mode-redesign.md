# Hotel Pages — Light Mode Redesign

**Date:** 2026-03-13
**Status:** Approved

## Overview

Full redesign of all user-facing hotel pages from dark mode to light mode with a clean, minimal yet modern and bold aesthetic. Maintains amber accent consistency with tour pages.

## Global Styling

- Background: `bg-gray-50` (matches tour pages)
- Text: `text-gray-900` primary, `text-gray-500` secondary
- Cards: `bg-white`, `rounded-2xl`, `shadow-sm` → `hover:shadow-xl`
- Accent: amber-500/600 for CTAs, prices, active states
- Font weight hierarchy: bold headings, medium labels, regular body

## 1. Landing Page (HotelLandingPage)

### Hero — Split Layout
- Left: headline, subtitle, search widget (location, dates, guests) with amber CTA
- Right: 2x2 image collage with rounded corners, subtle shadow
- `bg-white` section

### Hotel Sections (Hot Deals, Popular, Top Rated)
- Section headers with title + "View All →" link
- Vertical cards in 4-column grid
- White bg, rounded-2xl, shadow-sm → hover:shadow-xl, hover:-translate-y-1
- Image top, details below (name, location, stars, price, discount badge)

### Map Section
- White card wrapper, rounded-2xl, shadow-sm
- Light tile Leaflet map

## 2. Search Page (HotelSearchPage)

### Top Filter Bar
- Sticky horizontal bar (bg-white, shadow-sm, border-b)
- Inline: location, star rating, price range, Apply (amber), Clear, Map toggle

### Hotel List
- Horizontal cards stacked vertically
- White bg, rounded-2xl, shadow-sm, hover:shadow-lg
- Image left, details right (name, location, amenities, stars, price, reviews)
- Pagination with amber active state

### Map (toggleable)
- Slides in or overlay
- Light OpenStreetMap tiles
- Popups with thumbnail, name, price

## 3. Details Page (HotelDetailsPage)

### Image Grid Header
- 1 large (60%) + 4 small (2x2 grid)
- "Show all photos" overlay on last image
- Lightbox modal for full gallery

### Content — Two Columns (lg:grid-cols-3)

**Left (col-span-2):**
- Hotel name, stars, location
- About section
- Amenities grid (icon + label, gray-50 bg badges)
- Events & Weddings cards
- Dining & Policies
- Guest Reviews (average card + list + form)

**Right (col-span-1):**
- Sticky booking card (price, dates, guests, "Book Now" CTA)
- Contact info

## 4. Booking Page (HotelBookingPage)

### Stepper/Wizard (3 steps)
- Step 1: Dates & Room (check-in/out, room type, count, guests)
- Step 2: Guest Details (name, email, phone, requests)
- Step 3: Payment (slip upload, terms)
- Active: amber circle + bold. Completed: green check.
- Back/Continue navigation

### Sticky Summary Sidebar
- Hotel preview, price breakdown, capacity warning

## 5. HotelCard Component

Two variants via `variant` prop:
- `vertical` — image top, details below (landing page)
- `horizontal` — image left, details right (search page)
- Same white card styling, highlight system preserved
