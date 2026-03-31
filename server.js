/**
 * Servidor local para desenvolvimento — Igreja Farol de Cristo
 * Serve arquivos estáticos + POST /api/create-preference
 * Uso: node server.js
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

// Carrega variáveis do .env manualmente (sem depender do dotenv)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  });
}

const PORT = process.env.PORT || 3000;

// Map de extensões → MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png' : 'image/png',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff' : 'font/woff',
};

// ─── Handler da API ────────────────────────────────────────────────────────
async function handleCreatePreference(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }

  // Lê body da requisição
  const body = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end',  () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });

  const amount = parseFloat(body.amount);
  if (!amount || amount < 1) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Valor inválido' }));
    return;
  }

  try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = await new Preference(client).create({
      body: {
        items: [{
          id:          'doacao-farol-de-cristo',
          title:       'Doação — Igreja Farol de Cristo',
          description: 'Contribuição para a obra de Deus',
          quantity:    1,
          currency_id: 'BRL',
          unit_price:  amount,
        }],
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
        statement_descriptor: 'FAROL DE CRISTO',
      },
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ preferenceId: preference.id }));
  } catch (err) {
    console.error('[MP] Erro ao criar preferência:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ─── Handler de status do pagamento ──────────────────────────────────
async function handlePaymentStatus(req, res) {
  const id = new URL('http://x' + req.url).searchParams.get('id');
  if (!id) { res.writeHead(400); res.end('Missing id'); return; }

  try {
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(client).get({ id });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: payment.status, status_detail: payment.status_detail }));
  } catch (err) {
    console.error('[MP] Erro ao checar status:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ─── Handler de processamento de pagamento ────────────────────────────────────
async function handleProcessPayment(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }

  const body = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end',  () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });

  try {
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const paymentBody = {
      transaction_amount: parseFloat(body.transaction_amount),
      description:        'Doação — Igreja Farol de Cristo',
      payment_method_id:  body.payment_method_id,
      payer:              body.payer,
    };

    console.log('[MP] Processando pagamento:', JSON.stringify({
      transaction_amount: paymentBody.transaction_amount,
      payment_method_id:  paymentBody.payment_method_id,
      has_token:          !!body.token,
      payer_email:        body.payer?.email,
    }));

    if (body.token) {
      paymentBody.token        = body.token;
      paymentBody.installments = body.installments || 1;
      paymentBody.issuer_id    = body.issuer_id;
    }

    const payment = await new Payment(client).create({ body: paymentBody });

    console.log('[MP] Resposta:', payment.status, payment.status_detail);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status:          payment.status,
      status_detail:   payment.status_detail,
      id:              payment.id,
      pix_qr_code:     payment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_base64:   payment.point_of_interaction?.transaction_data?.qr_code_base64,
    }));
  } catch (err) {
    console.error('[MP] Erro ao processar pagamento:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ─── Handler de arquivos estáticos ────────────────────────────────────────
function handleStatic(req, res) {
  let urlPath = req.url.split('?')[0]; // remove query string
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(__dirname, urlPath);

  // Segurança: impede path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); res.end('Not Found'); }
      else                       { res.writeHead(500); res.end('Server Error'); }
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ─── Servidor HTTP ─────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS para desenvolvimento local
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${req.method}  ${req.url}`);

  if (req.url.startsWith('/api/create-preference')) {
    handleCreatePreference(req, res).catch(err => {
      console.error('Erro inesperado:', err);
      res.writeHead(500); res.end('Internal Server Error');
    });
  } else if (req.url.startsWith('/api/process-payment')) {
    handleProcessPayment(req, res).catch(err => {
      console.error('Erro inesperado:', err);
      res.writeHead(500); res.end('Internal Server Error');
    });
  } else if (req.url.startsWith('/api/payment-status')) {
    handlePaymentStatus(req, res).catch(err => {
      console.error('Erro inesperado:', err);
      res.writeHead(500); res.end('Internal Server Error');
    });
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ⛵  Igreja Farol de Cristo — Servidor local');
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log('  🔑  Access Token:', process.env.MP_ACCESS_TOKEN ? '✅ carregado' : '❌ NÃO encontrado');
  console.log('');
  console.log('  Pressione Ctrl+C para parar.\n');
});
