const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mongoose = require('mongoose');

// Importações MongoDB
const { connectDB, migrarDadosExistentes } = require('./database');
const Vendedor = require('./models/Vendedor');
const Venda = require('./models/Venda');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de Segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar CSP temporariamente para Railway
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requests por IP por janela de tempo
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP
    message: {
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    skipSuccessfulRequests: true,
});

// Aplicar rate limiting
app.use('/api/', limiter);
app.use('/api/vendedores/login', loginLimiter);

// CORS configuração mais restritiva
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://gestaodevendas-production-da9a.up.railway.app'] // Domínio do Railway
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware de parsing com limite de tamanho
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Middleware para validação de erros
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors.array()
        });
    }
    next();
};

// Função para sanitizar logs (não exibir senhas)
const sanitizeForLog = (obj) => {
    const sanitized = { ...obj };
    if (sanitized.senha) sanitized.senha = '[REDACTED]';
    if (sanitized.password) sanitized.password = '[REDACTED]';
    return sanitized;
};

// Dados em memória (fallback se MongoDB não estiver disponível)
let vendedores = [];
let vendas = [];

// Variável para controlar se está usando MongoDB
let usandoMongoDB = false;

// Inicializar MongoDB e migrar dados
const inicializarBanco = async () => {
  try {
    console.log('🔄 Inicializando conexão com MongoDB...');
    console.log('🔍 MONGO_URI:', process.env.MONGO_URI ? 'Configurada' : 'NÃO configurada');
    
    const conexao = await connectDB();
    
    if (conexao) {
      usandoMongoDB = true;
      console.log('✅ MongoDB inicializado com sucesso!');
      console.log('✅ usandoMongoDB =', usandoMongoDB);
      
      // Verificar se há documentos no banco
      try {
        const vendedoresCount = await Vendedor.countDocuments();
        const vendasCount = await Venda.countDocuments();
        console.log(`📊 Documentos existentes: ${vendedoresCount} vendedores, ${vendasCount} vendas`);
      } catch (countError) {
        console.error('❌ Erro ao contar documentos:', countError.message);
      }
      
      // Migrar dados existentes se houver
      if (vendedores.length > 0 || vendas.length > 0) {
        console.log(`🔄 Migrando dados: ${vendedores.length} vendedores, ${vendas.length} vendas`);
        await migrarDadosExistentes(vendedores, vendas);
        // Limpar arrays em memória após migração
        vendedores = [];
        vendas = [];
      }
    } else {
      console.log('⚠️  Usando dados em memória como fallback');
      console.log('⚠️  usandoMongoDB =', usandoMongoDB);
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    console.log('⚠️  Continuando com dados em memória');
    console.log('⚠️  usandoMongoDB =', usandoMongoDB);
  }
};

// Inicializar banco ao startar o servidor
inicializarBanco();

// Função helper para filtrar vendas por mês
function filtrarVendasPorMes(vendasArray, mes) {
    if (!mes) return vendasArray;
    
    return vendasArray.filter(venda => {
        if (!venda.dataVenda) return false;
        const dataVenda = venda.dataVenda.substring(0, 7); // YYYY-MM
        return dataVenda === mes;
    });
}

// Rotas para servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de debug para verificar status do sistema
app.get('/api/debug/status', async (req, res) => {
    try {
        let vendedoresMongoDB = 0;
        let vendasMongoDB = 0;
        
        if (usandoMongoDB) {
            vendedoresMongoDB = await Vendedor.countDocuments({});
            vendasMongoDB = await Venda.countDocuments({});
        }
        
        res.json({
            usandoMongoDB,
            mongoDBStatus: usandoMongoDB ? 'connected' : 'not_connected',
            vendedoresMemoria: vendedores.length,
            vendasMemoria: vendas.length,
            vendedoresMongoDB,
            vendasMongoDB
        });
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ error: 'Erro ao verificar status' });
    }
});

// ROTA TEMPORÁRIA - Excluir TODOS os vendedores do banco
app.get('/api/debug/limpar-todos-vendedores', async (req, res) => {
    try {
        if (usandoMongoDB) {
            const vendedoresExcluidos = await Vendedor.deleteMany({});
            const vendasExcluidas = await Venda.deleteMany({});
            
            res.json({
                message: 'Banco limpo com sucesso!',
                vendedoresExcluidos: vendedoresExcluidos.deletedCount,
                vendasExcluidas: vendasExcluidas.deletedCount
            });
        } else {
            vendedores.length = 0;
            vendas.length = 0;
            res.json({
                message: 'Dados em memória limpos!',
                vendedoresExcluidos: 0,
                vendasExcluidas: 0
            });
        }
    } catch (error) {
        console.error('Erro ao limpar banco:', error);
        res.status(500).json({ error: error.message });
    }
});

// API Routes

// Consulta CNPJ na Receita Federal
app.get('/api/consulta-cnpj/:cnpj', async (req, res) => {
    try {
        const cnpj = req.params.cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
        
        // Validação básica do CNPJ
        if (cnpj.length !== 14) {
            return res.status(400).json({ error: 'CNPJ deve conter 14 dígitos' });
        }
        
        // Consulta na API da Receita Federal (ReceitaWS)
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
        const data = await response.json();
        
        if (data.status === 'ERROR') {
            return res.status(404).json({ error: data.message || 'CNPJ não encontrado' });
        }
        
        // Formatar dados para o padrão do sistema
        const dadosFormatados = {
            nome: data.nome || data.fantasia || '',
            razaoSocial: data.nome || '',
            cnpj: data.cnpj || '',
            situacao: data.situacao || '',
            endereco: {
                logradouro: data.logradouro || '',
                numero: data.numero || '',
                complemento: data.complemento || '',
                bairro: data.bairro || '',
                municipio: data.municipio || '',
                uf: data.uf || '',
                cep: data.cep || ''
            },
            telefone: data.telefone || '',
            email: data.email || '',
            atividadePrincipal: data.atividade_principal?.[0]?.text || '',
            dataAbertura: data.abertura || '',
            capitalSocial: data.capital_social || ''
        };
        
        res.json(dadosFormatados);
        
    } catch (error) {
        console.error('Erro ao consultar CNPJ:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao consultar CNPJ' });
    }
});

// Consulta CEP (ViaCEP)
app.get('/api/consulta-cep/:cep', async (req, res) => {
    try {
        const cep = req.params.cep.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            return res.status(400).json({ error: 'CEP deve conter 8 dígitos' });
        }
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            return res.status(404).json({ error: 'CEP não encontrado' });
        }
        
        res.json({
            cep: data.cep,
            logradouro: data.logradouro,
            complemento: data.complemento,
            bairro: data.bairro,
            localidade: data.localidade,
            uf: data.uf,
            endereco: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
        });
        
    } catch (error) {
        console.error('Erro ao consultar CEP:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao consultar CEP' });
    }
});

// Vendedores
app.get('/api/vendedores', async (req, res) => {
    try {
        if (usandoMongoDB) {
            // Usar MongoDB - a transformação toJSON já remove a senha
            const vendedoresDB = await Vendedor.find({ ativo: true }).sort({ createdAt: -1 });
            res.json(vendedoresDB);
        } else {
            // Fallback para dados em memória
            const vendedoresSemSenha = vendedores.map(vendedor => {
                const { senha, ...vendedorSemSenha } = vendedor;
                return vendedorSemSenha;
            });
            res.json(vendedoresSemSenha);
        }
    } catch (error) {
        console.error('❌ Erro ao buscar vendedores:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ROTA TEMPORÁRIA DE DEBUG - listar todos os vendedores
app.get('/api/debug/vendedores-todos', async (req, res) => {
    try {
        if (usandoMongoDB) {
            const todosVendedores = await Vendedor.find({}).sort({ createdAt: -1 });
            res.json(todosVendedores.map(v => ({
                id: v.id,
                nome: v.nome,
                email: v.email,
                ativo: v.ativo,
                createdAt: v.createdAt
            })));
        } else {
            res.json(vendedores.map(v => ({
                id: v.id,
                nome: v.nome,
                email: v.email,
                ativo: v.ativo || 'undefined'
            })));
        }
    } catch (error) {
        console.error('❌ Erro ao buscar todos vendedores:', error);
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/vendedores', [
    body('nome').isLength({ min: 2, max: 100 }).trim().escape()
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email').isEmail().normalizeEmail()
        .withMessage('Email deve ter um formato válido'),
    body('telefone').isLength({ min: 10, max: 15 }).matches(/^[\d\s\(\)\-\+]+$/)
        .withMessage('Telefone deve conter entre 10 e 15 dígitos'),
    body('senha').isLength({ min: 6, max: 128 })
        .withMessage('Senha deve ter entre 6 e 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
    handleValidationErrors
], async (req, res) => {
    try {
        console.log('Tentativa de cadastro de vendedor:', sanitizeForLog(req.body));
        
        if (usandoMongoDB) {
            // Usar MongoDB
            // Verificar se email já existe
            const emailExistente = await Vendedor.findOne({ email: req.body.email });
            if (emailExistente) {
                return res.status(409).json({ error: 'Email já cadastrado' });
            }
            
            // Criptografar senha
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(req.body.senha, saltRounds);
            
            const novoVendedor = new Vendedor({
                nome: req.body.nome,
                email: req.body.email,
                telefone: req.body.telefone,
                senha: hashedPassword
            });
            
            const vendedorSalvo = await novoVendedor.save();
            console.log('Vendedor criado com sucesso no MongoDB:', vendedorSalvo.id);
            res.status(201).json(vendedorSalvo);
            
        } else {
            // Fallback para dados em memória
            // Verificar se email já existe
            const emailExistente = vendedores.find(v => v.email === req.body.email);
            if (emailExistente) {
                return res.status(409).json({ error: 'Email já cadastrado' });
            }
            
            // Criptografar senha
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(req.body.senha, saltRounds);
            
            const novoVendedor = {
                id: uuidv4(),
                nome: req.body.nome,
                email: req.body.email,
                telefone: req.body.telefone,
                senha: hashedPassword,
                dataInclusao: new Date().toISOString(),
                ultimoLogin: null,
                tentativasLogin: 0
            };
            
            vendedores.push(novoVendedor);
            
            // Retornar vendedor sem a senha
            const { senha, ...vendedorSemSenha } = novoVendedor;
            console.log('Vendedor criado com sucesso em memória:', vendedorSemSenha.id);
            res.status(201).json(vendedorSemSenha);
        }
    } catch (error) {
        console.error('Erro ao criar vendedor:', error.message);
        
        // Tratar erros de validação do Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: 'Dados inválidos', details: errors });
        }
        
        // Tratar erro de email duplicado
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login do Vendedor
app.post('/api/vendedores/login', [
    body('vendedorId').isUUID().withMessage('ID do vendedor inválido'),
    body('senha').isLength({ min: 1 }).withMessage('Senha é obrigatória'),
    handleValidationErrors
], async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    try {
        const { vendedorId, senha } = req.body;
        console.log(`Tentativa de login - Vendedor: ${vendedorId}, IP: ${clientIP}`);
        
        if (usandoMongoDB) {
            // Usar MongoDB
            const vendedor = await Vendedor.findOne({ id: vendedorId });
            if (!vendedor) {
                console.log(`Login falhado: Vendedor não encontrado - ${vendedorId}`);
                return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            }
            
            // Verificar se conta está bloqueada
            if (vendedor.estaBloqueado()) {
                console.log(`Login bloqueado: Conta bloqueada - Vendedor: ${vendedorId}`);
                return res.status(429).json({ 
                    success: false, 
                    error: 'Conta temporariamente bloqueada devido a tentativas excessivas' 
                });
            }
            
            // Verificar se muitas tentativas recentes
            if (vendedor.tentativasLogin >= 5) {
                await vendedor.bloquear(30); // Bloquear por 30 minutos
                console.log(`Login bloqueado: Muitas tentativas - Vendedor: ${vendedorId}`);
                return res.status(429).json({ 
                    success: false, 
                    error: 'Conta bloqueada por 30 minutos devido a tentativas excessivas' 
                });
            }
            
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, vendedor.senha);
            if (!senhaValida) {
                vendedor.tentativasLogin += 1;
                await vendedor.save();
                
                console.log(`Login falhado: Senha incorreta - Vendedor: ${vendedorId}, Tentativas: ${vendedor.tentativasLogin}`);
                return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            }
            
            // Login bem-sucedido
            await vendedor.resetarTentativas();
            console.log(`Login bem-sucedido (MongoDB) - Vendedor: ${vendedorId}, IP: ${clientIP}`);
            res.json({ success: true, message: 'Login realizado com sucesso' });
            
        } else {
            // Fallback para dados em memória
            const vendedor = vendedores.find(v => v.id === vendedorId);
            if (!vendedor) {
                console.log(`Login falhado: Vendedor não encontrado - ${vendedorId}`);
                return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            }
            
            // Verificar se conta está bloqueada por tentativas excessivas
            if (vendedor.tentativasLogin >= 5) {
                const ultimaTentativa = new Date(vendedor.ultimaTentativaLogin || 0);
                const agora = new Date();
                const minutosEspera = 30;
                
                if (agora - ultimaTentativa < minutosEspera * 60 * 1000) {
                    console.log(`Login bloqueado: Muitas tentativas - Vendedor: ${vendedorId}`);
                    return res.status(429).json({ 
                        success: false, 
                        error: `Conta bloqueada por ${minutosEspera} minutos devido a tentativas excessivas` 
                    });
                } else {
                    // Reset contador após período de espera
                    vendedor.tentativasLogin = 0;
                }
            }
            
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, vendedor.senha);
            if (!senhaValida) {
                // Incrementar tentativas falhadas
                vendedor.tentativasLogin = (vendedor.tentativasLogin || 0) + 1;
                vendedor.ultimaTentativaLogin = new Date().toISOString();
                
                console.log(`Login falhado: Senha incorreta - Vendedor: ${vendedorId}, Tentativas: ${vendedor.tentativasLogin}`);
                return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            }
            
            // Login bem-sucedido - reset tentativas e atualizar último login
            vendedor.tentativasLogin = 0;
            vendedor.ultimoLogin = new Date().toISOString();
            vendedor.ultimaTentativaLogin = null;
            
            console.log(`Login bem-sucedido (memória) - Vendedor: ${vendedorId}, IP: ${clientIP}`);
            res.json({ success: true, message: 'Login realizado com sucesso' });
        }
    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para exclusão de vendedor com confirmação de senha
app.delete('/api/vendedores/:id', [
    body('senha').isLength({ min: 1 }).withMessage('Senha é obrigatória para exclusão'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { senha } = req.body;
        
        if (usandoMongoDB) {
            // Usar MongoDB
            const vendedor = await Vendedor.findOne({ id: req.params.id });
            if (!vendedor) {
                return res.status(404).json({ error: 'Vendedor não encontrado' });
            }
            
            // Verificar senha do vendedor
            const senhaValida = await bcrypt.compare(senha, vendedor.senha);
            if (!senhaValida) {
                console.log(`Tentativa de exclusão com senha incorreta - Vendedor: ${req.params.id}`);
                return res.status(401).json({ error: 'Senha incorreta' });
            }
            
            // Excluir vendas do vendedor primeiro (hard delete)
            const vendasExcluidas = await Venda.deleteMany({ vendedorId: req.params.id });
            console.log(`${vendasExcluidas.deletedCount} vendas excluídas para o vendedor ${req.params.id}`);
            
            // Excluir vendedor definitivamente (hard delete)
            await Vendedor.deleteOne({ id: req.params.id });
            
            console.log(`Vendedor ${req.params.id} excluído com sucesso`);
            res.status(204).send();
            
        } else {
            // Fallback para dados em memória
            const vendedor = vendedores.find(v => v.id === req.params.id);
            if (!vendedor) {
                return res.status(404).json({ error: 'Vendedor não encontrado' });
            }
            
            // Verificar senha do vendedor
            const senhaValida = await bcrypt.compare(senha, vendedor.senha);
            if (!senhaValida) {
                console.log(`Tentativa de exclusão com senha incorreta - Vendedor: ${req.params.id}`);
                return res.status(401).json({ error: 'Senha incorreta' });
            }
            
            const index = vendedores.findIndex(v => v.id === req.params.id);
            if (index !== -1) {
                vendedores.splice(index, 1);
                // Remover também as vendas deste vendedor
                vendas = vendas.filter(venda => venda.vendedorId !== req.params.id);
                console.log(`Vendedor ${req.params.id} excluído com sucesso`);
                res.status(204).send();
            }
        }
    } catch (error) {
        console.error('Erro ao excluir vendedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Vendas com suporte a filtro por mês
app.get('/api/vendas/:vendedorId', async (req, res) => {
    try {
        const { mes } = req.query;
        
        if (usandoMongoDB) {
            // Usar MongoDB com filtro otimizado
            let query = { vendedorId: req.params.vendedorId, ativo: true };
            
            // Adicionar filtro por mês se fornecido
            if (mes) {
                const [ano, mesNum] = mes.split('-');
                const inicioMes = new Date(ano, mesNum - 1, 1);
                const fimMes = new Date(ano, mesNum, 0, 23, 59, 59, 999);
                
                query.dataVenda = {
                    $gte: inicioMes,
                    $lte: fimMes
                };
            }
            
            const vendasVendedor = await Venda.find(query).sort({ dataVenda: -1 });
            
            // Mapear campos do MongoDB para os nomes esperados pelo frontend
            const vendasMapeadas = vendasVendedor.map(venda => ({
                id: venda.id,
                vendedorId: venda.vendedorId,
                codigo: venda.codigo || '',
                nomeCompleto: venda.cliente,
                cpfCnpj: venda.cpfCnpj,
                planoNegociado: venda.produto,
                contato: venda.telefone,
                endereco: venda.endereco,
                valor: venda.valor,
                dataVenda: venda.dataVenda,
                status: venda.status,
                observacoes: venda.observacoes
            }));
            
            res.json(vendasMapeadas);
            
        } else {
            // Fallback para dados em memória
            let vendasVendedor = vendas.filter(venda => venda.vendedorId === req.params.vendedorId);
            
            // Aplicar filtro por mês se fornecido
            vendasVendedor = filtrarVendasPorMes(vendasVendedor, mes);
            
            res.json(vendasVendedor);
        }
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/vendas', async (req, res) => {
    try {
        if (usandoMongoDB) {
            // Usar MongoDB
            const novaVenda = new Venda({
                vendedorId: req.body.vendedorId,
                codigo: req.body.codigo,
                cliente: req.body.nomeCompleto,
                cpfCnpj: req.body.cpfCnpj,
                telefone: req.body.contato,
                endereco: req.body.endereco,
                produto: req.body.planoNegociado,
                valor: parseFloat(req.body.valor),
                dataVenda: req.body.dataVenda || new Date(),
                status: req.body.status || 'pendente',
                observacoes: req.body.observacoes
            });
            
            const vendaSalva = await novaVenda.save();
            console.log('Nova venda criada no MongoDB:', vendaSalva.id);
            
            // Mapear campos para o frontend
            const vendaMapeada = {
                id: vendaSalva.id,
                vendedorId: vendaSalva.vendedorId,
                codigo: vendaSalva.codigo || '',
                nomeCompleto: vendaSalva.cliente,
                cpfCnpj: vendaSalva.cpfCnpj,
                planoNegociado: vendaSalva.produto,
                contato: vendaSalva.telefone,
                endereco: vendaSalva.endereco,
                valor: vendaSalva.valor,
                dataVenda: vendaSalva.dataVenda,
                status: vendaSalva.status,
                observacoes: vendaSalva.observacoes
            };
            
            res.status(201).json(vendaMapeada);
            
        } else {
            // Fallback para dados em memória
            const novaVenda = {
                id: uuidv4(),
                vendedorId: req.body.vendedorId,
                codigo: req.body.codigo,
                nomeCompleto: req.body.nomeCompleto,
                cpfCnpj: req.body.cpfCnpj,
                dataNascimento: req.body.dataNascimento,
                planoNegociado: req.body.planoNegociado,
                contato: req.body.contato,
                endereco: req.body.endereco,
                valor: parseFloat(req.body.valor),
                dataVenda: req.body.dataVenda,
                dataInstalacao: req.body.dataInstalacao,
                status: req.body.status,
                observacoes: req.body.observacoes,
                dataCriacao: new Date().toISOString()
            };
            
            vendas.push(novaVenda);
            res.status(201).json(novaVenda);
        }
    } catch (error) {
        console.error('Erro ao criar venda:', error);
        
        // Tratar erros de validação do Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: 'Dados inválidos', details: errors });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/vendas/:id', async (req, res) => {
    try {
        if (usandoMongoDB) {
            // Usar MongoDB - atualização
            const vendaAtualizada = await Venda.findOneAndUpdate(
                { id: req.params.id },
                {
                    codigo: req.body.codigo,
                    cliente: req.body.nomeCompleto,
                    cpfCnpj: req.body.cpfCnpj,
                    telefone: req.body.contato,
                    endereco: req.body.endereco,
                    produto: req.body.planoNegociado,
                    valor: parseFloat(req.body.valor),
                    dataVenda: req.body.dataVenda,
                    status: req.body.status,
                    observacoes: req.body.observacoes
                },
                { new: true }
            );
            
            if (!vendaAtualizada) {
                return res.status(404).json({ error: 'Venda não encontrada' });
            }
            
            console.log(`Venda ${req.params.id} atualizada com sucesso`);
            
            // Mapear campos para o frontend
            const vendaMapeada = {
                id: vendaAtualizada.id,
                vendedorId: vendaAtualizada.vendedorId,
                codigo: vendaAtualizada.codigo || '',
                nomeCompleto: vendaAtualizada.cliente,
                cpfCnpj: vendaAtualizada.cpfCnpj,
                planoNegociado: vendaAtualizada.produto,
                contato: vendaAtualizada.telefone,
                endereco: vendaAtualizada.endereco,
                valor: vendaAtualizada.valor,
                dataVenda: vendaAtualizada.dataVenda,
                status: vendaAtualizada.status,
                observacoes: vendaAtualizada.observacoes
            };
            
            res.json(vendaMapeada);
            
        } else {
            // Fallback para dados em memória
            const index = vendas.findIndex(v => v.id === req.params.id);
            if (index !== -1) {
                vendas[index] = {
                    ...vendas[index],
                    codigo: req.body.codigo,
                    nomeCompleto: req.body.nomeCompleto,
                    cpfCnpj: req.body.cpfCnpj,
                    dataNascimento: req.body.dataNascimento,
                    planoNegociado: req.body.planoNegociado,
                    contato: req.body.contato,
                    endereco: req.body.endereco,
                    valor: parseFloat(req.body.valor),
                    dataVenda: req.body.dataVenda,
                    dataInstalacao: req.body.dataInstalacao,
                    status: req.body.status,
                    observacoes: req.body.observacoes
                };
                res.json(vendas[index]);
            } else {
                res.status(404).json({ error: 'Venda não encontrada' });
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/vendas/:id', async (req, res) => {
    try {
        if (usandoMongoDB) {
            // Usar MongoDB - exclusão definitiva
            const vendaExcluida = await Venda.deleteOne({ id: req.params.id });
            
            if (vendaExcluida.deletedCount === 0) {
                return res.status(404).json({ error: 'Venda não encontrada' });
            }
            
            console.log(`Venda ${req.params.id} excluída com sucesso`);
            res.status(204).send();
            
        } else {
            // Fallback para dados em memória
            const index = vendas.findIndex(v => v.id === req.params.id);
            if (index !== -1) {
                vendas.splice(index, 1);
                res.status(204).send();
            } else {
                res.status(404).json({ error: 'Venda não encontrada' });
            }
        }
    } catch (error) {
        console.error('Erro ao excluir venda:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Estatísticas para dashboard com suporte a filtro por mês
app.get('/api/dashboard/:vendedorId', async (req, res) => {
    try {
        const { mes } = req.query;
        
        if (usandoMongoDB) {
            // Usar MongoDB com agregações otimizadas
            const stats = await Venda.estatisticasPorVendedor(req.params.vendedorId, mes);
            
            if (stats.length === 0) {
                return res.json({
                    totalVendas: 0,
                    valorTotal: 0,
                    ticketMedio: 0,
                    conectados: 0,
                    pendentes: 0,
                    infra: 0,
                    cancelados: 0,
                    vendasPorStatus: {
                        'CONECTADO': 0,
                        'PENDENTE': 0,
                        'INFRA': 0,
                        'CANCELADO': 0
                    },
                    periodo: mes || 'todos'
                });
            }
            
            const result = stats[0];
            res.json({
                totalVendas: result.totalVendas,
                valorTotal: result.faturamentoTotal,
                ticketMedio: result.ticketMedio,
                conectados: result.conectados,
                pendentes: result.pendentes,
                infra: result.infra,
                cancelados: result.cancelados,
                vendasPorStatus: {
                    'CONECTADO': result.conectados,
                    'PENDENTE': result.pendentes,
                    'INFRA': result.infra,
                    'CANCELADO': result.cancelados
                },
                periodo: mes || 'todos'
            });
            
        } else {
            // Fallback para dados em memória
            let vendasVendedor = vendas.filter(venda => venda.vendedorId === req.params.vendedorId);
            
            // Aplicar filtro por mês se fornecido
            vendasVendedor = filtrarVendasPorMes(vendasVendedor, mes);
            
            const totalVendas = vendasVendedor.length;
            const valorTotal = vendasVendedor.reduce((total, venda) => total + venda.valor, 0);
            const vendasPorStatus = vendasVendedor.reduce((acc, venda) => {
                acc[venda.status] = (acc[venda.status] || 0) + 1;
                return acc;
            }, {});
            
            const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
            
            res.json({
                totalVendas,
                valorTotal,
                ticketMedio,
                vendasPorStatus,
                periodo: mes || 'todos'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Estatísticas gerais para dashboard da página inicial
app.get('/api/dashboard-geral', async (req, res) => {
    try {
        const { mes } = req.query;
        
        if (usandoMongoDB) {
            // Usar MongoDB com agregações otimizadas
            const stats = await Venda.estatisticasGerais(mes);
            const totalVendedores = await Vendedor.countDocuments({ ativo: true });
            
            if (stats.length === 0) {
                return res.json({
                    totalVendedores,
                    totalVendas: 0,
                    valorTotal: 0,
                    ticketMedio: 0,
                    conectados: 0,
                    pendentes: 0,
                    cancelados: 0,
                    infra: 0,
                    periodo: mes || 'todos'
                });
            }
            
            const result = stats[0];
            res.json({
                totalVendedores,
                totalVendas: result.totalVendas,
                valorTotal: result.faturamentoTotal,
                ticketMedio: result.ticketMedio,
                conectados: result.conectados,
                pendentes: result.pendentes,
                cancelados: result.cancelados,
                infra: result.infra,
                vendedoresAtivos: result.vendedoresAtivos,
                periodo: mes || 'todos'
            });
            
        } else {
            // Fallback para dados em memória
            // Obter todas as vendas
            let todasVendas = [...vendas];
            
            // Aplicar filtro por mês se fornecido
            todasVendas = filtrarVendasPorMes(todasVendas, mes);
            
            const totalVendedores = vendedores.length;
            const totalVendas = todasVendas.length;
            const valorTotal = todasVendas.reduce((total, venda) => total + venda.valor, 0);
            const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
            
            // Contar vendas por status
            const vendasPorStatus = todasVendas.reduce((acc, venda) => {
                acc[venda.status] = (acc[venda.status] || 0) + 1;
                return acc;
            }, {});
            
            const conectados = vendasPorStatus['Instalado'] || 0;
            const pendentes = vendasPorStatus['Pendente'] || 0;
            const cancelados = vendasPorStatus['Cancelado'] || 0;
            const infra = vendasPorStatus['Em Andamento'] || 0;
            
            res.json({
                totalVendedores,
                totalVendas,
                valorTotal,
                ticketMedio,
                conectados,
                pendentes,
                cancelados,
                infra,
                periodo: mes || 'todos'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas gerais:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
}); 