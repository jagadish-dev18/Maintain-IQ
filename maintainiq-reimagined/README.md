# MaintainIQ — Maintenance Work Order Tracker

MaintainIQ is a browser-based work order tracker for recording equipment issues and keeping maintenance tasks organized.

## Features

- Dashboard with work-order totals and recent activity
- Create, edit, and delete work orders
- Assign a technician and set priority, status, and target date
- Search and filter the work-order list
- Equipment overview based on recorded work orders
- Activity and status charts
- Export the current filtered list to CSV
- Save records in the browser with `localStorage`

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Add a work order and try the search, filters, status controls, and CSV export.

The project uses plain HTML, CSS, and JavaScript. It does not require a package manager, build step, backend, or API key.

## Project files

- `index.html` — page structure and interface
- `style.css` — layout, visual styles, and responsive behavior
- `script.js` — work-order data, form handling, filtering, charts, and CSV export

## Data notes

The starter records are examples, not live factory data. Records are stored in the current browser profile and are not synced to another device or sent to a server. Clearing browser storage can remove saved records, so export a CSV backup if you need to keep them.

The equipment status shown in the dashboard is calculated from the work orders entered in the app; it is not a live sensor reading.
