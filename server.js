import express from 'express';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist/
app.use(express.static(path.join(__dirname, 'dist')));

// Netlify function adapter — maps /.netlify/functions/:name to netlify/functions/:name.js
app.all('/.netlify/functions/:name', async (req, res) => {
  const funcName = req.params.name;

  // Only allow alphanumeric characters and hyphens to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(funcName)) {
    return res.status(400).json({ error: 'Invalid function name' });
  }

  try {
    const funcPath = path.join(__dirname, 'netlify', 'functions', `${funcName}.js`);

    if (!existsSync(funcPath)) {
      return res.status(404).json({ error: 'Function not found' });
    }

    const funcModule = await import(funcPath);
    const handler = funcModule.handler || funcModule.default;

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body: req.method === 'GET' ? null : JSON.stringify(req.body),
      queryStringParameters: req.query,
      path: req.path,
    };

    const result = await handler(event, {});

    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, String(value));
      }
    }

    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error(`Error executing function ${funcName}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA fallback — all other routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
