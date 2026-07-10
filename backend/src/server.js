require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, connectDatabase } = require('./config/database');
const { startAutoCloseCron } = require('./config/cron');
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Import Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://agenda.casaeclean.com.br'].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Fallback para SPA em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

async function start() {
  try {
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado');
    
    // No Render, WhatsApp não funciona (não tem interface gráfica)
    if (process.env.RENDER) {
      console.log('⚠️ Ambiente Render - WhatsApp desabilitado');
    } else {
      try {
        const { initializeWhatsApp } = require('./config/whatsapp');
        await initializeWhatsApp();
        console.log('✅ WhatsApp inicializado');
      } catch (error) {
        console.log('⚠️ WhatsApp não disponível');
      }
    }
    
    startAutoCloseCron();
    console.log('✅ Cron jobs iniciados');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();