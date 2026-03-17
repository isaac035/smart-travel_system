# Sri Lanka Travel Guide — Full System Design
**Date:** 2026-03-06
**Stack:** MERN (MongoDB, Express, React + Vite, Node.js)
**DB:** MongoDB Atlas — `Ceylon` database
**Images:** Cloudinary
**Maps:** React-Leaflet (OpenStreetMap)
**Weather:** OpenWeatherMap API
**UI:** Tailwind CSS + Shadcn/ui + react-hot-toast

---

## 1. Project Structure

```
MERNSTACK_TRAVEL/
├── client/                  # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/      # Reusable UI components
│       ├── context/         # AuthContext, CartContext
│       ├── hooks/           # useAuth, useCart, useWeather
│       ├── pages/           # All page components
│       ├── utils/           # api.js (axios instance), helpers
│       ├── App.jsx
│       └── main.jsx
├── server/                  # Node + Express backend
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   ├── routes/
│   └── server.js
├── docs/
│   └── plans/
└── .env (root or per-folder)
```

---

## 2. Environment Variables

### server/.env
```
PORT=5000
MONGO_DB_URL=mongodb+srv://mackarg:Saneth1968@cluster0.ujwhtnc.mongodb.net/?appName=Cluster0
DATABASE_NAME=Ceylon
JWT_SECRET=<your_secret>
CLOUDINARY_CLOUD_NAME=ddd0uboyd
CLOUDINARY_API_KEY=369469977584878
CLOUDINARY_API_SECRET=C6jAg7S8r8P4K8XYFihw7mg5ZCI
WEATHER_API_KEY=2a3155710ae721e38b9ec922aa9dc18d
```

### client/.env
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 3. MongoDB Models (Ceylon DB)

| Collection | Key Fields |
|---|---|
| `users` | name, email, password (hashed), role (admin/user), avatar, createdAt |
| `locations` | name, description, category, subcategory, images[], province, district, coordinates {lat, lng} |
| `hotels` | name, description, images[], location, coordinates, starRating, pricePerNight, amenities[], rooms[], deals, isActive |
| `hotelBookings` | hotelId, userId, roomId, checkIn, checkOut, guests, totalPrice, paymentSlip, status |
| `products` | name, description, category, price, stock, images[], location, weatherType (DRY/RAINY) |
| `bundles` | name, description, products[], totalPrice, discount, images[] |
| `cart` | userId, items[] {productId/bundleId, qty, type} |
| `guides` | name, image, languages[], experience, location, rating, pricePerDay, certifications[], services[] |
| `guideBookings` | guideId, userId, travelerName, email, phone, travelDate, days, travelers, location, specialRequests, totalPrice, status, paymentSlip |
| `guideReviews` | guideId, userId, rating, comment, createdAt |
| `tourPackages` | name, description, images[], locations[] (ref Location), duration, basePrice, vehicleType (car/van/bus), guideIds[], isActive |
| `tourBookings` | packageId, userId, vehicleType, travelers, days, totalPrice, advancePayment, paymentSlip, assignedGuides[], suggestedHotels[], status |
| `payments` | source (hotel/product/guide/tour), referenceId, userId, amount, slipImage, status (pending/approved/rejected), createdAt |

---

## 4. API Routes

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
```

### Locations
```
GET    /api/locations              # all (with filters: category, subcategory, province)
GET    /api/locations/:id
POST   /api/locations              # admin only
PUT    /api/locations/:id          # admin only
DELETE /api/locations/:id          # admin only
```

### Hotels
```
GET    /api/hotels                 # with filters: location, rating, price, deals
GET    /api/hotels/:id
GET    /api/hotels/deals
GET    /api/hotels/popular
POST   /api/hotels                 # admin
PUT    /api/hotels/:id             # admin
DELETE /api/hotels/:id             # admin
POST   /api/hotel-bookings
GET    /api/hotel-bookings/my
```

### Travel Products
```
GET    /api/products               # filters: name, location, weatherType, price, stock
GET    /api/products/:id
POST   /api/products               # admin
PUT    /api/products/:id           # admin
DELETE /api/products/:id           # admin
GET    /api/bundles
POST   /api/bundles                # admin
PUT    /api/bundles/:id            # admin
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/:itemId
```

### Guides
```
GET    /api/guides                 # filters: location, language, rating, price
GET    /api/guides/:id
GET    /api/guides/:id/reviews
POST   /api/guides                 # admin
PUT    /api/guides/:id             # admin
POST   /api/guide-bookings
GET    /api/guide-bookings/my
PUT    /api/guide-bookings/:id/cancel
POST   /api/guide-bookings/:id/review
```

### Tour Packages
```
GET    /api/tour-packages
GET    /api/tour-packages/:id
POST   /api/tour-packages          # admin
PUT    /api/tour-packages/:id      # admin
POST   /api/tour-bookings
GET    /api/tour-bookings/my
GET    /api/tour-bookings/:id
```

### Weather
```
GET    /api/weather?city=CITY      # proxies OpenWeatherMap
GET    /api/weather/forecast?city=CITY
```

### Payments (centralized)
```
POST   /api/payments/upload-slip   # upload slip image to Cloudinary
GET    /api/payments               # admin — all payments
PUT    /api/payments/:id/status    # admin — approve/reject
GET    /api/payments/my            # user — own payment history
```

---

## 5. Frontend Pages & Routes

```
/                          Home (hero, featured sections)
/about                     About Us
/explore                   Explore (2 tabs: Locations | Trip Planner)
/explore/:categoryId       Location subcategory listings

/hotels                    Hotel Landing Page
/hotels/search             Search Results (split-screen + map)
/hotels/:id                Hotel Details
/hotels/:id/book           Booking Page

/services/travel-products  Travel Products + Bundles (tabbed)
/services/travel-products/cart  Cart Page

/services/guides           Guides Listing
/guides/:id                Guide Profile
/guide-booking/:id         Guide Booking Form
/my-guides                 Traveler Guide Dashboard

/services/weather          Weather Dashboard

/tour-packages             Tour Package Listings
/tour-packages/:id         Package Details
/tour-packages/:id/book    Tour Booking + Payment

/login                     Login
/register                  Register
/profile                   User Profile (bookings, packages, map)

/admin                     Admin Dashboard
/admin/locations           Location CRUD
/admin/hotels              Hotel CRUD
/admin/products            Product CRUD
/admin/bundles             Bundle CRUD
/admin/guides              Guide CRUD
/admin/tour-packages       Tour Package CRUD
/admin/payments            Payment Management (all sources)
```

---

## 6. Module Designs

### 6.1 Navbar
- Dark semi-transparent background
- Menu: Home | About Us | Explore | Service (dropdown) | Login
- Service dropdown: Transport, Travel Product, Travel Guider, Hotel, Weather
- Sticky on scroll, mobile hamburger

### 6.2 User Management
- Register: name, email, password, confirm password
- Login: email, password → returns JWT
- JWT stored in localStorage, sent via Authorization header
- Roles: `admin` (full CRUD + payment approval) | `user` (browse + book)
- Profile page: avatar (Cloudinary), personal info, booking history

### 6.3 Location Management
- Admin CRUD with Cloudinary image upload (multi-image)
- Category → Subcategory hierarchy (Nature/Mountain, Beach/Lagoon, etc.)
- Explore page Tab 1: Category cards → subcategory page → location cards
- Explore page Tab 2: Trip Planner (react-leaflet)
  - Add locations to trip, view route, calculate distance/time
  - Day-by-day planning, drag & drop order
  - Save/edit/delete trip plans
  - Weather per location, nearby hotels/restaurants/guides suggestions
  - Budget estimation, risk indicator
  - Share (link) + Download PDF
  - Favorite locations, trip history

### 6.4 Hotel Management
- Landing: hero + search widget (location, dates, guests), hot deals, popular, top-rated, interactive map
- Search: split-screen (list left 60%, sticky map right 40%), filters, dynamic highlighting by source param, hover-to-highlight map pin, pagination, nearby attractions
- Hotel Detail: hero + book now, gallery (2x4 grid), events/weddings (conditional), amenities, reviews carousel, dining info
- Booking: two-column (form + sticky summary), real-time price calc (price x rooms x nights + 10% tax), capacity check, payment slip upload

### 6.5 Travel Product Management
- Banner with tagline "Make your trip easier and more comfortable"
- Tabs: Travel Products | Travel Bundles (+ cart icon top-right)
- Left sidebar filters: name search, location + weather type (DRY/RAINY nested), price range, stock status
- Cart: quantity adjust, remove, total, proceed to payment (slip upload)
- Admin: CRUD for products and bundles, stock management

### 6.6 Travel Guide Management
- Guide listing with filter (location, language, rating, price)
- Guide profile: image, info, certifications, services, reviews
- Guide booking form: traveler details, date, duration, price calc (price/day x days)
- Traveler dashboard: booking status (Pending/Confirmed/Completed), cancel, leave review
- Payment: slip upload

### 6.7 Tour Package Management
- Admin creates packages: name, description, images, locations (from Location DB only), duration, base price, vehicle type, assign guides
- User booking: select vehicle type, travelers count, days → auto-calculate total (base + vehicle multiplier)
- Advance payment = 5% of total, card-style form (actually slip upload)
- On booking: guides reserved for duration, nearby hotels suggested from Hotel DB
- User profile shows: package, locations on interactive map, assigned hotels

### 6.8 Weather Management
- Search by city/location (Colombo, Kandy, Ella, etc.)
- Current weather: temp, condition, humidity, wind, icon
- 7-day forecast cards: day, icon, min/max temp, rain probability
- Warning system: Heavy rain / Storm / High wind / Flood (Green/Yellow/Red)
- Travel recommendations based on weather condition
- Loading skeletons while fetching

### 6.9 Payment Management
- All payments use manual slip upload (image → Cloudinary)
- Sources: hotel booking, product/bundle cart, guide booking, tour booking
- Admin panel: view all payments from all sources, filter by source/status, approve or reject
- User: view own payment history and status

---

## 7. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Image upload | Cloudinary (multer-storage-cloudinary) | Already configured, CDN delivery |
| Maps | React-Leaflet + OpenStreetMap | Free, no API key needed |
| Weather | OpenWeatherMap | API key already provided |
| UI components | Shadcn/ui + Tailwind | Consistent, accessible, fast |
| Notifications | react-hot-toast | Lightweight, already specified |
| Auth | JWT in localStorage | Simple for MERN stack |
| Payment | Slip upload only | As specified — no payment gateway |
| State (global) | React Context (Auth + Cart) | Sufficient for this scale |
| PDF export | react-to-pdf or jsPDF | For trip plan download |
| Drag & drop | @dnd-kit/core | Trip planner location ordering |

---

## 8. Admin Dashboard Sections

- Overview stats: total users, bookings, revenue (by source)
- Location CRUD
- Hotel CRUD
- Product & Bundle CRUD
- Guide CRUD
- Tour Package CRUD
- Payment Management (approve/reject all slip uploads)

---

## 9. Build Order (Implementation Sequence)

1. Project scaffolding (client + server folders, dependencies)
2. Server: DB connection, Cloudinary config, auth routes + JWT middleware
3. User Management (register, login, profile)
4. Navbar + base layout
5. Location Management (admin CRUD + Explore page)
6. Hotel Management (all pages)
7. Travel Product Management
8. Travel Guide Management
9. Tour Package Management
10. Weather Module
11. Payment Management (admin panel + slip upload per module)
12. Trip Planner (complex — after locations are done)
13. Admin Dashboard overview
14. User Profile page
15. Polish: loading states, error handling, mobile responsiveness
