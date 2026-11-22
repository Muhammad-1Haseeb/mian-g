# Mian Ji Punjab Hotel — Restaurant Website

A responsive restaurant website with a Node.js/Express backend, SQLite database, menu API and online order submission.

## Technology used
- HTML5 — page structure
- CSS3 — responsive design and styling
- JavaScript — menu filtering, cart and order form
- Node.js — server runtime
- Express.js — backend/API
- SQLite — persistent menu and order storage

There is no single project that meaningfully uses *every* programming language. This project uses a practical set of technologies that work together.

## Requirements
Install Node.js 18 or newer.

## Run locally
1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

The database file `restaurant.db` is created automatically on first run and the sample menu is seeded automatically.

## Important before going live
- Replace the placeholder phone number, exact address and opening hours in `public/index.html`.
- Replace sample menu names/prices in `server.js` with your confirmed menu.
- Add proper admin login/authentication and authorization. The demo admin order endpoints are intentionally unauthenticated and must not be exposed publicly as-is.
- Add HTTPS, input validation/rate limiting, backups and hosting configuration before production.
- The sample food photos are remotely hosted by Unsplash; replace with your own licensed restaurant photos if desired.

## API
- `GET /api/menu` — list available menu items
- `POST /api/orders` — create an order
- `GET /api/admin/orders` — demo admin order list (secure before deployment)
- `PATCH /api/admin/orders/:id` — update order status (secure before deployment)
