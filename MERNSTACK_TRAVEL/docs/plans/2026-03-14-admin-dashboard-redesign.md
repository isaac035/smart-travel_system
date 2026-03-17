# Admin Dashboard Professional Redesign — Ceylon Compass

**Date:** 2026-03-14
**Approach:** B — Professional Redesign (warm travel/hospitality admin)

---

## Design Direction

Modern travel/hospitality admin dashboard — warm amber tones, dark sidebar with light content area. Inspired by Booking.com extranet and Airbnb host dashboard. Polished, professional, real SaaS feel.

## Color System & Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Sidebar bg | `slate-900` | Main sidebar background |
| Sidebar hover | `slate-800` | Nav item hover |
| Sidebar active | `amber-500/10` bg + `amber-500` left border + text | Active nav item |
| Content bg | `gray-50` | Main content area |
| Card bg | `white` | All cards, tables, form containers |
| Card border | `gray-200` | Subtle card borders |
| Card shadow | `shadow-sm` → `shadow-md` on hover | Depth |
| Primary accent | `amber-500` / `amber-600` | CTAs, active states, highlights |
| Text primary | `gray-900` | Headings |
| Text secondary | `gray-500` | Labels, meta text |
| Success | `emerald-500` | Active, confirmed, positive trends |
| Warning | `amber-500` | Pending states |
| Danger | `rose-500` | Errors, rejected, delete actions |
| Info | `blue-500` | Informational badges |

**Typography:**
- Page titles: `text-2xl font-bold text-gray-900`
- Subtitles: `text-sm text-gray-500`
- Table headers: `text-xs font-semibold uppercase tracking-wider text-gray-500`
- All inputs: `rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500`

---

## Sidebar

- Brand: "Ceylon Compass" with amber accent icon
- Dark slate-900 background
- Grouped navigation with section labels (MAIN, MANAGEMENT, SYSTEM)
  - MAIN: Dashboard, Payments
  - MANAGEMENT: Locations, Hotels, Guides, Tour Packages, Products
  - SYSTEM: Users
- Active item: 3px left amber-500 border + amber-500/10 bg + amber-500 text
- Hover: slate-800 bg with smooth transition
- Icons: 20px Lucide, gray-400 default → amber-500 when active
- Collapse mode: icons only, section labels hidden
- Profile card at bottom: avatar circle with initials, name, "Administrator" text-xs gray-400

---

## Dashboard Home Page

**Top:** Welcome header + date range picker (presets: Today, Last 7 days, Last 30 days, This month, Custom)

**KPI Cards (6):**
- Total Users, Total Bookings, Total Revenue, Locations, Hotels, Monthly Growth
- White bg, rounded-xl, subtle border
- Icon in colored circle, value text-2xl font-bold, label text-sm gray-500
- Trend indicator: green up / red down arrow with percentage
- Responsive grid: 2 cols mobile, 3 cols tablet, 6 cols desktop

**Charts Row:**
- Revenue Overview: Area chart with amber gradient fill (Recharts)
- Bookings by Type: Donut chart — Hotel (violet), Tour (rose), Guide (cyan)

**Bottom Row:**
- Popular Destinations: Ranked list with location thumbnails + booking count
- Recent Activity: Timeline feed with type icon, description, relative timestamp

---

## Data Tables (All Management Pages)

**Structure:**
- Header: Page title + count + search bar + filter dropdown + "Add New" button
- Search: Debounced, searches name/location fields
- Filters: Page-specific dropdowns
- Thumbnails: 40x40 rounded image preview, fallback to colored initials
- Status badges: Rounded pills (emerald/amber/gray)
- Row hover: `bg-gray-50`
- Actions: Three-dot menu or inline icon buttons (Edit/Delete)
- Pagination: "Showing 1-10 of 18" + page buttons, 10 per page
- Empty state: Icon + "No items found" + CTA button
- Table header: `text-xs uppercase tracking-wider text-gray-500 bg-gray-50`

**Per-page filters:**
| Page | Filters |
|------|---------|
| Locations | Category, Province |
| Hotels | Stars, Price range |
| Guides | Availability, Language |
| Tours | Duration, Price range |
| Products | Category, Weather |
| Users | Role |
| Payments | Type, Status |

---

## Form UI Polish

- Keep existing add/edit/remove flow — no structural changes
- Section dividers with labels (General Info, Pricing & Details, Media)
- Input styling: `rounded-lg border-gray-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500`
- Labels: `text-sm font-medium text-gray-700`
- 2-column grid desktop, 1-column mobile
- Image upload: Dashed border drag-drop zone, thumbnail previews with remove button
- Toggle switches: Amber-styled for booleans
- Buttons: Cancel = gray outline, Save = amber-500 solid
- All inline styles migrated to Tailwind

---

## Navbar

- Dynamic page title based on route
- Global search bar: `rounded-lg bg-gray-100`
- Notification bell with red dot indicator (visual only)
- Profile dropdown: Avatar + chevron → Profile, Settings, Logout
- Mobile: Hamburger for sidebar drawer, search collapses to icon

---

## Micro-interactions

- Card hover: `transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`
- Button press: `active:scale-95`
- Loading: Animated pulse skeletons matching card/table shapes
- Empty states: Consistent icon + message + CTA
- Toast: Top-right, auto-dismiss 3s, amber success / rose error

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-day-picker` | Date range picker for dashboard |
| `react-hot-toast` | Toast notifications |

---

## Pages Affected

1. AdminLayout.jsx (sidebar + navbar)
2. AdminDashboard.jsx (full redesign)
3. AdminPaymentsPage.jsx (table + form polish)
4. AdminLocationsPage.jsx (table + form polish)
5. AdminHotelsPage.jsx (table + form polish)
6. AdminGuidesPage.jsx (table + form polish)
7. AdminToursPage.jsx (table + form polish)
8. AdminProductsPage.jsx (table + form polish)
9. AdminUsersPage.jsx (table + form polish)
