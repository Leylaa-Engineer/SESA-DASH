import express from 'express';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API rotalarını dinamik olarak yükleme fonksiyonu
async function loadApiRoutes(dirPath, baseRoute = '/api') {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const routeSegment = entry.name.startsWith('[') && entry.name.endsWith(']')
        ? `:${entry.name.slice(1, -1)}`
        : entry.name;
      await loadApiRoutes(fullPath, `${baseRoute}/${routeSegment}`);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      let routePath = baseRoute;
      if (entry.name !== 'index.js' && entry.name !== 'index.mjs') {
        const nameWithoutExt = entry.name.replace(/\.(js|mjs)$/, '');
        const routeSegment = nameWithoutExt.startsWith('[') && nameWithoutExt.endsWith(']')
          ? `:${nameWithoutExt.slice(1, -1)}`
          : nameWithoutExt;
        routePath = `${baseRoute}/${routeSegment}`;
      }

      try {
        const fileUrl = pathToFileURL(fullPath).href;
        const module = await import(fileUrl);
        const handler = module.default;

        if (typeof handler === 'function') {
          app.all(routePath, async (req, res) => {
            try {
              // URL parametrelerini (req.params) req.query nesnesine güvenli şekilde aktarıyoruz
              if (req.query && typeof req.query === 'object') {
                Object.assign(req.query, req.params);
              }
              await handler(req, res);
            } catch (err) {
              console.error(`❌ HATA [${routePath}]:`, err);
              res.status(500).json({ error: 'Internal Server Error', details: err.message });
            }
          });
          console.log(`[API Route Registered]: ${routePath}`);
        }
      } catch (err) {
        console.error(`❌ Rota yüklenirken hata oluştu (${fullPath}):`, err);
      }
    }
  }
}

// Rotaları yükle ve sunucuyu başlat
const apiDirectory = path.join(process.cwd(), 'api');
await loadApiRoutes(apiDirectory);

app.listen(PORT, () => {
  console.log(`Backend API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});