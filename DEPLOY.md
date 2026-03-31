# Deploy — Igreja Farol de Cristo

## Pré-requisitos
- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)

---

## 1. Obter credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie um aplicativo (ou use um existente)
3. Vá em **Credenciais de Produção**
4. Copie:
   - **Public Key** → começa com `APP_USR-...`
   - **Access Token** → começa com `APP_USR-...`

---

## 2. Configurar Public Key no site

Abra `index.html` e localize a linha:
```js
const mp = new MercadoPago(window.MP_PUBLIC_KEY || 'TEST-PUBLIC-KEY', {
```
Substitua `'TEST-PUBLIC-KEY'` pela sua Public Key real.

---

## 3. Deploy no Vercel

### Opção A — Via GitHub (recomendado)
1. Crie um repositório no GitHub e envie os arquivos
2. Acesse vercel.com → **New Project** → importe o repositório
3. Configure as variáveis de ambiente:
   - `MP_ACCESS_TOKEN` = seu Access Token
   - `SITE_URL` = URL do seu site no Vercel (ex: https://farol-de-cristo.vercel.app)
4. Clique em **Deploy**

### Opção B — Via Vercel CLI
```bash
npm install -g vercel
cd C:\Users\elpires\farol-de-cristo
vercel
```
Quando solicitado, configure as variáveis de ambiente.

---

## 4. Variáveis de Ambiente no Vercel

| Variável | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Seu Access Token do MP |
| `SITE_URL` | URL do site no Vercel |

---

## 5. Testando

- Use credenciais de **Sandbox** para testar sem cobrar de verdade
- Cartão de teste: `5031 4332 1540 6351` / Validade: `11/25` / CVV: `123`
- Após confirmar funcionamento, troque para credenciais de **Produção**

---

## Estrutura do Projeto

```
farol-de-cristo/
├── api/
│   └── create-preference.js   # Serverless function (Vercel)
├── images/
│   ├── logo.jpg
│   └── foto-pastores.jpg
├── index.html                 # Site principal
├── style.css                  # Estilos
├── package.json
├── vercel.json
└── .env.example               # Modelo das variáveis de ambiente
```
