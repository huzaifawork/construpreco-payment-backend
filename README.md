# Payment Backend

## Start the server:

```bash
npm start
```

Server will run on: http://localhost:3001

## Endpoints:

- POST /api/create-payment-intent - Creates Stripe payment intent
- POST /api/verify-payment - Verifies payment status

## Test Cards:

- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any postal code.
