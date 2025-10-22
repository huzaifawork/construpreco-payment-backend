require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Eupago Configuration
const EUPAGO_API_KEY = process.env.EUPAGO_API_KEY;
const EUPAGO_BASE_URL = 'https://clientes.eupago.pt/clientes/rest_api';

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://construpreco-marketplace.vercel.app',
  'https://construpreco-marketplace-ruddy.vercel.app',
  process.env.MARKETPLACE_URL,
  process.env.DRIVER_APP_URL,
  process.env.CLIENT_FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ConstruPreço Payment API - Eupago',
    endpoints: {
      mbway: 'POST /api/eupago/mbway',
      multibanco: 'POST /api/eupago/multibanco',
      payshop: 'POST /api/eupago/payshop',
      checkPayment: 'POST /api/eupago/check-payment',
      webhook: 'POST /api/eupago/webhook'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============ EUPAGO ENDPOINTS ============

// Create MB Way payment
app.post('/api/eupago/mbway', async (req, res) => {
  try {
    const { amount, phone, orderId } = req.body;

    const response = await axios.post(`${EUPAGO_BASE_URL}/mbway/create`, {
      chave: EUPAGO_API_KEY,
      valor: amount,
      id: orderId,
      alias: phone,
      descricao: `Pedido ${orderId}`
    });

    res.json(response.data);
  } catch (error) {
    console.error('Eupago MB Way error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Create Multibanco reference
app.post('/api/eupago/multibanco', async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const response = await axios.post(`${EUPAGO_BASE_URL}/multibanco/create`, {
      chave: EUPAGO_API_KEY,
      valor: amount,
      id: orderId,
      descricao: `Pedido ${orderId}`
    });

    res.json(response.data);
  } catch (error) {
    console.error('Eupago Multibanco error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Create PayShop reference
app.post('/api/eupago/payshop', async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const response = await axios.post(`${EUPAGO_BASE_URL}/payshop/create`, {
      chave: EUPAGO_API_KEY,
      valor: amount,
      id: orderId,
      descricao: `Pedido ${orderId}`
    });

    res.json(response.data);
  } catch (error) {
    console.error('Eupago PayShop error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Check payment status
app.post('/api/eupago/check-payment', async (req, res) => {
  try {
    const { referencia, tipo } = req.body; // tipo: 'mbway', 'multibanco', or 'payshop'

    const response = await axios.post(`${EUPAGO_BASE_URL}/${tipo}/info`, {
      chave: EUPAGO_API_KEY,
      referencia
    });

    res.json(response.data);
  } catch (error) {
    console.error('Eupago check payment error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});



// Eupago webhook for payment notifications
app.post('/api/eupago/webhook', async (req, res) => {
  try {
    const { referencia, valor, estado, identificador, chave } = req.body;
    
    console.log('Eupago webhook received:', req.body);
    
    // Verify the webhook is from Eupago
    if (chave !== EUPAGO_API_KEY) {
      console.error('Unauthorized webhook attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Log payment confirmation
    if (estado === 'pago' || estado === 'success') {
      console.log(`✅ Payment confirmed - Reference: ${referencia}, Amount: €${valor}`);
      // TODO: Update order status in database
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Payment server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
