const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async (req, res) => {
  // Permite apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // CORS para o site funcionar no mesmo domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'doacao-farol-de-cristo',
            title: 'Doação — Igreja Farol de Cristo',
            description: 'Contribuição para a Igreja Ministério Batista Farol de Cristo',
            quantity: 1,
            unit_price: parseFloat(amount),
            currency_id: 'BRL',
          },
        ],
        statement_descriptor: 'FAROL DE CRISTO',
        external_reference: `doacao-${Date.now()}`,
      },
    });

    return res.status(200).json({ preferenceId: result.id });

  } catch (error) {
    console.error('Erro ao criar preferência MP:', error);
    return res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
};
