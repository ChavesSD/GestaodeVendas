# 🆔 Consulta de CPF - Opções e Limitações

## ❌ **Por que não há consulta automática de CPF?**

### 🔒 **Questões Legais (LGPD)**
- **CPF é dado pessoal sensível** protegido pela Lei Geral de Proteção de Dados
- Consulta automática requer **consentimento explícito** do titular
- Necessita **base legal específica** e **finalidade determinada**
- Violações podem resultar em **multas de até R$ 50 milhões**

### 🚫 **Não existe API pública gratuita**
- Receita Federal **não disponibiliza** consulta pública de CPF
- Dados de pessoas físicas são **confidenciais por lei**
- Diferente do CNPJ que são informações empresariais públicas

## ✅ **O que o Sistema ATUAL oferece para CPF**

### 🎭 **Validação Completa**
```javascript
✅ Formato correto (xxx.xxx.xxx-xx)
✅ Dígitos verificadores matemáticos
✅ Detecção de CPFs inválidos (111.111.111-11)
✅ Máscara automática durante digitação
✅ Feedback visual de validação
```

### 📝 **Exemplo de Validação**
- **CPF Válido**: `123.456.789-09` → ✅ "CPF válido!"
- **CPF Inválido**: `123.456.789-00` → ❌ "CPF inválido. Verifique os dígitos."

## 💰 **Alternativas Pagas para Consulta de CPF**

### 🏦 **1. Serasa Experian**
```
📋 Serviços:
   • Consulta de CPF com situação cadastral
   • Verificação de dados básicos
   • Score de crédito
   • Histórico financeiro

💰 Custo: R$ 0,30 a R$ 2,00 por consulta
🔗 Site: https://developer.serasaexperian.com.br/
```

### 🏦 **2. SPC Brasil**
```
📋 Serviços:
   • Validação de CPF
   • Situação no SPC/Serasa
   • Análise de inadimplência
   • Dados de contato

💰 Custo: R$ 0,25 a R$ 1,50 por consulta
🔗 Site: https://www.spcbrasil.org.br/
```

### 🏦 **3. Receita Federal (Certificado Digital)**
```
📋 Serviços:
   • Consulta oficial de situação
   • Dados cadastrais básicos
   • Situação na Receita Federal

💰 Custo: Certificado A1 (~R$ 120/ano)
⚠️ Limitação: Apenas para o próprio CPF
```

### 🏦 **4. Outros Bureaus de Crédito**
```
🏢 Quod
   • API de validação de CPF
   • Análise de risco
   • Score próprio

🏢 Boa Vista
   • Consulta de CPF
   • Verificação de dados
   • Análise comportamental
```

## ⚖️ **Considerações Legais para Implementação**

### 📜 **Base Legal Necessária**
1. **Consentimento** - Autorização expressa do titular
2. **Contrato** - Execução de contrato do qual o titular é parte
3. **Interesse Legítimo** - Finalidades comerciais válidas
4. **Cumprimento de Obrigação Legal** - Exigência regulatória

### 📋 **Documentação Obrigatória**
- **Política de Privacidade** detalhada
- **Termo de Consentimento** específico
- **Registro de Tratamento** de dados
- **Medidas de Segurança** implementadas

### 🛡️ **Medidas de Proteção**
- **Criptografia** de dados em trânsito e repouso
- **Logs de Auditoria** de todas as consultas
- **Controle de Acesso** restrito
- **Anonimização** quando possível

## 🔧 **Como Implementar (Exemplo com Serasa)**

### 1. **Cadastro e Contratação**
```bash
1. Criar conta no portal developer da Serasa
2. Contratar plano de consultas
3. Obter credenciais de API (client_id, client_secret)
4. Configurar webhook de retorno
```

### 2. **Código de Exemplo**
```javascript
// Endpoint no servidor Node.js
app.post('/api/consulta-cpf-pago', async (req, res) => {
    const { cpf, consentimento } = req.body;
    
    // Verificar consentimento LGPD
    if (!consentimento) {
        return res.status(400).json({
            error: 'Consentimento LGPD obrigatório'
        });
    }
    
    try {
        // Autenticação Serasa
        const token = await getSerasaToken();
        
        // Consulta CPF
        const response = await fetch('https://api.serasaexperian.com.br/cpf', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document: cpf })
        });
        
        const data = await response.json();
        
        // Log da consulta (LGPD)
        await logConsultaCPF(cpf, req.user.id, 'Serasa');
        
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: 'Erro na consulta' });
    }
});
```

### 3. **Interface com Consentimento**
```html
<!-- Modal de Consentimento LGPD -->
<div class="modal-consentimento">
    <h3>Consentimento para Consulta de CPF</h3>
    <p>Para realizar a consulta automática, precisamos do seu consentimento conforme a LGPD:</p>
    
    <ul>
        <li>✅ Consulta de dados básicos na Receita Federal</li>
        <li>✅ Verificação de situação cadastral</li>
        <li>✅ Dados utilizados apenas para este cadastro</li>
        <li>✅ Não compartilhamento com terceiros</li>
    </ul>
    
    <label>
        <input type="checkbox" id="consentimento-lgpd">
        Autorizo a consulta dos meus dados pessoais
    </label>
    
    <button onclick="consultarCPFComConsentimento()">
        Consultar CPF
    </button>
</div>
```

## 🚀 **Implementação Recomendada**

### **Para Ambiente Corporativo:**
1. **Contratar Serasa ou SPC** para consultas automáticas
2. **Implementar consentimento LGPD** adequado
3. **Configurar logs e auditoria** completos
4. **Criar política de privacidade** específica

### **Para Uso Pessoal/Teste:**
1. **Manter validação atual** (dígitos verificadores)
2. **Permitir inserção manual** de dados
3. **Focar na consulta de CNPJ** que é pública
4. **Informar limitações** claramente ao usuário

## 📞 **Contatos para Implementação**

### **Serasa Experian**
- 📧 Email: developers@serasaexperian.com.br
- 📱 Telefone: 0800 772 0808
- 🌐 Portal: developer.serasaexperian.com.br

### **SPC Brasil**
- 📧 Email: atendimento@spcbrasil.org.br
- 📱 Telefone: 0800 800 1022
- 🌐 Site: spcbrasil.org.br

---

## 💡 **Resumo Executivo**

**❌ Consulta Gratuita de CPF**: Não existe por questões legais (LGPD)

**✅ Validação Local**: Implementada com dígitos verificadores

**💰 Consulta Paga**: Disponível via Serasa, SPC (R$ 0,25-2,00/consulta)

**⚖️ Requisito Legal**: Consentimento LGPD obrigatório

**🎯 Recomendação**: Manter sistema atual para uso geral, implementar API paga apenas se necessário comercialmente 