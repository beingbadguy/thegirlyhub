# Quick Testing Guide - Guest Checkout & Payments

This guide will help you test the guest checkout flow quickly.

## Pre-requisites
- Frontend running: `npm run dev` 
- MongoDB connected
- Razorpay keys configured in `.env`
- SMTP configured for email notifications (optional)

## Test Scenario 1: Guest Checkout with Cash on Delivery (COD)

### Steps:
1. Go to homepage
2. Add a product to cart
3. Go to `/cart`
4. Click "Proceed to Checkout"
5. **IMPORTANT**: Do NOT login
6. Fill in checkout form:
   - Full Name: John Doe
   - Email: john@example.com (must be a new email for first-time discount)
   - Address: 123 Main St, Apt 4
   - City: Mumbai
   - State: Maharashtra
   - Pincode: 400001
   - Phone: 9876543210
7. Select "Cash on Delivery"
8. Click "Place Order · ₹XXX"
9. Should redirect to `/success/[orderId]`

### Expected Results:
- ✅ Order created without login
- ✅ 15% first-time discount applied
- ✅ Free shipping applied (if subtotal > ₹500)
- ✅ Success page shows "Thanks John, Your Order was Placed Successfully"
- ✅ Email shows: john@example.com
- ✅ Shows "Cash on Delivery" warning
- ✅ "Track Order" button available

### Verify in Database:
```javascript
// MongoDB check
db.orders.findOne({ recipientName: "John Doe" })
// Should show:
// - userId: null (guest order)
// - email: john@example.com
// - status: "pending"
// - paymentStatus: "pending"
// - paymentMethod: "cod"
```

---

## Test Scenario 2: Guest Checkout with Online Payment (Razorpay)

### Steps:
1. Go to homepage
2. Add a product to cart
3. Go to `/cart`
4. Click "Proceed to Checkout"
5. **IMPORTANT**: Do NOT login
6. Fill in checkout form with:
   - Full Name: Jane Smith
   - Email: jane@example.com (new email)
   - Address: 456 Oak Ave
   - City: Bangalore
   - State: Karnataka
   - Pincode: 560001
   - Phone: 9123456789
7. Select "Online Payment"
8. Click "Pay Online · ₹XXX"
9. Razorpay modal should open

### Payment Steps:
1. In Razorpay modal:
   - Click "Card" tab
   - Use test card: 4111 1111 1111 1111
   - Expiry: Any future date (e.g., 12/25)
   - CVV: 123
   - Name: Any name
   - Contact: 9123456789
2. Click "Pay"
3. Wait for OTP (test): Enter 123456
4. Should show "Payment Successful"
5. Redirect to `/success/[orderId]`

### Expected Results:
- ✅ Order created without login
- ✅ 15% first-time discount applied
- ✅ Payment verified
- ✅ Success page shows "Thanks Jane, Your Order was Placed Successfully"
- ✅ Email shows: jane@example.com
- ✅ Status: "Order Confirmed"
- ✅ "Track Order" button available

### Verify in Database:
```javascript
db.orders.findOne({ recipientName: "Jane Smith" })
// Should show:
// - userId: null (guest order)
// - paymentStatus: "paid"
// - paymentMethod: "online"
// - paymentId: (razorpay payment ID)
```

---

## Test Scenario 3: Logged-In User Checkout

### Setup:
1. Go to `/login`
2. Enter test credentials or create new account
3. Should be logged in

### Steps:
1. Go to homepage
2. Add a product to cart
3. Go to `/cart`
4. Click "Proceed to Checkout"
5. Form should be **pre-filled** with user data:
   - Name: From user profile
   - Email: From user profile
   - Address: From user profile
   - etc.
6. Can modify if needed
7. Select payment method
8. Complete order

### Expected Results:
- ✅ User profile data pre-filled
- ✅ Cart linked to user
- ✅ Order created with userId
- ✅ First-time discount applies if it's first purchase
- ✅ User's `firstPurchase` flag updated to true

---

## Test Scenario 4: Guest Checkout with Same Email (No First-Time Discount)

### Prerequisites:
- Already completed Test Scenario 1 (order with jane@example.com)

### Steps:
1. Clear browser cache/cookies
2. Go to homepage
3. Add a product to cart
4. Go to `/cart`
5. Click "Proceed to Checkout"
6. Fill in form with same email: jane@example.com
7. Select COD
8. Click "Place Order"

### Expected Results:
- ✅ Order created
- ❌ NO 15% discount applied (email has previous order)
- ✅ Shipping charge applied normally
- ✅ Order total should be higher than first order

---

## Test Scenario 5: Guest Checkout with Coupon Code

### Prerequisites:
- Coupon code exists in database (e.g., "SAVE10")

### Steps:
1. Add product to cart
2. Go to checkout
3. Fill in guest details
4. In "Order Summary" section, enter coupon code: SAVE10
5. Click "Apply"
6. Should show success message

### Expected Results:
- ✅ Coupon discount shown in summary
- ✅ Total amount reduced
- ✅ Can still complete order
- ✅ Coupon marked as used (cannot use again with same email)

---

## Test Scenario 6: Payment Failure Handling

### Steps:
1. Go to checkout as guest
2. Fill in form
3. Select "Online Payment"
4. In Razorpay modal:
   - Use failed card: 4111 1111 1111 2222
   - Follow same payment steps
5. Should show payment failed

### Expected Results:
- ✅ Error message displayed: "Payment failed"
- ✅ Cart items preserved
- ✅ User can try again
- ✅ NO order created in database

---

## Test Scenario 7: Social Login → Checkout

### Prerequisites:
- Google OAuth configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID set)

### Steps:
1. Go to `/login`
2. Click "Continue with Google"
3. Login with Google account
4. Should auto-redirect to homepage as logged-in user
5. Add product to cart
6. Go to checkout
7. Form pre-filled with Google profile data
8. Complete order

### Expected Results:
- ✅ User account created from Google profile
- ✅ User data pre-filled on checkout
- ✅ Order linked to social user account
- ✅ Can use "Check Details" to see all orders

---

## Test Scenario 8: Order Tracking (Guest)

### Prerequisites:
- Completed guest order (have order ID and email)

### Steps:
1. Go to `/track`
2. Enter:
   - Order ID: (from success page)
   - Email: (guest email used during checkout)
3. Click "Track"
4. Should show order details:
   - Status
   - Items
   - Delivery address
   - Payment method
   - Expected delivery date

### Expected Results:
- ✅ Order found with correct details
- ✅ Shows current status
- ✅ Shows delivery address
- ✅ No login required

---

## Test Scenario 9: Email Notifications

### Prerequisites:
- SMTP configured
- Order placed (guest or logged-in)

### Steps:
1. Complete a guest or user order
2. Check email inbox (use test email)
3. Should receive email with:
   - Order confirmation
   - Order ID
   - Order summary
   - Tracking info

### Expected Results:
- ✅ Email received within 1 minute
- ✅ Email contains correct order details
- ✅ Professional template

---

## Common Issues & Fixes

### Issue: Razorpay modal doesn't open
**Solution:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
3. Clear browser cache
4. Try incognito mode
5. Check if Razorpay script loaded: `console.log(window.Razorpay)`

### Issue: "Email is required for guest checkout" error
**Solution:**
1. Make sure email field is filled
2. Valid email format required
3. Cannot be empty even for users

### Issue: Order not created after payment
**Solution:**
1. Check browser console for errors
2. Check server logs: `npm run dev` output
3. Verify payment was actually completed in Razorpay
4. Check MongoDB for PendingPayment record
5. Verify signature validation passed

### Issue: First-time discount not applied
**Solution:**
1. New email should get discount
2. Check database for Order with same email
3. Verify discount calculation in `prepareCheckout`
4. Check order summary shows discount

### Issue: Guest can't proceed to checkout
**Solution:**
1. Make sure not logged in (or use different browser)
2. Products must be in stock
3. Cart must not be empty
4. All required fields must be filled

---

## Debugging Commands

### Check in Browser Console:
```javascript
// Check Razorpay loaded
window.Razorpay

// Check auth token
document.cookie

// Check store
localStorage.getItem('auth-store')
```

### Check in MongoDB:
```javascript
// Find all guest orders
db.orders.find({ userId: null })

// Find all Razorpay orders
db.orders.find({ paymentMethod: "online" })

// Check PendingPayment records
db.pendingpayments.find({})

// Find coupon usage
db.coupons.findOne({ code: "SAVE10" })
```

### Check Server Logs:
```bash
# If running locally
npm run dev
# Look for:
# - POST /api/create-order
# - POST /api/verify-payment
# - POST /api/order
# - Any errors in console
```

---

## Quick Checklist

Before declaring ready:
- [ ] Guest checkout works (COD)
- [ ] Guest checkout works (Online Payment)
- [ ] First-time discount calculated correctly
- [ ] Coupon codes apply correctly
- [ ] Payment verification works
- [ ] Orders appear in database
- [ ] Email notifications sent (if SMTP configured)
- [ ] Order tracking works with email + ID
- [ ] Success page displays correct name/email
- [ ] Social login works (if configured)
- [ ] User checkout still works (logged-in)
- [ ] Cart clears after order placement

---

## Deployment Notes

### Before Going Live:
1. **Razorpay**: Switch to live keys (update .env)
2. **Email**: Verify SMTP credentials
3. **Database**: Backup MongoDB
4. **Testing**: Run all test scenarios
5. **SSL**: Ensure HTTPS enabled (required for Razorpay)
6. **Payment Verification**: Monitor first 10-20 orders carefully
7. **Error Handling**: Test with various network conditions

### Monitoring:
- Monitor Razorpay dashboard for failed payments
- Check email delivery (Gmail bounce rate)
- Monitor order creation rate
- Alert on payment verification failures
- Track customer support tickets related to checkout

---

## Support

For issues during testing:
1. Check browser console (F12)
2. Check server logs (npm run dev output)
3. Verify .env variables are set
4. Check MongoDB for records
5. Test with different browser/device

---

Last Updated: 2024
Version: 1.0
