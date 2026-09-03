# Checkout & Payment Setup Guide

This guide covers the checkout flow, guest checkout, payment methods, and social authentication setup.

## Table of Contents
1. [Guest Checkout Flow](#guest-checkout-flow)
2. [Payment Methods](#payment-methods)
3. [Social Login Setup](#social-login-setup)
4. [Razorpay Configuration](#razorpay-configuration)
5. [Email Configuration](#email-configuration)
6. [Testing](#testing)

---

## Guest Checkout Flow

The eCommerce platform supports **guest checkout** without requiring user registration.

### How It Works:
1. **Guest Entry**: Users can proceed to checkout without logging in
2. **Email Required**: Guest users must provide an email address (used for order tracking)
3. **Order Creation**: Order is placed with guest flag in the system
4. **First-Time Discount**: Applied based on email (checks if email has previous orders)
5. **Order Tracking**: Guests can track orders using order ID + email

### Frontend Changes Made:
- ✅ Removed forced login redirect from checkout page
- ✅ Checkout page now allows `user === null` (guest users)
- ✅ Email field is auto-populated for logged-in users, empty for guests (required)
- ✅ Guest orders properly handled in backend

### Guest Checkout Requirements:
```typescript
// Required fields for guest checkout
{
  recipientName: string;      // Full name
  email: string;              // Email (required, used to check first-time discount)
  address: string;            // Delivery address
  city: string;               // City
  state: string;              // State
  zip: number;                // Pincode (6 digits)
  phone: number;              // Phone (10 digits)
  landmark?: string;          // Landmark (optional)
  orderNotes?: string;        // Delivery instructions (optional)
  products: Array;            // Products in cart
  paymentMethod: "cod" | "online";  // Payment method
}
```

---

## Payment Methods

### 1. Cash on Delivery (COD)
- **Status**: ✅ Fully Implemented
- **Flow**: 
  - User selects COD at checkout
  - Places order via `/api/order` endpoint
  - Order created with `status: "pending"` and `paymentStatus: "pending"`
  - User redirected to success page
  - Admin/Customer can see "Cash on Delivery" payment method

### 2. Online Payment (Razorpay)
- **Status**: ✅ Implemented & Fixed
- **Flow**:
  1. User selects "Online Payment" at checkout
  2. Frontend calls `/api/create-order` with full order payload
  3. Backend validates checkout data and creates Razorpay order
  4. Frontend receives `razorpay_order_id` and shows Razorpay modal
  5. User completes payment in Razorpay modal
  6. Razorpay returns payment details (payment ID, order ID, signature)
  7. Frontend sends to `/api/verify-payment` endpoint
  8. Backend verifies payment signature and creates order
  9. User redirected to success page

### Payment Flow Endpoints:
```
POST /api/create-order
- Input: Full order payload (all checkout details)
- Output: { success, order_id, amount, currency }
- Guest Supported: ✅ Yes

POST /api/verify-payment
- Input: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
- Output: { success, orderId }
- Guest Supported: ✅ Yes

POST /api/order
- Input: Full order payload
- Output: { success, order }
- Guest Supported: ✅ Yes
- Used for: Cash on Delivery only
```

### Payment Status Tracking:
```
Order States:
- pending: Order placed, payment pending (COD)
- confirmed: Payment verified, order confirmed (Online)
- processing: Being prepared
- shipped: In transit
- delivered: Delivered
- cancelled: Cancelled

Payment States:
- pending: Not yet paid (COD)
- paid: Payment confirmed (Online)
- failed: Payment failed
- refunded: Amount refunded
```

---

## Social Login Setup

Social authentication allows users to login/signup using their social accounts.

### Available Providers:
1. **Google OAuth 2.0**
2. **Facebook Login**
3. **Apple Sign In**

### Frontend Components:
- `components/SocialAuthButtons.tsx` - Handles all social login
- Used in: Login page, Signup page
- Can be added to checkout page for user conversion

### Setup for Each Provider:

#### Google OAuth 2.0
**Step 1: Create Google Cloud Project**
```
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Go to Credentials
5. Create OAuth 2.0 credentials (Web application)
```

**Step 2: Configure Redirect URIs**
```
Authorized JavaScript origins:
- http://localhost:3000
- https://yourdomain.com

Authorized redirect URIs:
- http://localhost:3000/api/auth/google/callback
- https://yourdomain.com/api/auth/google/callback
```

**Step 3: Get Credentials**
```
- GOOGLE_CLIENT_ID: Copy from Google Console
- GOOGLE_CLIENT_SECRET: Copy from Google Console (backend only)
- NEXT_PUBLIC_GOOGLE_CLIENT_ID: Same as GOOGLE_CLIENT_ID
```

**Step 4: Update .env**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

#### Facebook Login
**Step 1: Create Facebook App**
```
1. Go to https://developers.facebook.com/apps
2. Create new app (choose Consumer type)
3. Add "Facebook Login" product
```

**Step 2: Configure Settings**
```
- App ID: Found in Settings > Basic
- App Secret: Found in Settings > Basic
- Redirect URIs: 
  - http://localhost:3000
  - https://yourdomain.com
```

**Step 3: Get Credentials**
```
- FACEBOOK_APP_ID: App ID from settings
- FACEBOOK_APP_SECRET: App Secret from settings
- NEXT_PUBLIC_FACEBOOK_APP_ID: Same as App ID
```

**Step 4: Update .env**
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id
```

#### Apple Sign In
**Complex Setup (Advanced)**
```
1. Requires Apple Developer Account ($99/year)
2. Requires Services ID and Private Key
3. More complex than Google/Facebook
4. Mainly for iOS apps, but can be used for web

Setup: See https://developer.apple.com/sign-in-with-apple/
```

### How Social Auth Works:

**User Flow:**
```
1. User clicks "Continue with Google/Facebook/Apple"
2. Redirected to provider's login page
3. User authorizes app
4. Provider sends token back to frontend
5. Frontend sends token to backend endpoint:
   - POST /api/auth/google (for Google)
   - POST /api/auth/facebook (for Facebook)
   - POST /api/auth/apple (for Apple)
6. Backend verifies token and finds/creates user
7. User logged in automatically
8. Redirected to homepage or specified page
```

**User Account Linking:**
```
First Login: 
- Provider returns email + name
- Backend creates new user account
- Account marked as "social login"

Subsequent Logins:
- Provider ID matched to existing user
- User logged in automatically
- No password needed
```

### Testing Social Login Locally:

**Google (Easiest)**
```
1. Set credentials in .env.local
2. Run dev server: npm run dev
3. Go to login page
4. Click "Continue with Google"
5. Use a test Google account
6. Should work immediately
```

**Facebook (Medium)**
```
1. App must be in development mode
2. Add your email as tester in app roles
3. Follow same steps as Google
4. May need to add domain to redirect URIs
```

**Apple (Hardest)**
```
1. Requires signing (requires .p8 private key)
2. Only works on HTTPS (production only)
3. Need Services ID configuration
4. Best handled by backend signing flow
```

---

## Razorpay Configuration

### Getting Razorpay Keys:

**Step 1: Create Razorpay Account**
```
1. Go to https://dashboard.razorpay.com
2. Sign up with email
3. Verify email and complete KYC if needed
```

**Step 2: Get Keys**
```
Settings > API Keys
- Key ID (Public): RAZORPAY_KEY_ID (both .env and NEXT_PUBLIC)
- Key Secret (Secret): RAZORPAY_KEY_SECRET (.env only, never expose)

Two Sets of Keys:
- Test Keys: For development/testing
- Live Keys: For production (requires business verification)
```

**Step 3: Configure .env**
```env
# For Testing
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# For Production (after switching)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_live_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Razorpay Payment Testing:

**Test Cards (Only in Test Mode):**
```
Successful Payment:
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 123456

Failed Payment:
- Card: 4111 1111 1111 2222
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 123456 (will fail)
```

**Test Amounts:**
```
- Min Amount: ₹1 (100 paise)
- Works with any amount
- First-time discount applied
- Coupon discounts applied
```

### Production Checklist:

Before going live:
- [ ] Switch to Live Keys
- [ ] Test end-to-end payment flow
- [ ] Verify emails are sent correctly
- [ ] Test order status tracking
- [ ] Verify refund process works
- [ ] Check settlement in Razorpay dashboard
- [ ] Monitor for failed payments
- [ ] Setup webhook for payment updates (optional)

---

## Email Configuration

Emails are sent for:
- Order confirmation
- Order status updates
- Refund notifications
- Support responses

### SMTP Setup (Gmail):

**Step 1: Enable 2-Factor Authentication**
```
1. Go to https://myaccount.google.com/
2. Select "Security"
3. Enable 2-step verification
```

**Step 2: Create App-Specific Password**
```
1. In Security settings
2. Scroll to "App passwords" (appears after 2FA enabled)
3. Select "Mail" and "Windows Computer"
4. Generate password (16 chars, no spaces)
```

**Step 3: Update .env**
```env
SMTP_USER=your-email@gmail.com
SMTP__PASS=xxxx xxxx xxxx xxxx  # 16-char app password
```

### Email Service:
- **Provider**: Gmail SMTP
- **Service**: `services/mailer.ts`
- **Templates**: Built into order confirmation

---

## Testing

### Test Scenarios:

#### 1. Guest Checkout with COD
```
1. Clear cart or add products
2. Go to /cart → Checkout
3. Fill all fields (no login required)
4. Select "Cash on Delivery"
5. Place Order
✅ Should succeed with order ID
```

#### 2. Guest Checkout with Online Payment
```
1. Clear cart or add products
2. Go to /cart → Checkout
3. Fill all fields (no login required)
4. Select "Online Payment"
5. Click "Pay Online"
6. Razorpay modal opens
7. Use test card: 4111 1111 1111 1111
8. Complete payment
✅ Order should be created
✅ Should redirect to success page
```

#### 3. User Checkout (Logged In)
```
1. Login to account
2. Add products
3. Go to checkout
4. Form pre-filled with user data
5. Can select payment method
6. Complete order
✅ User's firstPurchase flag updated
✅ Cart cleared after order
```

#### 4. Social Login → Checkout
```
1. Go to login page
2. Click "Continue with Google"
3. Authorize app
4. Auto-logged in
5. Go to checkout
6. Should have name/email pre-filled
7. Complete order
✅ Order linked to social user account
```

#### 5. First-Time Discount
```
Guest:
1. New email: Should get 15% discount
2. Same email again: No discount on next order

User:
1. First purchase: 15% discount
2. Subsequent purchases: No discount
```

#### 6. Coupon Code
```
1. Add valid coupon code
2. Click "Apply"
3. Should show discount
4. Can be % or flat amount
✅ Discount applied to total
✅ Coupon marked as used
```

### Debugging:

**Payment fails in Razorpay modal:**
```
1. Check browser console for errors
2. Verify NEXT_PUBLIC_RAZORPAY_KEY_ID in .env
3. Check if order creation succeeded
4. Verify amount > 100 paise (₹1)
```

**Guest checkout fails:**
```
1. Email field is required for guests
2. All delivery fields required
3. Check browser console for validation errors
4. Verify products are in stock
```

**Social login not working:**
```
1. Check NEXT_PUBLIC_GOOGLE_CLIENT_ID
2. Verify redirect URI in Google Console
3. Check browser console for OAuth errors
4. Try incognito mode (clear cookies)
5. Verify app permissions
```

**Order not created after payment:**
```
1. Check `/api/verify-payment` response
2. Verify payment signature validation
3. Check if amount matches
4. Verify PendingPayment record exists
5. Check server logs for errors
```

---

## API Reference

### Checkout Endpoints

#### Create Razorpay Order
```
POST /api/create-order
Authorization: Optional (works for guests)

Body:
{
  totalAmount: number;
  paymentMethod: "online";
  deliveryType: "normal";
  recipientName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  landmark?: string;
  orderNotes?: string;
  couponCode?: string;
  products: Array<{
    productId: string;
    quantity: number;
    size?: string;
    title: string;
    price: number;
    image: string;
  }>;
}

Response:
{
  success: true;
  order_id: string;           // Razorpay order ID
  amount: number;             // Amount in paise
  currency: string;           // "INR"
}
```

#### Verify Payment
```
POST /api/verify-payment
Authorization: Optional (works for guests)

Body:
{
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

Response:
{
  success: true;
  orderId: string;            // Database order ID
}
```

#### Place COD Order
```
POST /api/order
Authorization: Optional (works for guests)

Body: Same as create-order (without razorpay fields)

Response:
{
  success: true;
  order: {
    _id: string;
    status: "pending";
    paymentMethod: "cod";
    totalAmount: number;
  };
}
```

#### Get Order Details
```
GET /api/order/:orderId
Authorization: Optional (guests need orderId + email)

Response:
{
  _id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  paymentStatus: "pending" | "paid";
  totalAmount: number;
  items: Array;
  deliveryAddress: Object;
  createdAt: string;
}
```

---

## Summary of Changes Made

1. ✅ **Guest Checkout**: Removed forced login redirect
2. ✅ **Payment Flow**: Fixed to send full order payload to create-order
3. ✅ **Razorpay Integration**: Verified guest support
4. ✅ **Social Auth**: Confirmed implementation (Google, Facebook, Apple)
5. ✅ **Environment Variables**: Updated .env.example with full documentation
6. ✅ **Email Validation**: Guest orders require email for first-time discount calculation

---

## Next Steps

1. **Test all payment scenarios** (see Testing section)
2. **Configure social login credentials** if needed
3. **Setup email notifications** (Gmail SMTP)
4. **Monitor Razorpay dashboard** for payments
5. **Collect customer feedback** on checkout UX

---

## Support

For issues, check:
- Browser console for frontend errors
- Server logs for backend errors
- Razorpay dashboard for payment details
- MongoDB for order records
- Email logs for notification delivery
