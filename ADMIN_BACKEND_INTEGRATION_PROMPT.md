# Admin Dashboard Backend Integration Prompt

Copy and paste the instructions below into the new admin project’s coding agent.

```text
Connect this admin dashboard to the existing ecommerce backend. Do not create mock data or a duplicate backend.

Reuse the existing backend’s API routes, database models, authentication, middleware, image uploads, email services, coupon logic, order logic, and payment integrations. Preserve the existing API contracts and database behavior.

The existing backend Next.js application runs locally on port 3000. The new admin Next.js application runs locally on port 3001. Browser requests therefore travel from the admin origin (http://localhost:3001) to the backend origin (http://localhost:3000).

Prefer a Next.js rewrite/proxy so the browser can call relative `/api/...` URLs and avoid CORS entirely. Only use direct cross-origin API requests if a rewrite cannot be used.

Development backend API URL:
http://localhost:3000

Production API URL:
https://REPLACE_WITH_PRODUCTION_API_DOMAIN

Create or use these environment files:

.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

.env.production
NEXT_PUBLIC_API_URL=https://REPLACE_WITH_PRODUCTION_API_DOMAIN

Configure the API client like this only when making direct cross-origin requests:

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

If using a Next.js rewrite, use relative requests such as `fetch("/api/product")` or `api.get("/api/product")`; the rewrite must forward them to `http://localhost:3000/api/product`. If using direct requests, use the API client above. Examples:

api.get("/api/product");
api.get("/api/orders");
api.get("/api/users");

Do not use NEXT_PUBLIC_API_URL for secrets. Only public API URLs may be exposed to the browser. Keep database credentials, JWT secrets, Cloudinary secrets, email credentials, Stripe keys, Cashfree keys, and other private values in server-only environment variables.

If the admin dashboard and backend run in the same Next.js project, relative API requests such as `/api/product` work directly. If they run as separate Next.js applications, configure a rewrite in the admin project so `/api/:path*` is proxied to `http://localhost:3000/api/:path*`. Do not point requests from port 3000 to port 3001: port 3000 is the backend and port 3001 is the admin frontend.

Example `next.config.ts` rewrite for the separate local applications:

~~~ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
~~~

With this rewrite, the admin frontend must call `/api/...` relative URLs. The browser sees same-origin requests to port 3001, while the Next.js server forwards them to port 3000.

The backend running on port 3000 must allow the admin application running on port 3001 to access its API. Configure the backend CORS policy with this exact development origin:
http://localhost:3001

The port 3000 backend must:
- Allow `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` requests.
- Allow the `Content-Type` and `Authorization` request headers.
- Return `Access-Control-Allow-Origin: http://localhost:3001`.
- Return `Access-Control-Allow-Credentials: true`.
- Respond successfully to browser `OPTIONS` preflight requests.
- Apply the CORS configuration before the API routes and authentication middleware when required by the backend framework.

For production, prefer a same-origin deployment or a server-side rewrite/proxy. If direct cross-origin requests are used, allow the deployed admin application origin only. Do not use a wildcard origin when credentials or authentication cookies are enabled. Never use `Access-Control-Allow-Origin: *` together with credentials.

Configure authentication correctly for cross-origin requests:
- Send requests with credentials enabled.
- Configure the backend with Access-Control-Allow-Credentials: true.
- Allow the exact admin origin in CORS.
- Configure authentication cookies with the correct SameSite and Secure settings for the deployment architecture.
- Never expose authentication tokens or private secrets in client-side code.

Reuse or connect to these existing backend resources when available:
- GET `/api/me`
- POST `/api/logout`
- GET `/api/users`
- GET `/api/orders`
- PUT `/api/orders/:id`
- GET `/api/product`
- POST `/api/product`
- PUT `/api/product` or `/api/product/:id`
- DELETE `/api/product/:id`
- GET `/api/category`
- POST `/api/category`
- PUT `/api/category/:id`
- DELETE `/api/category/:id`
- GET `/api/contact`
- GET `/api/newsletter`
- POST `/api/response`
- GET `/api/coupon`
- POST `/api/coupon`

Build the complete responsive admin dashboard with these routes:
- `/dashboard`
- `/products`
- `/addproduct`
- `/categories`
- `/addcategory`
- `/orders`
- `/customers`
- `/support`
- `/others`

Implement the following functionality:

1. Shared admin layout
- Protected routes with redirect to `/login` when unauthenticated.
- Responsive sidebar and mobile navigation.
- Active navigation state.
- Administrator avatar, name, and email.
- Storefront link.
- Sign-out action.
- Loading skeletons and error states.

2. Dashboard
- Net revenue calculated from orders.
- Total orders, customers, and products.
- Average order value.
- Low-stock product count.
- Revenue chart.
- Visitor or traffic chart when visitor data is available.
- Latest five orders.
- Attention links for low stock, enquiries, subscribers, and categories.

3. Products
- Search by title.
- Product image, title, original price, discounted price, stock, and status.
- Toggle active/inactive status.
- Edit title, discounted price, and stock.
- Delete with confirmation.
- Add-product link.
- Refresh data after mutations.

4. Add product
- Title, description, image upload, image preview, category, original price, discounted price, stock, and long information fields.
- Submit image data with FormData.
- Validate all required fields.
- Prevent discounted price from exceeding the original price.
- Redirect to `/products` after success.

5. Categories
- Search categories.
- Show category image and name.
- Add, edit, and delete categories.
- Use confirmation for deletion.
- Refresh data after mutations.

6. Add category
- Category name and image upload.
- Image preview and remove action.
- Required-field validation.
- Submit with FormData.
- Redirect to `/categories` after success.

7. Orders
- Show order ID, date, customer, contact details, address, delivery type, payment method, status, products, quantities, sizes, prices, and total.
- Allow status updates using:
  processing, reviewing, preparing, shipped, delivered, completed, cancelled
- Disable the status control while updating.

8. Customers
- Show name, email, role, verification status, first-purchase status, order count, and creation date.
- Never display passwords, password hashes, or sensitive authentication fields.

9. Support
- Show newsletter subscribers.
- Show contact enquiries.
- Open complete enquiry details in a drawer or modal.
- Allow an administrator to write and send a reply.
- Support loading, validation, success, error, close, overlay-click, and Escape-key states.

10. Others
- Create coupons with name, code, and discount amount.
- Automatically uppercase coupon codes.
- List existing coupons with name, code, discount, active status, and creation date.

Use proper TypeScript types, reusable components, accessible controls, responsive tables/cards, and real API data. Handle empty, loading, failed-request, and mutation states without crashing the dashboard.

After implementation:
- Verify that the backend runs on http://localhost:3000 and the admin runs on http://localhost:3001.
- Verify that the port 3000 backend accepts credentialed requests from http://localhost:3001, including OPTIONS preflight requests.
- Verify that admin requests use the rewrite and relative `/api/...` URLs, or that direct cross-origin requests have working CORS.
- Verify the production configuration uses NEXT_PUBLIC_API_URL from `.env.production`.
- Run type-checking, linting, and the production build.
- Fix all implementation errors.
- Summarize the changed files, API assumptions, environment variables, routes, and validation results.
```

## Replace Before Production

Replace this placeholder with the real deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://REPLACE_WITH_PRODUCTION_API_DOMAIN
```

For example:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```
