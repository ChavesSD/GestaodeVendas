const mongoose = require('mongoose');

// Configuração da conexão MongoDB
const connectDB = async () => {
  try {
    // String de conexão - começar com MongoDB local para desenvolvimento
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestao-vendas';
    
    // Opções de conexão para melhor performance e estabilidade
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Máximo de 10 conexões simultâneas
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      family: 4, // Usar IPv4
      bufferMaxEntries: 0, // Desabilitar mongoose buffering
      bufferCommands: false, // Desabilitar mongoose buffering
    };

    // Conectar ao MongoDB
    const conn = await mongoose.connect(MONGO_URI, options);

    console.log(`🟢 MongoDB conectado: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Listener para eventos de conexão
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado ao MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose desconectado do MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 Conexão MongoDB fechada devido ao término da aplicação');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro ao fechar conexão MongoDB:', error);
        process.exit(1);
      }
    });

    return conn;
    
  } catch (error) {
    console.error('❌ Falha na conexão MongoDB:', error.message);
    
    // Se falhar a conexão, tentar novamente em 5 segundos
    console.log('🔄 Tentando reconectar em 5 segundos...');
    setTimeout(connectDB, 5000);
  }
};

// Função para verificar status da conexão
const checkConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'Desconectado',
    1: 'Conectado',
    2: 'Conectando',
    3: 'Desconectando'
  };
  
  return {
    state: state,
    status: states[state],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

// Função para executar health check do banco
const healthCheck = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.ping();
    
    return {
      status: 'healthy',
      message: 'MongoDB está respondendo',
      ping: status,
      connection: checkConnection()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'MongoDB não está respondendo',
      error: error.message,
      connection: checkConnection()
    };
  }
};

// Função para migrar dados existentes (arrays em memória -> MongoDB)
const migrarDadosExistentes = async (vendedoresArray = [], vendasArray = []) => {
  try {
    const Vendedor = require('../models/Vendedor');
    const Venda = require('../models/Venda');
    
    console.log('🔄 Iniciando migração de dados...');
    
    // Verificar se já existem dados no banco
    const vendedoresExistentes = await Vendedor.countDocuments();
    const vendasExistentes = await Venda.countDocuments();
    
    if (vendedoresExistentes > 0 || vendasExistentes > 0) {
      console.log(`ℹ️  Dados já existem no banco (${vendedoresExistentes} vendedores, ${vendasExistentes} vendas)`);
      return {
        vendedores: vendedoresExistentes,
        vendas: vendasExistentes,
        migrado: false
      };
    }
    
    // Migrar vendedores
    if (vendedoresArray.length > 0) {
      await Vendedor.insertMany(vendedoresArray);
      console.log(`✅ ${vendedoresArray.length} vendedores migrados`);
    }
    
    // Migrar vendas
    if (vendasArray.length > 0) {
      await Venda.insertMany(vendasArray);
      console.log(`✅ ${vendasArray.length} vendas migradas`);
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
    return {
      vendedores: vendedoresArray.length,
      vendas: vendasArray.length,
      migrado: true
    };
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  checkConnection,
  healthCheck,
  migrarDadosExistentes
}; 