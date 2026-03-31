const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const id = req.query?.id || new URL('http://x' + req.url).searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const client  = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(client).get({ id });
    return res.status(200).json({ status: payment.status, status_detail: payment.status_detail });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
