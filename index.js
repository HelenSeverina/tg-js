const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');

console.log('Запускається версія коду з saveMessage v7 - автономний режим для нових повідомлень');

const apiId = 20989457;
const apiHash = '1b1ecf296a67eb593cf3b673767cc0b1';
const stringSession = new StringSession('1AgAOMTQ5LjE1NC4xNjcuNDEBuxg9dc4tO3RY4eB72R3cx2V5T4xAAQfVcFJoQeu4BrUpLErRayAzlP5BUmsBBm/oMWeJLC40kX5DUALofKGxr4Bi6koqWS1sUxz0PAO0DYJCTkw0ySltYgOb2xVLdGOwNjBGSGGmghkYGoVCMUF9G+EbQ1ikyQgIfdPRLrTFalil7obIvC+JKCrKSG11LxteoQIjmvGFRfWJ3OBlxneP9eO0FL39Q7WS0d2LMlnveP9mDFU/oAQx2/y5m4BVcJKDvq0J5xD0xWCltlG/7E/2+fOM/Op/08OesvR08QZZRMMruYgAhOLcQHq4Q7sDI9Dy81EeWI+6RxpsyVLp3lxrfUg=');

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: false,
});

const baseDir = process.cwd(); // Поточна робоча директорія хоста
const filePath = path.join(baseDir, 'dist', 'dubinskypro_messages.txt');
console.log('Шлях до файлу:', filePath);

// Ініціалізація файлу (очищення або створення нового)
function initializeFile() {
    try {
        // Перевіряємо, чи існує папка dist
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Папка ${dir} створена!`);
        }

        // Очищаємо файл або створюємо новий
        fs.writeFileSync(filePath, 'Лог повідомлень з @dubinskypro\n\n', 'utf8');
        console.log(`Файл ${filePath} очищено/створено!`);
    } catch (err) {
        console.error('Помилка при створенні/очищенні файлу:', err);
        // У разі помилки спробуємо зберегти файл у поточній директорії як резерв
        const fallbackPath = path.join(__dirname, 'dubinskypro_messages.txt');
        fs.writeFileSync(fallbackPath, 'Лог повідомлень з @dubinskypro\n\n', 'utf8');
        console.log(`Файл створено у резервному шляху: ${fallbackPath}`);
    }
}

async function getLastMessage(channel) {
    try {
        // Отримуємо історію повідомлень каналу, щоб знайти останнє повідомлення
        const messages = await client.getMessages(channel, { limit: 1 }); // Отримуємо лише одне (останнє) повідомлення
        if (messages.length > 0) {
            saveMessage(messages[0]); // Зберігаємо останнє повідомлення
            console.log('Останнє повідомлення збережено при першому запуску.');
        } else {
            console.log('Немає повідомлень для збереження при першому запуску.');
        }
    } catch (err) {
        console.error('Помилка при отриманні останнього повідомлення:', err);
    }
}

async function startListening() {
    console.log('Починаємо підключення...');
    await client.connect();
    console.log('Ви авторизувалися! Сесія:', client.session.save());
    initializeFile();

    // Отримання каналу @dubinskypro
    const channel = await client.getEntity('dubinskypro');

    // При першому запуску зберігаємо останнє повідомлення
    await getLastMessage(channel);

    // Відстеження нових повідомлень
    client.on('message', async (message) => {
        console.log('Отримане повідомлення:', {
            chatId: message.chatId,
            channelId: channel.id,
            text: message.text,
            message: message.message,
            content: message.content ? JSON.stringify(message.content) : 'No content',
            media: message.media ? message.media.className : 'No media',
            caption: message.media ? (message.media.caption || 'No caption') : 'No media',
            raw: JSON.stringify(message) // Додаємо повну структуру повідомлення для дебага
        });

        // Перевірка, чи повідомлення з каналу @dubinskypro і має текст
        if (message.chatId === channel.id) {
            saveMessage(message);
        }
    });

    console.log('Скрипт працює в автономному режимі. Очікуємо нові повідомлення...');
}

function saveMessage(message) {
    console.log('Нове повідомлення отримано. ID:', message.id);
    const messageId = message.id;
    let messageText = '';

    // Спробуємо витягти текст із різних можливих полів
    if (message.message) {
        messageText = message.message.trim();
    } else if (message.text) {
        messageText = message.text.trim();
    } else if (message.content && message.content.text) {
        messageText = message.content.text.trim();
    } else if (message.media && message.media.caption) {
        messageText = message.media.caption.trim();
    }

    // Якщо текст відсутній, зберігаємо повідомлення про це
    if (!messageText) {
        messageText = '[немає тексту]';
    }

    const link = `https://t.me/dubinskypro/${messageId}`;
    const formattedMessage = `Олександр Дубінський опублікував допис на Telegram-каналі за посиланням: ${link}\nТекст публікації:\n${messageText}\n\n`;

    console.log('Форматоване повідомлення:', formattedMessage);
    try {
        fs.appendFileSync(filePath, formattedMessage, 'utf8');
        console.log('Повідомлення успішно збережено у файл');
    } catch (err) {
        console.error('Помилка при записі у файл:', err);
        // Резервний шлях для збереження
        const fallbackPath = path.join(__dirname, 'dubinskypro_messages.txt');
        try {
            fs.appendFileSync(fallbackPath, formattedMessage, 'utf8');
            console.log(`Повідомлення збережено у резервному файлі: ${fallbackPath}`);
        } catch (fallbackErr) {
            console.error('Помилка при записі у резервний файл:', fallbackErr);
        }
    }
}

startListening().catch(console.error);