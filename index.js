require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000; // Render сам назначит порт

app.use(cors());
app.use(express.json());

// Ограничение: 3 заявки в час с одного IP
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 3, 
    message: { status: 'error', message: "Слишком много заявок, попробуйте позже." },
    standardHeaders: true,
    legacyHeaders: false,
});

// 1. Добавляем ответ для главной страницы (чтобы не было "Cannot GET /")
app.get('/', (req, res) => {
    res.send('Сервер StarWay запущен и работает!');
});

// 2. Основной маршрут для заявок (с лимитом)
app.post('/send-order', apiLimiter, async (req, res) => {
    const { name, contact, age } = req.body;

    const TOKEN = process.env.TG_TOKEN;
    const CHAT_ID = process.env.TG_CHAT_ID;
    const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    const message = `<b>🔥 Новая заявка с сайта!</b>\n\n` +
                    `👤 <b>Имя:</b> ${name}\n` +
                    `📱 <b>Контакт:</b> ${contact}\n` +
                    `🎂 <b>Возраст:</b> ${age}`;

    try {
        await axios.post(URI_API, {
            chat_id: CHAT_ID,
            parse_mode: 'html',
            text: message
        });
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Ошибка ТГ:', error.response ? error.response.data : error.message);
        res.status(500).json({ status: 'error' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});