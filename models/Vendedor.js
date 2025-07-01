const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const vendedorSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefone: {
    type: String,
    trim: true,
    maxlength: [20, 'Telefone deve ter no máximo 20 caracteres']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  tentativasLogin: {
    type: Number,
    default: 0,
    min: [0, 'Tentativas não pode ser negativo']
  },
  bloqueadoAte: {
    type: Date,
    default: null
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.senha; // Remove senha do JSON de resposta
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para performance
vendedorSchema.index({ email: 1 });
vendedorSchema.index({ id: 1 });

// Método para verificar se o vendedor está bloqueado
vendedorSchema.methods.estaBloqueado = function() {
  return this.bloqueadoAte && this.bloqueadoAte > new Date();
};

// Método para bloquear vendedor
vendedorSchema.methods.bloquear = function(minutos = 30) {
  this.bloqueadoAte = new Date(Date.now() + minutos * 60 * 1000);
  this.tentativasLogin = 0;
  return this.save();
};

// Método para resetar tentativas
vendedorSchema.methods.resetarTentativas = function() {
  this.tentativasLogin = 0;
  this.bloqueadoAte = null;
  return this.save();
};

// Middleware pre-save para logging
vendedorSchema.pre('save', function(next) {
  if (this.isNew) {
    console.log(`📝 Novo vendedor criado: ${this.nome} (${this.email})`);
  }
  next();
});

module.exports = mongoose.model('Vendedor', vendedorSchema); 