require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Получаем настройки из файла .env
const TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;
const URI_API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

app.post('/send-order', async (req, res) => {
    // Получаем данные, которые пришли с сайта
    const { name, contact, age } = req.body;

    // Формируем красивое сообщение для Телеграма
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
        console.log('Заявка отправлена в ТГ');
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Ошибка отправки:', error);
        res.status(500).json({ status: 'error' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Работает по адресу: http://localhost:${PORT}`);
});