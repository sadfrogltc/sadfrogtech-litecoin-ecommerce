# Checkout Timer Implementation

## Overview

The checkout timer feature adds a 1-hour expiration to all orders, automatically cancelling them if payment is not completed within the time limit. This helps prevent abandoned carts and ensures inventory is freed up for other customers.

## Features

### 1. Timer Display
- **Location**: Payment page (`/payment/[orderId]`)
- **Duration**: 1 hour (60 minutes) from order creation
- **Visual States**:
  - **Normal** (Blue): More than 10 minutes remaining
  - **Warning** (Yellow): Less than 10 minutes remaining
  - **Critical** (Red): Less than 5 minutes remaining
  - **Expired** (Red): Time has run out

### 2. Automatic Expiration
- Orders are automatically marked as "expired" when the timer runs out
- Users are redirected to the home page after expiration
- Toast notification informs users that their order has been cancelled

### 3. Page Leave Handling
- **Before Unload Warning**: Users get a confirmation dialog when trying to leave the page
- **Page Visibility Detection**: System detects when users switch tabs or minimize browser
- **Activity Tracking**: Logs when users leave and return to the payment page
- **Session Recovery**: Provides options to restart checkout when returning to expired orders

### 4. Database Integration
- All orders have an `expires_at` timestamp set to 1 hour from creation
- Expired orders are marked with status "expired"
- Admin interface shows count of expired orders

### 5. Admin Tools
- **Manual Cleanup**: Button in admin orders page to manually expire orders
- **Expired Orders Count**: Dashboard shows number of expired orders
- **Cron Job Endpoint**: `/api/cron/cleanup-expired-orders` for automated cleanup

## Implementation Details

### Database Schema
```sql
-- Orders table includes expires_at field
expires_at TIMESTAMP NOT NULL
```

### Key Components

1. **CheckoutTimer Component** (`components/payment/checkout-timer.tsx`)
   - Displays countdown timer
   - Handles expiration logic
   - Calls API to mark order as expired

2. **API Endpoints**
   - `POST /api/orders/expire` - Mark specific order as expired
   - `GET /api/orders/expire` - Clean up all expired orders
   - `GET /api/cron/cleanup-expired-orders` - Cron job endpoint
   - `POST /api/orders/activity` - Log user activity (page leave/return)
   - `GET /api/orders/activity` - Get order status and time remaining

3. **Database Functions**
   - `createOrder()` - Sets expiration to 1 hour from creation
   - `getOrderById()` - Includes expiration time in order data

4. **Session Recovery Components**
   - `SessionRecovery` - Handles expired order recovery and restart options

### Environment Variables
```env
# Cron job secret for automated cleanup tasks
CRON_SECRET=sadfrog-cron-secret-2024
```

## Testing

### Manual Testing
1. Create an order through the checkout process
2. Navigate to the payment page
3. Observe the timer countdown
4. Wait for expiration (or use test script for faster testing)

### Test Script
Use the provided test script to create orders with short expiration times:

```bash
# Create test order with 2-minute expiration
node scripts/test-timer.js create

# Check for expired orders
node scripts/test-timer.js check

# Clean up expired orders
node scripts/test-timer.js cleanup

# Run full test
node scripts/test-timer.js test
```

## Cron Job Setup

To automatically clean up expired orders, set up a cron job to call the cleanup endpoint:

```bash
# Run every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/cleanup-expired-orders
```

## Security Considerations

1. **Cron Secret**: The cleanup endpoint requires a secret token for security
2. **Order Validation**: Expired orders cannot be accessed via payment URLs
3. **Status Checks**: Orders are validated on both client and server side

## Future Enhancements

1. **Email Notifications**: Send reminder emails before expiration
2. **Extend Timer**: Allow users to extend their checkout time
3. **Partial Payments**: Handle partial payments before expiration
4. **Analytics**: Track expiration rates and user behavior

## Troubleshooting

### Common Issues

1. **Timer not updating**: Check browser console for JavaScript errors
2. **Orders not expiring**: Verify cron job is running and API endpoint is accessible
3. **Database errors**: Check database connection and schema

### Debug Commands

```bash
# Check current expired orders
node scripts/test-timer.js check

# Manually trigger cleanup
curl -X GET https://yourdomain.com/api/orders/expire

# View order details in admin panel
# Navigate to /admin/orders
``` 