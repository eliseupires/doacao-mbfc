const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const body = req.body;

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const paymentBody = {
      transaction_amount: parseFloat(body.transaction_amount),
      description: 'Doação – Igreja Farol de Cristo',
      payment_method_id: body.payment_method_id,
      payer: body.payer,
    };

    // Cartão de crédito/débito
    if (body.token) {
      paymentBody.token        = body.token;
      paymentBody.installments = body.installments || 1;
      paymentBody.issuer_id    = body.issuer_id;
    }

    const payment = await new Payment(client).create({ body: paymentBody });

    return res.status(200).json({
      status:          payment.status,
      status_detail:   payment.status_detail,
      id:              payment.id,
      // PIX
      pix_qr_code:     payment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_base64:   payment.point_of_interaction?.transaction_data?.qr_code_base64,
      // Boleto
      boleto_url:      payment.transaction_details?.external_resource_url,
      boleto_barcode:  payment.barcode?.content,
    });
  } catch (error) {
    console.error('Erro ao processar pagamento MP:', error);
    return res.status(500).json({ error: error.message });
  }
};
