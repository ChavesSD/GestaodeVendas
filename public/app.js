// Variáveis globais
let vendedores = [];
let vendedorAtual = null;
let vendas = [];
let vendaEditando = null;
let filtroMesAtivo = '';
let filtroMesAtivoHome = '';

// API Base URL
const API_BASE = '/api';

// Elementos DOM
const pages = {
    home: document.getElementById('page-home'),
    vendedores: document.getElementById('page-vendedores'),
    dashboard: document.getElementById('page-dashboard')
};

const navButtons = {
    home: document.getElementById('btn-home'),
    vendedores: document.getElementById('btn-vendedores')
};

const modals = {
    vendedor: document.getElementById('modal-vendedor'),
    loginVendedor: document.getElementById('modal-login-vendedor'),
    venda: document.getElementById('modal-venda')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    showPage('home');
    loadVendedores();
    
    // Aguardar um pouco para garantir que o servidor esteja pronto
    setTimeout(() => {
        updateHomeStats();
    }, 500);
}

// Event Listeners
function setupEventListeners() {
    // Navegação
    navButtons.home.addEventListener('click', () => showPage('home'));
    navButtons.vendedores.addEventListener('click', () => showPage('vendedores'));
    
    // Botões principais
    document.getElementById('btn-novo-vendedor').addEventListener('click', () => showModal('vendedor'));
    document.getElementById('btn-nova-venda').addEventListener('click', () => showModalVenda());
    document.getElementById('btn-voltar').addEventListener('click', () => showPage('vendedores'));
    
    // Filtros do dashboard do vendedor
    document.getElementById('btn-aplicar-filtro').addEventListener('click', aplicarFiltro);
    document.getElementById('btn-limpar-filtro').addEventListener('click', limparFiltro);
    
    // Filtros da página inicial
    document.getElementById('btn-aplicar-filtro-home').addEventListener('click', aplicarFiltroHome);
    document.getElementById('btn-limpar-filtro-home').addEventListener('click', limparFiltroHome);
    
    // Modais
    setupModalEvents();
    
    // Formulários
    document.getElementById('form-vendedor').addEventListener('submit', handleVendedorSubmit);
    document.getElementById('form-login-vendedor').addEventListener('submit', handleLoginVendedor);
    document.getElementById('form-venda').addEventListener('submit', handleVendaSubmit);
    
    // Consultas API
    document.getElementById('btn-consultar-cnpj').addEventListener('click', consultarCNPJ);
    document.getElementById('btn-consultar-cep').addEventListener('click', consultarCEP);
}

function setupModalEvents() {
    // Fechar modais
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Fechar modal clicando fora - incluir todos os modais
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModals();
        });
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });
    
    // Event listener específico para botão cancelar do modal de login
    const btnCancelarLogin = document.querySelector('#modal-login-vendedor .btn-secondary');
    if (btnCancelarLogin) {
        btnCancelarLogin.addEventListener('click', closeModals);
    }
}

// Navegação
function showPage(page) {
    // Ocultar todas as páginas
    Object.values(pages).forEach(p => p.classList.remove('active'));
    
    // Desativar todos os botões de navegação
    Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
    
    // Mostrar página solicitada
    pages[page].classList.add('active');
    
    // Ativar botão correspondente
    if (navButtons[page]) {
        navButtons[page].classList.add('active');
    }
    
    // Carregar dados específicos da página
    switch(page) {
        case 'home':
            updateHomeStats();
            break;
        case 'vendedores':
            loadVendedores();
            break;
        case 'dashboard':
            if (vendedorAtual) {
                loadDashboard(vendedorAtual.id);
            }
            break;
    }
}

// Modais
function showModal(modalName, data = null) {
    const modal = modals[modalName];
    if (modal) {
        if (modalName === 'vendedor' && data) {
            // Pré-preencher dados se estiver editando
            document.getElementById('vendedor-nome').value = data.nome || '';
            document.getElementById('vendedor-email').value = data.email || '';
            document.getElementById('vendedor-telefone').value = data.telefone || '';
        }
        modal.classList.add('active');
    }
}

function showModalVenda(venda = null) {
    vendaEditando = venda;
    const modal = modals.venda;
    const title = document.getElementById('modal-venda-title');
    
    title.textContent = venda ? 'Editar Venda' : 'Nova Venda';
    
    // Limpar ou pré-preencher formulário
    const form = document.getElementById('form-venda');
    if (venda) {
        document.getElementById('venda-id').value = venda.id;
        document.getElementById('venda-vendedor-id').value = venda.vendedorId;
        document.getElementById('venda-codigo').value = venda.codigo;
        document.getElementById('venda-nome').value = venda.nomeCompleto;
        document.getElementById('venda-cpf-cnpj').value = venda.cpfCnpj;
        document.getElementById('venda-nascimento').value = venda.dataNascimento;
        document.getElementById('venda-plano').value = venda.planoNegociado;
        document.getElementById('venda-contato').value = venda.contato;
        document.getElementById('venda-endereco').value = venda.endereco;
        document.getElementById('venda-valor').value = venda.valor;
        document.getElementById('venda-data-venda').value = venda.dataVenda;
        document.getElementById('venda-data-instalacao').value = venda.dataInstalacao;
        document.getElementById('venda-status').value = venda.status;
        document.getElementById('venda-observacoes').value = venda.observacoes;
    } else {
        form.reset();
        document.getElementById('venda-vendedor-id').value = vendedorAtual?.id || '';
        document.getElementById('venda-data-venda').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('active');
    
    // Aplicar máscaras
    setTimeout(() => {
        applyCpfCnpjMask();
        applyCepMask();
    }, 100);
}

function closeModals() {
    // Fechar todos os modais
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.classList.remove('active');
    });
    
    vendaEditando = null;
    
    // Limpar formulário de vendedor
    const formVendedor = document.getElementById('form-vendedor');
    if (formVendedor) {
        formVendedor.reset();
    }
    
    // Limpar formulário de login
    const formLogin = document.getElementById('form-login-vendedor');
    if (formLogin) {
        formLogin.reset();
    }
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert('Erro na comunicação com o servidor: ' + error.message);
        throw error;
    }
}

// Vendedores
async function loadVendedores() {
    try {
        vendedores = await apiRequest('/vendedores');
        renderVendedores();
    } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
    }
}

function renderVendedores() {
    const grid = document.getElementById('vendedores-grid');
    
    if (vendedores.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666; margin-bottom: 0.5rem;">Nenhum vendedor cadastrado</h3>
                <p style="color: #999;">Clique em "Novo Vendedor" para começar</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = vendedores.map(vendedor => `
        <div class="vendedor-card">
            <div class="vendedor-header">
                <div class="vendedor-avatar">
                    ${escapeHtml(vendedor.nome.charAt(0).toUpperCase())}
                </div>
                <div class="vendedor-info">
                    <h3>${escapeHtml(vendedor.nome)}</h3>
                    <p>${escapeHtml(vendedor.email)}</p>
                    <p>${escapeHtml(vendedor.telefone)}</p>
                </div>
            </div>
            
            <div class="vendedor-stats" id="stats-${vendedor.id}">
                <div class="vendedor-stat">
                    <div class="number">0</div>
                    <div class="label">Vendas</div>
                </div>
                <div class="vendedor-stat">
                    <div class="number">R$ 0</div>
                    <div class="label">Faturamento</div>
                </div>
            </div>
            
            <div class="vendedor-actions">
                <button class="btn btn-primary" onclick="solicitarLoginVendedor('${vendedor.id}', '${vendedor.nome}')">
                    <i class="fas fa-sign-in-alt"></i> Acessar
                </button>
                <button class="btn btn-danger" onclick="excluirVendedor('${vendedor.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Carregar estatísticas de cada vendedor
    vendedores.forEach(vendedor => {
        loadVendedorStats(vendedor.id);
    });
}

async function loadVendedorStats(vendedorId) {
    try {
        const stats = await apiRequest(`/dashboard/${vendedorId}`);
        const statsElement = document.getElementById(`stats-${vendedorId}`);
        
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="vendedor-stat">
                    <div class="number">${stats.totalVendas}</div>
                    <div class="label">Vendas</div>
                </div>
                <div class="vendedor-stat">
                    <div class="number">R$ ${formatCurrency(stats.valorTotal)}</div>
                    <div class="label">Faturamento</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas do vendedor:', error);
    }
}

async function handleVendedorSubmit(e) {
    e.preventDefault();
    
    const nome = sanitizeInput(document.getElementById('vendedor-nome').value);
    const email = sanitizeInput(document.getElementById('vendedor-email').value);
    const telefone = sanitizeInput(document.getElementById('vendedor-telefone').value);
    const senha = document.getElementById('vendedor-senha').value;
    const confirmarSenha = document.getElementById('vendedor-confirmar-senha').value;
    
    // Validações de segurança
    if (!nome || nome.length < 2) {
        alert('Nome deve ter pelo menos 2 caracteres!');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Email deve ter um formato válido!');
        return;
    }
    
    if (!isValidBrazilianPhone(telefone)) {
        alert('Telefone deve ter um formato válido!');
        return;
    }
    
    if (!isStrongPassword(senha)) {
        alert('A senha deve ter pelo menos 6 caracteres, incluindo:\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número');
        return;
    }
    
    if (senha !== confirmarSenha) {
        alert('As senhas não conferem!');
        return;
    }
    
    const formData = {
        nome: nome,
        email: email,
        telefone: telefone,
        senha: senha
    };
    
    try {
        console.log('📤 Enviando dados do vendedor:', {
            ...formData,
            senha: '[REDACTED]'
        });
        
        const response = await apiRequest('/vendedores', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('✅ Vendedor criado com sucesso:', response);
        
        closeModals();
        loadVendedores();
        updateHomeStats();
        
        alert('Vendedor cadastrado com sucesso!');
    } catch (error) {
        console.error('❌ Erro detalhado ao cadastrar vendedor:', error);
        
        // Tratar diferentes tipos de erro
        if (error.message.includes('Email já cadastrado')) {
            alert('❌ Este email já está cadastrado!');
        } else if (error.message.includes('Telefone deve ter um formato válido')) {
            alert('❌ Telefone inválido! Use formato: (11) 99999-9999');
        } else if (error.message.includes('Dados inválidos')) {
            alert('❌ Dados inválidos. Verifique todos os campos.');
        } else if (error.message.includes('Senha deve conter')) {
            alert('❌ Senha deve ter maiúscula, minúscula e número.');
        } else {
            alert('❌ Erro ao cadastrar vendedor: ' + error.message);
        }
    }
}

async function excluirVendedor(vendedorId) {
    const vendedor = vendedores.find(v => v.id === vendedorId);
    const nomeVendedor = vendedor ? vendedor.nome : 'vendedor';
    
    if (!confirm(`Tem certeza que deseja excluir ${nomeVendedor}? Todas as vendas também serão removidas.`)) {
        return;
    }
    
    // Solicitar senha para confirmação
    const senha = prompt(`Digite a senha de ${nomeVendedor} para confirmar a exclusão:`);
    if (!senha) {
        alert('Exclusão cancelada - senha é obrigatória.');
        return;
    }
    
    try {
        await apiRequest(`/vendedores/${vendedorId}`, {
            method: 'DELETE',
            body: JSON.stringify({ senha: senha })
        });
        
        loadVendedores();
        updateHomeStats();
        
        alert('Vendedor excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir vendedor:', error);
        if (error.message.includes('Senha incorreta')) {
            alert('Erro: Senha incorreta!');
        } else {
            alert('Erro ao excluir vendedor: ' + error.message);
        }
    }
}

function solicitarLoginVendedor(vendedorId, nomeVendedor) {
    // Fechar qualquer modal que esteja aberto
    closeModals();
    
    // Aguardar um pouco e então abrir o modal de login
    setTimeout(() => {
        const modal = document.getElementById('modal-login-vendedor');
        const titulo = document.getElementById('login-vendedor-title');
        
        if (!modal || !titulo) {
            console.error('Modal de login não encontrado!');
            return;
        }
        
        document.getElementById('login-vendedor-id').value = vendedorId;
        titulo.textContent = `Acesso ao Dashboard - ${nomeVendedor}`;
        document.getElementById('login-senha').value = '';
        
        modal.classList.add('active');
        
        // Focar no campo senha
        const senhaInput = document.getElementById('login-senha');
        if (senhaInput) {
            setTimeout(() => senhaInput.focus(), 100);
        }
    }, 100);
}

async function handleLoginVendedor(e) {
    e.preventDefault();
    
    const vendedorId = document.getElementById('login-vendedor-id').value;
    const senha = document.getElementById('login-senha').value;
    
    try {
        const response = await apiRequest('/vendedores/login', {
            method: 'POST',
            body: JSON.stringify({
                vendedorId: vendedorId,
                senha: senha
            })
        });
        
        if (response.success) {
            // Login bem-sucedido
            closeModals();
            abrirDashboard(vendedorId);
        } else {
            alert('Senha incorreta!');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
}

function abrirDashboard(vendedorId) {
    vendedorAtual = vendedores.find(v => v.id === vendedorId);
    filtroMesAtivo = '';
    document.getElementById('filtro-mes').value = '';
    showPage('dashboard');
}

// Dashboard
async function loadDashboard(vendedorId) {
    try {
        const [stats, vendasData] = await Promise.all([
            apiRequest(`/dashboard/${vendedorId}${filtroMesAtivo ? `?mes=${filtroMesAtivo}` : ''}`),
            apiRequest(`/vendas/${vendedorId}${filtroMesAtivo ? `?mes=${filtroMesAtivo}` : ''}`)
        ]);
        
        vendas = vendasData;
        
        // Atualizar título
        const periodoTexto = filtroMesAtivo ? ` - ${formatarMesPeriodo(filtroMesAtivo)}` : '';
        document.getElementById('dashboard-title').textContent = 
            `Dashboard - ${vendedorAtual.nome}${periodoTexto}`;
        
        // Renderizar estatísticas
        renderDashboardStats(stats);
        
        // Renderizar tabela de vendas
        renderVendasTable();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function renderDashboardStats(stats) {
    const container = document.getElementById('dashboard-stats');
    
    // Calcular estatísticas dos novos status
    const cancelados = stats.vendasPorStatus['Cancelado'] || 0;
    const pendentes = stats.vendasPorStatus['Pendente'] || 0;
    const conectados = stats.vendasPorStatus['Instalado'] || 0;
    const emAndamento = stats.vendasPorStatus['Em Andamento'] || 0;
    
    container.innerHTML = `
        <div class="dashboard-stat total">
            <div class="stat-icon">
                <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">${stats.totalVendas}</div>
                <div class="stat-label">Total de Vendas</div>
            </div>
        </div>
        
        <div class="dashboard-stat revenue">
            <div class="stat-icon">
                <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">R$ ${formatCurrency(stats.valorTotal)}</div>
                <div class="stat-label">Faturamento Total</div>
            </div>
        </div>
        
        <div class="dashboard-stat average">
            <div class="stat-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">R$ ${formatCurrency(stats.ticketMedio)}</div>
                <div class="stat-label">Ticket Médio</div>
            </div>
        </div>
        
        <div class="dashboard-stat connected">
            <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">${conectados}</div>
                <div class="stat-label">Conectados</div>
            </div>
        </div>
        
        <div class="dashboard-stat pending">
            <div class="stat-icon">
                <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">${pendentes}</div>
                <div class="stat-label">Pendentes</div>
            </div>
        </div>
        
        <div class="dashboard-stat infra">
            <div class="stat-icon">
                <i class="fas fa-cogs"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">${emAndamento}</div>
                <div class="stat-label">Infra</div>
            </div>
        </div>
        
        <div class="dashboard-stat cancelled">
            <div class="stat-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-content">
                <div class="stat-value">${cancelados}</div>
                <div class="stat-label">Cancelados</div>
            </div>
        </div>
    `;
}

// Funções de filtro do dashboard do vendedor
function aplicarFiltro() {
    const mes = document.getElementById('filtro-mes').value;
    const ano = document.getElementById('filtro-ano').value;
    
    // Montar filtro no formato YYYY-MM se ambos estiverem selecionados
    if (mes && ano) {
        filtroMesAtivo = `${ano}-${mes}`;
    } else if (ano) {
        filtroMesAtivo = ano; // Para filtrar apenas por ano
    } else {
        filtroMesAtivo = '';
    }
    
    if (vendedorAtual) {
        loadDashboard(vendedorAtual.id);
    }
}

function limparFiltro() {
    filtroMesAtivo = '';
    document.getElementById('filtro-mes').value = '';
    document.getElementById('filtro-ano').value = '';
    
    if (vendedorAtual) {
        loadDashboard(vendedorAtual.id);
    }
}

// Funções de filtro da página inicial
function aplicarFiltroHome() {
    const mes = document.getElementById('filtro-mes-home').value;
    const ano = document.getElementById('filtro-ano-home').value;
    
    // Montar filtro no formato YYYY-MM se ambos estiverem selecionados
    if (mes && ano) {
        filtroMesAtivoHome = `${ano}-${mes}`;
    } else if (ano) {
        filtroMesAtivoHome = ano; // Para filtrar apenas por ano
    } else {
        filtroMesAtivoHome = '';
    }
    
    updateHomeStats();
}

function limparFiltroHome() {
    filtroMesAtivoHome = '';
    document.getElementById('filtro-mes-home').value = '';
    document.getElementById('filtro-ano-home').value = '';
    updateHomeStats();
}

function formatarMesPeriodo(mesAno) {
    if (!mesAno) return '';
    
    // Se for apenas ano (formato YYYY)
    if (mesAno.length === 4 && !mesAno.includes('-')) {
        return mesAno;
    }
    
    // Se for mês e ano (formato YYYY-MM)
    const [ano, mes] = mesAno.split('-');
    if (mes) {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${meses[parseInt(mes) - 1]} ${ano}`;
    }
    
    return mesAno;
}

function renderVendasTable() {
    const tbody = document.querySelector('#vendas-table tbody');
    
    if (vendas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhuma venda registrada para este vendedor${filtroMesAtivo ? ' no período selecionado' : ''}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = vendas.map(venda => `
        <tr>
            <td>${venda.codigo}</td>
            <td>${venda.nomeCompleto}</td>
            <td>${venda.cpfCnpj}</td>
            <td>${venda.planoNegociado}</td>
            <td>R$ ${formatCurrency(venda.valor)}</td>
            <td>${formatDate(venda.dataVenda)}</td>
            <td>
                <span class="status-badge status-${venda.status.toLowerCase().replace(' ', '-')}">
                    ${venda.status}
                </span>
            </td>
            <td>
                <button class="btn btn-warning" onclick="editarVenda('${venda.id}')" style="margin-right: 0.5rem;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="excluirVenda('${venda.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Vendas
async function handleVendaSubmit(e) {
    e.preventDefault();
    
    const formData = {
        vendedorId: document.getElementById('venda-vendedor-id').value,
        codigo: document.getElementById('venda-codigo').value,
        nomeCompleto: document.getElementById('venda-nome').value,
        cpfCnpj: document.getElementById('venda-cpf-cnpj').value,
        dataNascimento: document.getElementById('venda-nascimento').value,
        planoNegociado: document.getElementById('venda-plano').value,
        contato: document.getElementById('venda-contato').value,
        endereco: document.getElementById('venda-endereco').value,
        valor: document.getElementById('venda-valor').value,
        dataVenda: document.getElementById('venda-data-venda').value,
        dataInstalacao: document.getElementById('venda-data-instalacao').value,
        status: document.getElementById('venda-status').value,
        observacoes: document.getElementById('venda-observacoes').value
    };
    
    try {
        if (vendaEditando) {
            // Editar venda existente
            await apiRequest(`/vendas/${vendaEditando.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            alert('Venda atualizada com sucesso!');
        } else {
            // Criar nova venda
            await apiRequest('/vendas', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('Venda cadastrada com sucesso!');
        }
        
        closeModals();
        loadDashboard(vendedorAtual.id);
        updateHomeStats();
        
    } catch (error) {
        console.error('Erro ao salvar venda:', error);
    }
}

function editarVenda(vendaId) {
    const venda = vendas.find(v => v.id === vendaId);
    if (venda) {
        showModalVenda(venda);
    }
}

async function excluirVenda(vendaId) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) {
        return;
    }
    
    try {
        await apiRequest(`/vendas/${vendaId}`, {
            method: 'DELETE'
        });
        
        loadDashboard(vendedorAtual.id);
        updateHomeStats();
        
        alert('Venda excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir venda:', error);
    }
}

// Estatísticas da página inicial
async function updateHomeStats() {
    console.log('📊 Carregando estatísticas da página inicial...');
    
    try {
        const url = `/dashboard-geral${filtroMesAtivoHome ? `?mes=${filtroMesAtivoHome}` : ''}`;
        console.log('🔗 URL da requisição:', url);
        
        // Buscar estatísticas gerais com filtro
        const statsGerais = await apiRequest(url);
        console.log('✅ Dados recebidos:', statsGerais);
        
        // Atualizar título com período
        const periodoTexto = filtroMesAtivoHome ? ` - ${formatarMesPeriodo(filtroMesAtivoHome)}` : '';
        document.getElementById('home-title').textContent = 
            `Dashboard Geral${periodoTexto}`;
        
        // Renderizar cards de estatísticas
        renderHomeStats(statsGerais);
        
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas gerais:', error);
        
        // Em caso de erro, mostrar dados vazios
        const statsVazias = {
            totalVendedores: 0,
            totalVendas: 0,
            valorTotal: 0,
            ticketMedio: 0,
            conectados: 0,
            pendentes: 0,
            cancelados: 0,
            infra: 0
        };
        
        renderHomeStats(statsVazias);
    }
}

function renderHomeStats(data) {
    const statsContainer = document.getElementById('home-stats');
    if (!statsContainer) return;

    const stats = [
        { icon: '👥', label: 'Vendedores Ativos', value: data.vendedores || 0, class: 'total' },
        { icon: '🛒', label: 'Total de Vendas', value: data.vendas || 0, class: 'revenue' },
        { icon: '💰', label: 'Faturamento Total', value: formatCurrency(data.faturamento || 0), class: 'average' },
        { icon: '📈', label: 'Ticket Médio', value: formatCurrency(data.ticketMedio || 0), class: 'connected' },
        { icon: '✅', label: 'Conectados', value: data.conectados || 0, class: 'pending' },
        { icon: '⏰', label: 'Pendentes', value: data.pendentes || 0, class: 'infra' },
        { icon: '⚙️', label: 'Infra', value: data.infra || 0, class: 'cancelled' },
        { icon: '❌', label: 'Cancelados', value: data.cancelados || 0, class: 'total' }
    ];

    statsContainer.innerHTML = stats.map(stat => `
        <div class="dashboard-stat ${stat.class}">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-content">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Validação de CPF com dígitos verificadores
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
    return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

// Validação de CNPJ com dígitos verificadores
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    return resultado === parseInt(digitos.charAt(1));
}

// Consulta CPF/CNPJ com validação aprimorada
async function consultarCNPJ() {
    const input = document.getElementById('venda-cpf-cnpj');
    const valor = input.value.replace(/\D/g, '');
    
    // Detectar se é CPF ou CNPJ
    if (valor.length === 11) {
        // É CPF - fazer validação local
        if (!validarCPF(valor)) {
            showMessage('❌ CPF inválido. Verifique os dígitos verificadores.', 'error');
            return;
        }
        showMessage('✅ CPF válido! ℹ️ Consulta automática de dados pessoais não disponível por questões de privacidade (LGPD).', 'info');
        return;
    }
    
    if (valor.length !== 14) {
        showMessage('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido', 'error');
        return;
    }
    
    // É CNPJ - validar dígitos verificadores
    if (!validarCNPJ(valor)) {
        showMessage('❌ CNPJ inválido. Verifique os dígitos verificadores.', 'error');
        return;
    }
    
    const btnConsultar = document.getElementById('btn-consultar-cnpj');
    const originalText = btnConsultar.innerHTML;
    
    try {
        // Mostrar loading
        btnConsultar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
        btnConsultar.disabled = true;
        
        const response = await fetch(`/api/consulta-cnpj/${valor}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao consultar CNPJ');
        }
        
        // Preencher campos automaticamente
        document.getElementById('venda-nome').value = data.nome || data.razaoSocial;
        document.getElementById('venda-cpf-cnpj').value = formatCNPJ(data.cnpj);
        document.getElementById('venda-contato').value = data.telefone;
        
        // Montar endereço completo
        if (data.endereco) {
            const endereco = [
                data.endereco.logradouro,
                data.endereco.numero,
                data.endereco.complemento,
                data.endereco.bairro,
                data.endereco.municipio,
                data.endereco.uf
            ].filter(item => item && item.trim() !== '').join(', ');
            
            document.getElementById('venda-endereco').value = endereco;
            document.getElementById('venda-cep').value = formatCEP(data.endereco.cep);
        }
        
        showMessage('Dados da empresa consultados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao consultar CNPJ:', error);
        showMessage(error.message, 'error');
    } finally {
        // Restaurar botão
        btnConsultar.innerHTML = originalText;
        btnConsultar.disabled = false;
    }
}

// Consulta CEP no ViaCEP
async function consultarCEP() {
    const cepInput = document.getElementById('venda-cep');
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        showMessage('CEP deve conter 8 dígitos', 'error');
        return;
    }
    
    const btnConsultar = document.getElementById('btn-consultar-cep');
    const originalText = btnConsultar.innerHTML;
    
    try {
        // Mostrar loading
        btnConsultar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        btnConsultar.disabled = true;
        
        const response = await fetch(`/api/consulta-cep/${cep}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao consultar CEP');
        }
        
        // Preencher campos automaticamente
        document.getElementById('venda-cep').value = formatCEP(data.cep);
        document.getElementById('venda-endereco').value = data.endereco;
        
        showMessage('Endereço encontrado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao consultar CEP:', error);
        showMessage(error.message, 'error');
    } finally {
        // Restaurar botão
        btnConsultar.innerHTML = originalText;
        btnConsultar.disabled = false;
    }
}

// Mostrar mensagens para o usuário
function showMessage(message, type = 'info') {
    // Remover mensagens anteriores
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    // Inserir a mensagem no formulário
    const form = document.getElementById('form-venda');
    form.insertBefore(messageDiv, form.firstChild);
    
    // Remover a mensagem após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Formatação de CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Formatação de CEP
function formatCEP(cep) {
    if (!cep) return '';
    return cep.replace(/^(\d{5})(\d{3})/, '$1-$2');
}

// Máscara para CPF/CNPJ
function applyCpfCnpjMask() {
    const input = document.getElementById('venda-cpf-cnpj');
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            // Máscara CPF: 000.000.000-00
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
        } else {
            // Máscara CNPJ: 00.000.000/0000-00
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        
        e.target.value = value;
    });
}

// Máscara para CEP
function applyCepMask() {
    const input = document.getElementById('venda-cep');
    
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

// Funções globais para os event handlers inline
window.abrirDashboard = abrirDashboard;
window.excluirVendedor = excluirVendedor;
window.editarVenda = editarVenda;
window.excluirVenda = excluirVenda;

// Função de segurança para escapar HTML e prevenir XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Função para sanitizar dados de entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para validar senha forte
function isStrongPassword(password) {
    // Mínimo 6 caracteres, pelo menos 1 maiúscula, 1 minúscula e 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
}

// Função para validar telefone brasileiro
function isValidBrazilianPhone(phone) {
    const phoneRegex = /^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
} 