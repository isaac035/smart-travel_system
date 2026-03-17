# Profile Page Redesign — Light Mode Modern UI

**Date:** 2026-03-14
**File:** `client/src/pages/profile/ProfilePage.jsx`

## Overview

Redesign the user profile page from dark mode basic UI to a modern light mode design that combines dashboard-like stats, social/personal feel (cover banner + avatar), and clean functional layout. Must match the existing light-mode design language used across tour, hotel, and other pages.

## 1. Cover Banner + Avatar Header

- Wide banner (`h-48` md:`h-56`) with default Sri Lanka scenic photo, `rounded-2xl` top corners
- Camera icon button (absolute, bottom-right of banner) to upload custom cover image
- Avatar (96px) overlapping banner bottom edge by ~half, white ring (`ring-4 ring-white`), left-aligned
- Name + email + "Member since" text beside avatar, below banner
- Admin badge pill (amber-500/20 bg, amber-700 text) if applicable
- "Edit Profile" outlined button (amber border, amber text) aligned right
- Stats row: 3 inline stat cards (Total Bookings, Confirmed, Orders) — white bg, border-gray-200, amber accent numbers

## 2. Quick Links

- Horizontal row of outlined link chips below header
- Links: My Guide Bookings, My Tour Bookings, Shop Products, Explore, Trip Plans
- Visible on all screen sizes (not desktop-only)
- Style: border-gray-200, text-gray-600, hover:border-amber-500 hover:text-amber-600, rounded-lg, text-sm

## 3. Underline Tabs — "My Activity"

- Section heading "My Activity" (text-xl font-bold text-gray-900)
- Horizontal text tabs, no background
- Active: text-amber-600 with amber-500 underline (2px), font-medium
- Inactive: text-gray-500, hover:text-gray-700
- Tabs: Hotel Bookings | Guide Bookings | Tour Bookings | Travel Products | Trip Plans

## 4. Booking/Order Cards

### Standard booking card (Hotels, Guides, Tours)
- White bg, rounded-2xl, border border-gray-200, shadow-sm
- Hover: shadow-lg, -translate-y-0.5 transition
- Layout: image thumbnail (64x64, rounded-lg) left | details middle | view link right
- Details: name (font-medium text-gray-900), status badge, date/meta line (text-sm text-gray-500), price (text-amber-600 font-semibold)
- Status badges: rounded-full px-2.5 py-0.5 text-xs font-medium
  - pending: bg-yellow-50 text-yellow-700 border border-yellow-200
  - confirmed: bg-green-50 text-green-700 border border-green-200
  - rejected: bg-red-50 text-red-700 border border-red-200
  - cancelled: bg-gray-100 text-gray-600 border border-gray-200

### Product order card
- Same white card style
- Order header: mono order ID (#XXXXXXXX), status badge, amount (amber), date
- Itemized list: type badge (product/bundle), name, qty, line total
- Status message footer with colored text

### Trip plan card
- Same white card style
- Map emoji icon, trip name, day/stop/distance stats
- Location thumbnail row (up to 4 images)
- Edit + Delete action buttons

## 5. Slide-over Edit Panel

- Slides from right, ~400px wide, white bg
- Semi-transparent backdrop (bg-black/30) with click-to-close
- Smooth transition: translateX(100%) → translateX(0)
- Header: "Edit Profile" title + close X button
- Fields:
  - Name input (bg-gray-50, border-gray-200, focus:border-amber-500, rounded-xl)
  - Avatar upload with circular preview
  - Cover photo upload with rectangular preview
- Footer: Save button (amber gradient CTA) + Cancel (outlined)

## 6. Empty States

- Centered, py-16
- Muted text (text-gray-400), text-lg message
- Amber "Browse now" link

## 7. Design Tokens

| Token | Value |
|-------|-------|
| Page bg | `bg-gray-50` |
| Card bg | `bg-white` |
| Card border | `border border-gray-200` |
| Card radius | `rounded-2xl` |
| Card shadow | `shadow-sm` → hover: `shadow-lg` |
| Primary text | `text-gray-900` |
| Secondary text | `text-gray-500` |
| Accent | `amber-500` / `amber-600` |
| Input bg | `bg-gray-50` |
| Input border | `border-gray-200` → focus: `border-amber-500` |
| Input radius | `rounded-xl` |

## 8. Responsive Behavior

- Banner: full width, h-48 on mobile, h-56 on md+
- Avatar + info: stacked centered on mobile, horizontal on md+
- Stats: horizontal row, wrap on small screens
- Quick links: horizontal scroll on mobile
- Tabs: horizontal scroll on mobile
- Cards: full width, single column
- Slide-over: full width on mobile, 400px on desktop
