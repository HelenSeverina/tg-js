const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path'); // Додаємо модуль path для роботи з абсолютними шляхами

console.log('Запускається версія коду з saveMessage v2'); // Маркер версії

const apiId = 20989457; // Ваш api_id
const apiHash = '1b1ecf296a67eb593cf3b673767cc0b1'; // Ваш api_hash
const stringSession = new StringSession('1AgAOMTQ5LjE1NC4xNjcuNDEBuxg9dc4tO3RY4eB72R3cx2V5T4xAAQfVcFJoQeu4BrUpLErRayAzlP5BUmsBBm/oMWeJLC40kX5DUALofKGxr4Bi6koqWS1sUxz0PAO0DYJCTkw0ySltYgOb2xVLdGOwNjBGSGGmghkYGoVCMUF9G+EbQ1ikyQgIfdPRLrTFalil7obIvC+JKCrKSG11LxteoQIjmvGFRfWJ3OBlxneP9eO0FL39Q7WS0d2LMlnveP9mDFU/oAQx2/y5m4BVcJKDvq0J5xD0xWCltlG/7E/2+fOM/Op/08OesvR08QZZRMMruYgAhOLcQHq4Q7sDI9Dy81EeWI+6RxpsyVLp3lxrfUg='); // Нова сесія

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// Явний абсолютний шлях до файлу
const filePath = path.join(__dirname, 'dubinskypro_messages.txt');
console.log('Шлях до файлу:', filePath); // Дебаг шляху

function initializeFile() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'Лог повідомлень з @dubinskypro\n\n', 'utf8');
        console.log(`Файл ${filePath} створено!`);
    } else {
        console.log(`Файл ${filePath} уже існує, нові повідомлення додаватимуться до нього.`);
    }
}

async function connectToTelegram() {
    console.log('Починаємо підключення...');
    fs.appendFileSync(filePath, 'Тестовий запис перед підключенням\n', 'utf8'); // Тестовий запис
    console.log('Тестовий запис додано');

    await client.start({
        phoneNumber: async () => await input.text('Введіть ваш номер телефону (наприклад, +380123456789): '),
        password: async () => await input.text('Введіть пароль (якщо є): '),
        phoneCode: async () => await input.text('Введіть код із Telegram: '),
        onError: (err) => console.log('Помилка:', err),
    });

    console.log('Ви авторизувалися! Сесія:', client.session.save());
    initializeFile();
    await getChannelMessages();
}

function saveMessage(message) {
    console.log('saveMessage викликано. ID:', message.id);
    const messageId = message.id;
    const messageText = message.text || '[немає тексту]';
    const link = `https://t.me/dubinskypro/${messageId}`;
    const formattedMessage = `Олександр Дубінський опублікував допис на Telegram-каналі за посиланням: ${link}\nТекст допису: ${messageText}\n\n`;

    console.log('Форматоване повідомлення:', formattedMessage);
    try {
        fs.appendFileSync(filePath, formattedMessage, 'utf8');
        console.log('Повідомлення успішно збережено у файл');
    } catch (err) {
        console.error('Помилка при записі у файл:', err);
    }
}

async function getChannelMessages() {
    console.log('Отримання повідомлень із @dubinskypro...');
    const channel = await client.getEntity('dubinskypro');
    const messages = await client.getMessages(channel, { limit: 10 });
    console.log('Отримано повідомлень:', messages.length);

    messages.forEach((msg) => {
        saveMessage(msg);
    });
}

client.addEventHandler((update) => {
    if (update.className === 'UpdateNewChannelMessage' && update.message.peerId.channelId) {
        const message = update.message;
        console.log('Нове повідомлення отримано. ID:', message.id);
        saveMessage(message);
    }
}, { className: 'UpdateNewChannelMessage' });

connectToTelegram().catch(console.error);