# Mai Food Delivery

A full-stack food ordering demo with a React/Vite storefront and Express REST API. Browse nine categories with five dishes each, with prices in Indian rupees. Orders are kept in memory and move through simulated kitchen and delivery stages on a timeline based on the selected dish preparation time plus a 15-minute delivery estimate.

Checkout proceeds from cart to delivery details and then payment. Choose simulated UPI confirmation or cash on delivery. No real payment is processed.

The menu is available at `/menu`. Add dishes to the cart, then open the **Cart** link in the header to review quantities, update your order, and continue through delivery details and payment. The cart is saved in browser local storage, so it remains available when you switch pages or reload.

Select **Your orders** in the header to open the order history page. Each order links to a detailed receipt with delivery information, payment method, ETA, and a live-updating status timeline. Orders are kept in backend memory and remain available while the API process is running.

## Run locally

1. Install dependencies in the root and app folders: `npm install`, `npm install --prefix backend`, and `npm install --prefix frontend`.
2. Run `npm run dev` from the project root to start the API and storefront together. The API listens on `http://127.0.0.1:4000`; Vite prints the storefront URL.
3. Run `npm test` from the root to run both test suites, or `npm run build` to build the frontend.

Vite proxies `/api` requests to the backend, so the browser uses the same origin for the frontend and API. If the API is unavailable, use the menu Retry button after starting the servers. Menu photos are loaded from Unsplash.

## Deploy to Render and Netlify

The repository includes a Render Blueprint (`render.yaml`) for the API and Netlify configuration (`netlify.toml`) for the Vite frontend.

### Render API

1. In Render, choose **New + → Blueprint** and connect this GitHub repository.
2. Review the `mai-food-delivery-api` web service from `render.yaml` and create it. Render builds from `backend`, starts it with `npm start`, and checks `/api/health`.
3. Copy the deployed service URL (for example, `https://mai-food-delivery-api.onrender.com`).

### Netlify frontend

1. In Netlify, choose **Add new site → Import an existing project** and connect this GitHub repository.
2. Netlify reads `netlify.toml` for the frontend build settings. Set the site environment variable `VITE_API_URL` to the Render service URL, with no trailing slash (for example, `https://mai-food-delivery-api.onrender.com`).
3. Deploy or trigger a new deploy after setting the variable. The frontend uses it for API calls, and the redirect configuration supports direct navigation to app pages such as `/cart` and `/orders`.

Orders are currently held in the API process's memory, so they are not persistent across Render restarts or redeploys. UPI payment is simulated; no real payment is processed.
