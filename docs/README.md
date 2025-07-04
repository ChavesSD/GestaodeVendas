# Gestão de Vendas

Um sistema completo para controle de vendas desenvolvido com HTML, CSS, JavaScript e Node.js, utilizando arquitetura SPA (Single Page Application).

## 🚀 Funcionalidades

- **Gerenciamento de Vendedores**: Cadastro, visualização e exclusão de vendedores
- **Sistema de Autenticação**: Cada vendedor possui senha criptografada para acesso seguro
- **Dashboard Geral**: Dashboard na página inicial com estatísticas consolidadas de todos os vendedores
- **Dashboard Individual**: Cada vendedor possui seu próprio dashboard com estatísticas específicas (protegido por senha)
- **Dashboard Avançado**: Cards coloridos com métricas específicas (Total, Conectados, Pendentes, Infra, Cancelados)
- **Filtro por Mês**: Visualize dados de qualquer mês específico em ambos os dashboards
- **Controle de Vendas**: Cadastro completo de vendas com todos os campos necessários
- **Validação Inteligente de CPF**: Validação completa com dígitos verificadores
- **Integração com Receita Federal**: Consulta automática de dados via CNPJ
- **Consulta de CEP**: Preenchimento automático de endereço via ViaCEP
- **Máscaras Automáticas**: Formatação de CPF/CNPJ e CEP em tempo real
- **Detecção Automática**: Sistema identifica se é CPF ou CNPJ automaticamente
- **Estatísticas em Tempo Real**: Visualização de métricas importantes
- **Interface Responsiva**: Design moderno que funciona em desktop e mobile

## 📊 Dashboard Avançado

### Dashboard Geral (Página Inicial):
- **👥 Vendedores Ativos**: Total de vendedores cadastrados
- **🛒 Total de Vendas**: Quantidade total de vendas de todos os vendedores
- **💰 Faturamento Total**: Valor total em reais de toda a empresa
- **📈 Ticket Médio**: Valor médio por venda (global)
- **✅ Conectados**: Total de vendas com status "Instalado"
- **⏰ Pendentes**: Total de vendas com status "Pendente"
- **⚙️ Infra**: Total de vendas com status "Em Andamento"
- **❌ Cancelados**: Total de vendas com status "Cancelado"

### Dashboard Individual (Por Vendedor):
- **🛒 Total de Vendas**: Quantidade de vendas do vendedor específico
- **💰 Faturamento Total**: Valor total em reais do vendedor
- **📈 Ticket Médio**: Valor médio por venda do vendedor
- **✅ Conectados**: Vendas do vendedor com status "Instalado"
- **⏰ Pendentes**: Vendas do vendedor com status "Pendente"
- **⚙️ Infra**: Vendas do vendedor com status "Em Andamento"
- **❌ Cancelados**: Vendas do vendedor com status "Cancelado"

### Filtro por Mês (Ambos os Dashboards):
- Selecione qualquer mês de 2024 para visualizar dados específicos
- Botão "Aplicar Filtro" para aplicar o período selecionado
- Botão "Limpar" para voltar à visualização completa
- Título do dashboard mostra o período selecionado
- Funciona tanto na página inicial quanto no dashboard individual

## 📋 Campos de Venda

Cada venda contém as seguintes informações:
- Código
- Nome Completo / Razão Social
- CPF/CNPJ
- Data de Nascimento
- Plano Negociado
- Contato
- Endereço
- Valor
- Data da Venda
- Data da Instalação
- Status (Pendente, Em Andamento, Instalado, Cancelado)
- Observações

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Segurança**: bcryptjs para criptografia de senhas
- **Estilização**: CSS Grid, Flexbox, Gradientes, Backdrop Filter
- **Icons**: Font Awesome
- **APIs Externas**: ReceitaWS (CNPJ), ViaCEP (Endereços)
- **HTTP Client**: node-fetch
- **Responsividade**: Mobile-first design

## 📦 Instalação

1. **Clone o repositório ou crie os arquivos**:
   ```bash
   mkdir controle-de-vendas
   cd controle-de-vendas
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor**:
   ```bash
   npm start
   ```
   
   Ou para desenvolvimento com auto-reload:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**:
   Abra seu navegador e vá para `http://localhost:3000`

5. **Teste as integrações**:
   Consulte o arquivo `EXEMPLOS_INTEGRACAO.md` para ver exemplos de uso das APIs da Receita Federal e ViaCEP

## 🎯 Como Usar

### 1. Página Inicial
- Visualize estatísticas gerais do sistema
- Total de vendedores, vendas e faturamento

### 2. Gerenciar Vendedores
- Clique em "Vendedores" no menu
- Use "Novo Vendedor" para cadastrar
- Cada card de vendedor mostra estatísticas básicas
- Clique em "Dashboard" para ver detalhes específicos

### 3. Dashboard Geral (Página Inicial)
- Dashboard completo com métricas de todos os vendedores
- Cards coloridos com estatísticas específicas
- Filtro por mês para análises temporais
- Visualização consolidada do desempenho geral

### 4. Dashboard do Vendedor
- Visualize estatísticas detalhadas do vendedor
- Use o filtro por mês para análises específicas
- Adicione novas vendas com "Nova Venda"
- Edite ou exclua vendas existentes
- Monitore status das vendas com cards coloridos

### 5. Cadastro de Vendas
- Preencha todos os campos obrigatórios
- Selecione o status apropriado
- Use observações para informações adicionais

### 6. Sistema de Autenticação

#### Cadastro de Vendedores:
- Cada vendedor deve criar uma senha de pelo menos 6 caracteres
- As senhas são criptografadas usando bcryptjs com salt rounds = 10
- Confirmação de senha é obrigatória no cadastro

#### Acesso ao Dashboard:
- Clique em "Acessar" no card do vendedor
- Digite a senha cadastrada para acessar o dashboard individual
- Acesso seguro protegido por autenticação

### 7. Validação de CPF e Consulta de CNPJ
- **Validação CPF**: Digite um CPF e o sistema valida automaticamente os dígitos verificadores
- **Consulta CNPJ**: Digite o CNPJ no campo CPF/CNPJ e clique em "Consultar CNPJ" para buscar dados da empresa automaticamente
- **Consulta CEP**: Digite o CEP no campo correspondente e clique em "Buscar" para preencher o endereço automaticamente
- **Detecção Inteligente**: O sistema detecta automaticamente se você digitou CPF (11 dígitos) ou CNPJ (14 dígitos)
- **Formatação Automática**: CPF/CNPJ e CEP são formatados automaticamente conforme você digita
- **Validação Robusta**: Validação completa de dígitos verificadores para CPF e CNPJ

### 8. Filtros nos Dashboards
- **Dashboard Geral**: Filtro por mês na página inicial para análise temporal de todos os vendedores
- **Dashboard Individual**: Filtro por mês específico para cada vendedor
- **Aplicar Filtro**: Clique para visualizar dados do período selecionado
- **Limpar Filtro**: Volta à visualização completa (todos os dados)
- **Visualização Dinâmica**: Todos os cards e tabelas são atualizados automaticamente

## 🏗️ Estrutura do Projeto

```
controle-de-vendas/
├── server.js                    # Servidor Node.js
├── package.json                 # Dependências do projeto
├── public/                      # Arquivos estáticos
│   ├── index.html              # Página principal
│   ├── styles.css              # Estilos CSS
│   └── app.js                  # JavaScript da aplicação
├── README.md                   # Este arquivo
├── EXEMPLOS_INTEGRACAO.md      # Exemplos de uso das APIs
└── CONSULTA_CPF_OPCOES.md      # Opções para consulta de CPF
```

## 🔧 API Endpoints

### Vendedores
- `GET /api/vendedores` - Listar vendedores (sem senhas)
- `POST /api/vendedores` - Criar vendedor (com senha criptografada)
- `POST /api/vendedores/login` - Autenticar vendedor
- `DELETE /api/vendedores/:id` - Excluir vendedor

### Vendas
- `GET /api/vendas/:vendedorId` - Listar vendas do vendedor
- `GET /api/vendas/:vendedorId?mes=YYYY-MM` - Listar vendas do vendedor filtradas por mês
- `POST /api/vendas` - Criar venda
- `PUT /api/vendas/:id` - Atualizar venda
- `DELETE /api/vendas/:id` - Excluir venda

### Dashboard
- `GET /api/dashboard/:vendedorId` - Estatísticas do vendedor
- `GET /api/dashboard/:vendedorId?mes=YYYY-MM` - Estatísticas filtradas por mês
- `GET /api/dashboard-geral` - Estatísticas gerais de todos os vendedores
- `GET /api/dashboard-geral?mes=YYYY-MM` - Estatísticas gerais filtradas por mês

### Integração com APIs Externas
- `GET /api/consulta-cnpj/:cnpj` - Consulta dados da empresa na Receita Federal
- `GET /api/consulta-cep/:cep` - Consulta endereço no ViaCEP

## 💾 Armazenamento

Atualmente, os dados são armazenados em memória no servidor. Para produção, recomenda-se:
- Implementar banco de dados (MongoDB, PostgreSQL, etc.)
- Adicionar persistência de dados
- Implementar autenticação

## 🎨 Design

O sistema possui um design moderno com:
- Gradientes coloridos
- Efeitos de glassmorphism
- Animações suaves
- Interface intuitiva
- Cards coloridos por categoria
- Design responsivo

## 🚀 Funcionalidades Futuras

- Autenticação de usuários
- Relatórios em PDF
- Gráficos interativos
- Filtros por período personalizado
- Notificações em tempo real
- API de integração
- Backup automático
- Exportação de dados

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## ⚡ Performance

- Carregamento rápido
- Requisições otimizadas
- Interface fluida
- Código modular
- Filtros eficientes

## 🔒 Segurança

Para produção, implemente:
- Validação de dados no backend
- Sanitização de inputs
- Rate limiting
- HTTPS
- Autenticação JWT

## ⚠️ Limitações e Considerações

### Consulta de CPF
- **Validação Completa Implementada**: Validação de dígitos verificadores, formato e detecção de CPFs inválidos
- **Consulta Automática Não Disponível**: Por questões de privacidade e LGPD, não existe API pública gratuita
- **Alternativas Pagas**: Para ambiente corporativo, considere Serasa (R$ 0,30-2,00/consulta) ou SPC (R$ 0,25-1,50/consulta)
- **Documentação Completa**: Consulte `CONSULTA_CPF_OPCOES.md` para detalhes sobre implementação paga

### Consulta de CNPJ
- **API Gratuita**: Utiliza o ReceitaWS (www.receitaws.com.br)
- **Limitações**: Pode ter rate limiting em horários de pico
- **Dados Retornados**: Nome, endereço, situação cadastral, atividade principal
- **Backup**: Em caso de indisponibilidade, os dados podem ser inseridos manualmente

### Dependências Externas
- **ReceitaWS**: Serviço gratuito, mas sem garantias de SLA
- **ViaCEP**: Serviço dos Correios, geralmente estável
- **Fallback**: Sistema funciona normalmente mesmo se as APIs estiverem indisponíveis

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema, consulte a documentação do código ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para controle eficiente de vendas** 