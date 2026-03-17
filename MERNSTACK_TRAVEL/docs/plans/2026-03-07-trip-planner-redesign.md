# Trip Planner Redesign - Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

Complete redesign of the Trip Planner feature within the Explore page's "Plan Your Trip" tab. Replaces the current single-panel layout with a step-by-step wizard, adds smart auto-grouping of locations, real road routing via OpenRouteService, and a polished light-theme UI matching the Explore page.

## User Flow (4-Step Wizard)

### Step 1 - Setup
- Trip name input (default: "My Sri Lanka Trip")
- Trip duration selector: 1 to 10 days (pill buttons)
- Travel pace selector: Relaxed (2-3 stops/day), Moderate (4-5), Packed (6-7)
- Start point: detect current GPS location OR search/pick from map
- Default start point: Colombo (6.9271, 79.8612)

### Step 2 - Select Locations
- Split layout: location grid/list (40% left), full map (60% right)
- Only admin-added locations shown (from /api/locations)
- Blue pulsing marker for user's current location on map
- Red pin markers for all available locations
- Filter by category + search by name/district
- Click card or map marker to toggle selection (amber border + checkmark)
- Selected count badge at top

### Step 3 - Auto-Generated Itinerary
- System auto-groups selected locations into days using smart hybrid algorithm
- Day-by-day itinerary cards on left, route map on right
- Color-coded route polylines per day
- Distance + drive time labels between each stop ("15 km - 28 min")
- Per-day summary: "Day 1: 3 stops - 87 km - ~2h 15min"
- Total trip summary: "4 days - 12 stops - 342 km total"
- Drag-and-drop reorder within/between days
- Notes per location
- "Suggest Alternative Route" button recalculates with different approach

### Step 4 - Save & Export
- Save button (registered users only, toast if not logged in)
- Export as PDF with day-by-day breakdown, distances, notes
- Print via browser print dialog
- After saving, trip appears in Profile page "Trip Plans" tab

## Auto-Grouping Algorithm

1. **Distance matrix**: Call OpenRouteService Matrix API with all selected locations + start point for real driving distances/times
2. **Max stops per day** based on pace setting:
   - Relaxed: 2-3 stops
   - Moderate: 4-5 stops
   - Packed: 6-7 stops
3. **Nearest-neighbor clustering**:
   - Day 1: From start point, pick nearest unvisited location, then nearest from there, until day limit reached
   - Day 2: Continue from last location of Day 1
   - Repeat until all locations assigned or days exhausted
   - Warn user if locations exceed capacity for chosen pace/duration
4. **Alternative route**: Re-run algorithm starting from farthest location (reverse direction) or swap geographic flow (clockwise vs counterclockwise)

### Edge Cases
- 1 location: Show on Day 1, no routing needed
- No start point: Default to Colombo
- User drags location to different day: Recalculate distances for affected days, update route on map

## Components

| Component | Purpose |
|---|---|
| `TripPlannerPage.jsx` | Main wizard container with step state |
| `TripSetupStep.jsx` | Name, duration, pace, start point selection |
| `LocationSelectStep.jsx` | Map + location grid with filtering & selection |
| `ItineraryStep.jsx` | Auto-generated day plan, drag-and-drop, route display |
| `TripSaveBar.jsx` | Save/export/print actions |
| `RouteConnector.jsx` | Distance label between location cards |
| `UserLocationMarker.jsx` | Blue pulsing marker for current GPS |

## Backend Changes

### Model Update - TripPlan
Add fields:
- `startPoint`: { lat, lng, name }
- `pace`: String enum ['relaxed', 'moderate', 'packed']
- `totalDistance`: Number (km)
- `totalDuration`: Number (minutes)

### New API Endpoints
- `GET /api/routes/matrix` - Proxy to OpenRouteService distance matrix API
- `GET /api/routes/directions` - Proxy to OpenRouteService route polyline API

### Existing Endpoints (no changes needed)
- `GET /api/trips/my` - Fetch user's saved trips
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

## Profile Page Integration

- Add "Trip Plans" tab as 5th tab in ProfilePage
- Each saved trip displayed as a card:
  - Trip name, creation date
  - Day count, stop count, total distance
  - First 3-4 location thumbnail images
  - Actions: Edit (load into planner), Download PDF, Delete
- Edit navigates to /explore with trip tab active and data loaded

## UI Theme

**Light theme** matching Explore page:
- Background: `bg-gray-50` / `bg-gray-100`
- Cards: `bg-white`, `border-gray-200`, `shadow-sm`
- Text: `text-gray-900` primary, `text-gray-500` secondary
- Accent: `amber-500/600` buttons, `amber-400` highlights
- Hover: `hover:border-amber-400`, `hover:shadow-md`, `hover:-translate-y-0.5`
- Map markers: blue pulsing (user), red pins (all locations), amber filled (selected/day stops)
- Step progress indicator with amber active state
- Smooth transitions between steps

## External Dependencies

- **OpenRouteService API** (free, open-source): Distance matrix + route directions
- **@dnd-kit** (already installed): Drag-and-drop reordering
- **react-leaflet** (already installed): Map rendering
- **jsPDF** (already installed): PDF export
- **Browser Geolocation API**: User current location
