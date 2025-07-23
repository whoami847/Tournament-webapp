# RupantorPay Payment Gateway Setup Guide

## Overview
This system provides a complete payment gateway integration with RupantorPay for your Next.js and Firebase application. Users can automatically top up their wallets, and admins can manage payment gateways through the admin panel.

## Features
- ✅ Admin gateway management (/admin/gateways)
- ✅ User wallet top-up (/wallet/top-up)
- ✅ Automated payment processing
- ✅ Real-time balance updates
- ✅ Transaction history
- ✅ Payment verification
- ✅ Multiple payment status handling

## Setup Instructions

### 1. Environment Configuration
Update your `.env.local` file with your RupantorPay credentials:

```env
# RupantorPay Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
RUPANTORPAY_STORE_ID=your_actual_store_id
RUPANTORPAY_CHECKOUT_URL=https://payment.rupantorpay.com/api/payment/checkout
RUPANTORPAY_VERIFY_URL=https://payment.rupantorpay.com/api/payment/verify-payment
```

### 2. Admin Gateway Setup
1. Go to `/admin/gateways` in your application
2. Click "New Gateway"
3. Fill in the form:
   - **Gateway Name**: RupantorPay (fixed)
   - **Store Password**: Your RupantorPay store password/secret
   - **Mode**: Toggle between Sandbox/Live
   - **Status**: Enable/Disable the gateway
4. Save the configuration

### 3. Firebase Collections
The system will automatically create these collections:
- `gateways` - Payment gateway configurations
- `orders` - Payment orders and tracking
- `transactions` - Transaction history (existing)

### 4. URL Configuration
Make sure your RupantorPay account has these callback URLs configured:
- Success URL: `https://yourdomain.com/api/payment/callback?status=success`
- Fail URL: `https://yourdomain.com/api/payment/callback?status=fail`
- Cancel URL: `https://yourdomain.com/api/payment/callback?status=cancel`
- IPN URL: `https://yourdomain.com/api/payment/callback`

## User Flow

### Wallet Top-up Process
1. User goes to `/wallet/top-up`
2. Selects "Automated Top-up" tab
3. Enters amount or selects quick amount
4. Clicks "Proceed to Payment"
5. Gets redirected to RupantorPay
6. Completes payment
7. Gets redirected back to success/fail page
8. Wallet balance updates automatically

### Admin Management
1. Admin goes to `/admin/gateways`
2. Can view all configured gateways
3. Can add new gateways
4. Can edit existing gateways
5. Can enable/disable gateways
6. Can delete gateways

## API Endpoints

### `/api/payment/initiate`
- **Method**: POST
- **Purpose**: Initiates payment with RupantorPay
- **Payload**: `{ amount: number, userId: string }`
- **Response**: `{ success: boolean, payment_url?: string, error?: string }`

### `/api/payment/callback`
- **Methods**: GET, POST
- **Purpose**: Handles RupantorPay callbacks
- **Parameters**: `status`, `tran_id`, `payment_id`, `amount`
- **Actions**: Verifies payment, updates balance, creates transaction

## Database Schema

### Gateway Collection
```typescript
interface Gateway {
  id: string;
  name: string; // "RupantorPay"
  storePassword: string;
  isLive: boolean;
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Order Collection
```typescript
interface Order {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  gatewayId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentId?: string;
  transactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Testing

### Sandbox Testing
1. Set gateway mode to "Sandbox"
2. Use test credentials from RupantorPay
3. Test with small amounts
4. Verify all callback URLs work

### Production Deployment
1. Update environment variables
2. Set gateway mode to "Live"
3. Use production credentials
4. Test with real small amounts first

## Troubleshooting

### Common Issues
1. **Payment fails immediately**: Check store password and store ID
2. **Callback not working**: Verify callback URLs in RupantorPay dashboard
3. **Balance not updating**: Check Firebase permissions and transaction logs
4. **Gateway not showing**: Ensure gateway is enabled in admin panel

### Debug Information
- Check browser console for errors
- Check server logs for API responses
- Verify Firebase collections are created
- Test callback URLs manually

## Security Notes
- Store passwords are handled securely
- All payments are verified server-side
- Transaction integrity is maintained with Firestore transactions
- Callback verification prevents fraud

## Support
For RupantorPay specific issues, contact their support team.
For system integration issues, check the console logs and Firebase data.