# SadFrog Site - Litecoin Payment System

A Next.js e-commerce site with integrated Litecoin payment processing using a custom Litecoin node.

## Features

- **Litecoin Payment Processing**: Direct integration with Litecoin node for payment collection
- **Real-time Payment Monitoring**: Automatic detection and confirmation of payments
- **QR Code Generation**: Easy mobile payment with QR codes
- **Secure Payment Flow**: Unique addresses for each order with automatic monitoring
- **Modern UI**: Clean, responsive design with real-time status updates

## Payment System

The site uses a custom Litecoin node (`sadfrog` wallet) for:
- Generating unique payment addresses for each order
- Monitoring incoming payments in real-time
- Automatic payment confirmation (1 block)
- Secure payment processing without third-party dependencies

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Payment**: Custom Litecoin node integration
- **Database**: NeonDB (PostgreSQL)
- **Authentication**: Custom session management

## Environment Variables

```env
# Litecoin Node Configuration
LTC_RPC_USER=ltcsadfrog123
LTC_RPC_PASS=imjustachillhouse28
LTC_RPC_HOST=157.173.198.7
LTC_RPC_PORT=9333
LTC_RPC_WALLET=sadfrog

# LTC Price API
LIVECOINWATCH_API_KEY=your_api_key
LTC_FALLBACK_RATE=85.0

# Database
DATABASE_URL=your_database_url

# Admin
ADMIN_SESSION_SECRET=your_secret
ADMIN_LTC_ADDRESS=your_admin_address
```

## Getting Started

1. Install dependencies: `pnpm install`
2. Set up environment variables
3. Start development server: `pnpm dev`
4. Test payments at `/test-ltc-payment`

## Payment Flow

1. User creates an order
2. System generates unique Litecoin address
3. User sends exact LTC amount to address
4. System monitors for payment (polls every 10 seconds)
5. Payment confirmed after 1 block
6. Order status updated automatically

## API Endpoints

- `POST /api/ltc-payments/create-address` - Generate payment address
- `GET /api/ltc-payments/check-payment` - Check payment status
- `GET /api/ltc-price` - Get current LTC/USD price
