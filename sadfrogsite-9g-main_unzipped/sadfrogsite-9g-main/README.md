# SadFrogTech - Modular Litecoin E-commerce Platform

A production-ready Next.js e-commerce platform with integrated Litecoin payment processing, designed for modular customization and easy deployment.

## 🚀 Features

### Core E-commerce
- **Product Catalog**: Dynamic product management with categories, pricing, and inventory
- **Shopping Cart**: Persistent cart with real-time updates
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Admin Dashboard**: Comprehensive admin interface for store management

### Litecoin Payment System
- **Direct Node Integration**: Custom Litecoin node for payment processing
- **Real-time Monitoring**: Automatic payment detection with 10-second polling
- **QR Code Generation**: Mobile-friendly payment with QR codes
- **Secure Address Generation**: Unique addresses for each order
- **1-Block Confirmation**: Fast payment confirmation for better UX

### Admin Features
- **Product Management**: Add, edit, and manage products with rich metadata
- **Order Analytics**: Real-time order tracking and analytics
- **Customer Management**: Subscriber list and customer data
- **Audit Logging**: Complete system activity tracking
- **Email Integration**: Automated email notifications via Resend

## 🏗️ Architecture

### Modular Design
The application is built with modularity in mind, allowing easy customization for different use cases:

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard (modular)
│   ├── api/               # API routes (modular)
│   ├── catalog/           # Product catalog (modular)
│   ├── checkout/          # Checkout flow (modular)
│   └── payment/           # Payment processing (modular)
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── payment/          # Payment system components
│   ├── storefront/       # Storefront components
│   └── ui/               # Base UI components
├── lib/                  # Core business logic
│   ├── data.ts           # Database operations
│   ├── ltc-*.ts          # Litecoin integration modules
│   ├── admin-session.ts  # Admin authentication
│   └── email.ts          # Email functionality
└── types/                # TypeScript type definitions
```

### Payment System Modules
- **`lib/ltc-node.ts`**: Litecoin node RPC integration
- **`lib/ltc-conversions.ts`**: USD/LTC price conversion
- **`components/payment/litecoin-payment.tsx`**: Payment UI component
- **`app/api/ltc-payments/`**: Payment API endpoints

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: NeonDB (PostgreSQL) with automatic schema management
- **Payment**: Custom Litecoin node integration
- **Authentication**: Custom session management with JWT
- **Email**: Resend API integration
- **Package Manager**: pnpm

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Litecoin node 
- NeonDB account (or any PostgreSQL database)
- Resend API KEY
- Livecoin Watch API Key


### 1. Clone and Install
```bash
git clone <your-repo-url>
cd sadfrogtech
pnpm install
```

### 2. Environment Configuration
Copy the environment template and configure your settings:
```bash
cp env_template .env.local
```

#### Required Environment Variables:
```env
# Database
DATABASE_URL=your_neon_db_url

# Litecoin Node 
LTC_RPC_USER=your_rpc_user
LTC_RPC_PASS=your_rpc_password
LTC_RPC_HOST=your_node_host
LTC_RPC_PORT=9333
LTC_RPC_WALLET=your_wallet_name

# Admin Configuration
ADMIN_SESSION_SECRET=your_jwt_secret
ADMIN_LTC_ADDRESS=your_admin_ltc_address

# Email 
RESEND_API_KEY=your_resend_api_key

# Price API 
LIVECOINWATCH_API_KEY=your_api_key
LTC_FALLBACK_RATE=120
```

### 3. Database Setup
The application automatically sets up the database schema on first run. No manual migration needed.

### 4. Development
```bash
pnpm dev
```

### 5. Production Build
```bash
pnpm build
pnpm start
```

## 🔧 Customization Guide

### Adding New Payment Methods
1. Create new payment component in `components/payment/`
2. Add corresponding API routes in `app/api/`
3. Update checkout flow in `app/checkout/`
4. Add payment method selection logic

### Customizing the Storefront
- **Products**: Modify `components/storefront/` for product display
- **Catalog**: Customize `app/catalog/` for browsing experience
- **Checkout**: Update `app/checkout/` for checkout flow
- **Styling**: Modify `tailwind.config.ts` and global styles

### Admin Dashboard Extensions
- **New Admin Pages**: Add to `app/admin/`
- **Admin Components**: Create in `components/admin/`
- **API Routes**: Add admin endpoints in `app/api/admin/`

### Database Schema Modifications
- **Products**: Extend product schema in `lib/data.ts`
- **Orders**: Modify order structure as needed
- **Users**: Add customer/user management features

## 🧪 Testing

### Payment Testing
Visit `/test-ltc-payment` to test the complete payment flow:
1. Generate payment address
2. Send test Litecoin payment
3. Monitor real-time payment status
4. Verify confirmation process

### Admin Testing
- Access admin at `/admin`
- Test product management
- Verify order processing
- Check analytics dashboard

## 🔒 Security Features

- **JWT Session Management**: Secure admin authentication
- **Unique Payment Addresses**: Each order gets a unique address
- **Input Validation**: Comprehensive form validation with Zod
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Next.js built-in CSRF protection

## 📊 API Documentation

### Payment Endpoints
- `POST /api/ltc-payments/create-address` - Generate payment address
- `GET /api/ltc-payments/check-payment` - Check payment status
- `GET /api/ltc-price` - Get current LTC/USD price

### Order Endpoints
- `POST /api/orders` - Create new order
- `GET /api/orders/[orderId]` - Get order details
- `GET /api/order-status/[orderId]` - Get order status

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/sessions` - Session management
- `POST /api/admin/send-mass-email` - Email campaigns

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch


OR traditional webserver work flows 


### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Manual Server Deployment
1. Build the application: `pnpm build`
2. Start production server: `pnpm start`
3. Use PM2 for process management: `pm2 start npm --name "sadfrog" -- start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔄 Changelog

### v1.0.0
- Initial release with Litecoin payment integration
- Complete e-commerce functionality
- Admin dashboard with analytics
- Modular architecture for easy customization

---

**Built with ❤️ for the Litecoin community**
