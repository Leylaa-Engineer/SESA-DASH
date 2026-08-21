import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API durum kontrolü
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend calisiyor!' });
});

// Kayıt işlemi için endpoint örneği
app.post('/api/auth/register', (req, res) => {
  // Kayıt mantığınız
  res.json({ success: true, message: 'Kayıt başarılı' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

export default app;