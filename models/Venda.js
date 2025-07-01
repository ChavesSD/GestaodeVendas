const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const vendaSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  vendedorId: {
    type: String,
    required: [true, 'ID do vendedor é obrigatório'],
    index: true
  },
  cliente: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do cliente deve ter no máximo 100 caracteres']
  },
  cpfCnpj: {
    type: String,
    trim: true,
    maxlength: [18, 'CPF/CNPJ deve ter no máximo 18 caracteres']
  },
  telefone: {
    type: String,
    trim: true,
    maxlength: [20, 'Telefone deve ter no máximo 20 caracteres']
  },
  endereco: {
    type: String,
    trim: true,
    maxlength: [200, 'Endereço deve ter no máximo 200 caracteres']
  },
  cep: {
    type: String,
    trim: true,
    maxlength: [10, 'CEP deve ter no máximo 10 caracteres']
  },
  produto: {
    type: String,
    required: [true, 'Produto é obrigatório'],
    trim: true,
    maxlength: [100, 'Produto deve ter no máximo 100 caracteres']
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor deve ser positivo'],
    set: function(valor) {
      return Math.round(valor * 100) / 100; // Arredondar para 2 casas decimais
    }
  },
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: {
      values: ['pendente', 'andamento', 'instalado', 'cancelado'],
      message: 'Status deve ser: pendente, andamento, instalado ou cancelado'
    },
    default: 'pendente',
    lowercase: true
  },
  dataVenda: {
    type: Date,
    required: [true, 'Data da venda é obrigatória'],
    default: Date.now
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações devem ter no máximo 500 caracteres']
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

// Índices para performance otimizada
vendaSchema.index({ vendedorId: 1, dataVenda: -1 }); // Para buscar vendas por vendedor ordenadas por data
vendaSchema.index({ status: 1 }); // Para filtrar por status
vendaSchema.index({ dataVenda: -1 }); // Para ordenar por data
vendaSchema.index({ valor: -1 }); // Para ordenar por valor
vendaSchema.index({ cliente: 'text', produto: 'text' }); // Para busca textual

// Método virtual para formatar data brasileira
vendaSchema.virtual('dataVendaFormatada').get(function() {
  return this.dataVenda.toLocaleDateString('pt-BR');
});

// Método virtual para formatar valor em reais
vendaSchema.virtual('valorFormatado').get(function() {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(this.valor);
});

// Método para verificar se a venda pode ser editada
vendaSchema.methods.podeSerEditada = function() {
  return this.status !== 'cancelado' && this.status !== 'instalado';
};

// Método para calcular dias desde a venda
vendaSchema.methods.diasDesdeVenda = function() {
  const hoje = new Date();
  const diffTime = hoje - this.dataVenda;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Middleware pre-save para logging e validações adicionais
vendaSchema.pre('save', function(next) {
  // Garantir que a data não seja futura
  if (this.dataVenda > new Date()) {
    return next(new Error('Data da venda não pode ser futura'));
  }
  
  if (this.isNew) {
    console.log(`💰 Nova venda criada: ${this.cliente} - ${this.valorFormatado}`);
  }
  
  next();
});

// Método estático para estatísticas por vendedor
vendaSchema.statics.estatisticasPorVendedor = function(vendedorId, filtroMes = null) {
  const pipeline = [
    { $match: { vendedorId: vendedorId, ativo: true } }
  ];
  
  // Adicionar filtro por mês se fornecido
  if (filtroMes) {
    const [ano, mes] = filtroMes.split('-');
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    
    pipeline.push({
      $match: {
        dataVenda: {
          $gte: inicioMes,
          $lte: fimMes
        }
      }
    });
  }
  
  pipeline.push({
    $group: {
      _id: null,
      totalVendas: { $sum: 1 },
      faturamentoTotal: { $sum: '$valor' },
      ticketMedio: { $avg: '$valor' },
      conectados: {
        $sum: { $cond: [{ $eq: ['$status', 'instalado'] }, 1, 0] }
      },
      pendentes: {
        $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
      },
      andamento: {
        $sum: { $cond: [{ $eq: ['$status', 'andamento'] }, 1, 0] }
      },
      cancelados: {
        $sum: { $cond: [{ $eq: ['$status', 'cancelado'] }, 1, 0] }
      }
    }
  });
  
  return this.aggregate(pipeline);
};

// Método estático para estatísticas gerais
vendaSchema.statics.estatisticasGerais = function(filtroMes = null) {
  const pipeline = [
    { $match: { ativo: true } }
  ];
  
  // Adicionar filtro por mês se fornecido
  if (filtroMes) {
    const [ano, mes] = filtroMes.split('-');
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    
    pipeline.push({
      $match: {
        dataVenda: {
          $gte: inicioMes,
          $lte: fimMes
        }
      }
    });
  }
  
  pipeline.push({
    $group: {
      _id: null,
      totalVendas: { $sum: 1 },
      faturamentoTotal: { $sum: '$valor' },
      ticketMedio: { $avg: '$valor' },
      conectados: {
        $sum: { $cond: [{ $eq: ['$status', 'instalado'] }, 1, 0] }
      },
      pendentes: {
        $sum: { $cond: [{ $eq: ['$status', 'pendente'] }, 1, 0] }
      },
      andamento: {
        $sum: { $cond: [{ $eq: ['$status', 'andamento'] }, 1, 0] }
      },
      cancelados: {
        $sum: { $cond: [{ $eq: ['$status', 'cancelado'] }, 1, 0] }
      },
      vendedoresAtivos: { $addToSet: '$vendedorId' }
    }
  });
  
  pipeline.push({
    $addFields: {
      vendedoresAtivos: { $size: '$vendedoresAtivos' }
    }
  });
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Venda', vendaSchema); 