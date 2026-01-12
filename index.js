require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const multer = require('multer');       // Для обработки загрузки
const FormData = require('form-data');  // Для пересылки в ТГ

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка Multer: храним файл в оперативной памяти (RAM), а не на диске
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Ограничение: защита от спама (15 запросов в час)
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 15, 
    message: { status: 'error', message: "Слишком много попыток. Попробуйте позже." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.get('/', (req, res) => {
    res.send('Server is working!');
});

// --- 1. ОБЫЧНАЯ ЗАЯВКА (Текст) ---
app.post('/send-order', apiLimiter, async (req, res) => {
    const { name, contact, age } = req.body;
    const message = `<b>🔥 Новая заявка!</b>\n👤 <b>Имя:</b> ${name}\n📱 <b>Контакт:</b> ${contact}\n🎂 <b>Возраст:</b> ${age}`;

    try {
        await axios.post(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`, {
            chat_id: process.env.TG_CHAT_ID,
            parse_mode: 'html',
            text: message
        });
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Ошибка отправки текста:', error.message);
        res.status(500).json({ status: 'error' });
    }
});

// --- 2. ВЕРИФИКАЦИЯ (Фото паспорта) ---
app.post('/upload-passport', apiLimiter, upload.single('passport_photo'), async (req, res) => {
    try {
        // Проверяем, прислал ли пользователь файл
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Файл не выбран' });
        }

        const contact = req.body.contact || "Не указан";
        
        // Формируем "посылку" для Телеграма
        const form = new FormData();
        form.append('chat_id', process.env.TG_CHAT_ID);
        form.append('caption', `<b>🕵️ Верификация (18+)</b>\n📱 Контакт: ${contact}`);
        form.append('parse_mode', 'html');
        
        // Прикрепляем файл прямо из оперативной памяти
        form.append('photo', req.file.buffer, {
            filename: req.file.originalname, // Имя файла (например, image.jpg)
            contentType: req.file.mimetype // Тип файла
        });

        // Отправляем боту
        await axios.post(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendPhoto`, form, {
            headers: {
                ...form.getHeaders() // Важные заголовки для передачи файла
            }
        });

        res.json({ status: 'ok', message: 'Фото успешно отправлено' });

    } catch (error) {
        console.error('Ошибка отправки фото:', error.message);
        res.status(500).json({ status: 'error', message: 'Ошибка на сервере' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});