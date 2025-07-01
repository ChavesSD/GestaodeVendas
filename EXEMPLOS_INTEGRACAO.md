# Exemplos de Integração com APIs Externas

Este documento demonstra como usar as funcionalidades de integração com a Receita Federal e ViaCEP no sistema de controle de vendas.

## 🆔 Validação de CPF - Local

### Como funciona:
1. Abra o formulário de "Nova Venda"
2. Digite o CPF no campo "CPF/CNPJ" (apenas números ou com máscara)
3. Clique no botão "Consultar CNPJ" 
4. O sistema detecta automaticamente que é um CPF e faz a validação

### Exemplo de CPF para teste:
```
123.456.789-09  # CPF válido para demonstração
111.111.111-11  # CPF inválido (todos dígitos iguais)
```

### O que é validado:
- **Formato correto**: xxx.xxx.xxx-xx
- **Dígitos verificadores**: Cálculo matemático dos dois últimos dígitos
- **CPFs inválidos**: Detecta sequências como 111.111.111-11
- **Quantidade de dígitos**: Deve ter exatamente 11 dígitos

### Mensagens do sistema:
- ✅ **CPF válido**: "CPF válido! Consulta automática não disponível por questões de privacidade (LGPD)"
- ❌ **CPF inválido**: "CPF inválido. Verifique os dígitos verificadores"

### ⚠️ Limitações do CPF:
```
❌ Consulta automática não disponível (LGPD)
❌ Preenchimento automático não implementado
✅ Validação completa de dígitos verificadores
✅ Máscara automática durante digitação
💡 Para consulta automática: APIs pagas (ver CONSULTA_CPF_OPCOES.md)
```

## 🏢 Consulta de CNPJ - Receita Federal

### Como usar:
1. Abra o formulário de "Nova Venda"
2. Digite o CNPJ no campo "CPF/CNPJ" (apenas números ou com máscara)
3. Clique no botão "Consultar" ao lado do campo
4. Os dados da empresa serão preenchidos automaticamente

### Exemplo de CNPJ para teste:
```
11.222.333/0001-81  # CNPJ fictício para demonstração
```

### Campos preenchidos automaticamente:
- **Nome Completo/Razão Social**: Nome da empresa
- **CPF/CNPJ**: Formatado com máscara
- **Contato**: Telefone da empresa (se disponível)
- **Endereço**: Endereço completo da empresa
- **CEP**: CEP da empresa

### Exemplo de retorno da API:
```json
{
  "nome": "EMPRESA EXEMPLO LTDA",
  "razaoSocial": "EMPRESA EXEMPLO LTDA",
  "cnpj": "11.222.333/0001-81",
  "situacao": "ATIVA",
  "endereco": {
    "logradouro": "RUA DAS FLORES",
    "numero": "123",
    "bairro": "CENTRO",
    "municipio": "SÃO PAULO",
    "uf": "SP",
    "cep": "01234-567"
  },
  "telefone": "(11) 1234-5678",
  "atividadePrincipal": "Atividades de consultoria em gestão empresarial"
}
```

## 🏠 Consulta de CEP - ViaCEP

### Como usar:
1. No formulário de "Nova Venda"
2. Digite o CEP no campo "CEP" (apenas números ou com máscara)
3. Clique no botão "Buscar" ao lado do campo
4. O endereço será preenchido automaticamente

### Exemplo de CEP para teste:
```
01310-100  # CEP da Avenida Paulista, São Paulo
```

### Campos preenchidos automaticamente:
- **CEP**: Formatado com máscara (xxxxx-xxx)
- **Endereço Completo**: Logradouro, bairro, cidade e estado

### Exemplo de retorno da API:
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "endereco": "Avenida Paulista, Bela Vista, São Paulo - SP"
}
```

## 🎭 Máscaras Automáticas

### CPF/CNPJ:
- **CPF**: 000.000.000-00
- **CNPJ**: 00.000.000/0000-00
- A máscara é aplicada automaticamente conforme o usuário digita

### CEP:
- **Formato**: 00000-000
- Aceita apenas números, aplica máscara automaticamente

## 🔧 Endpoints da API

### Consultar CNPJ:
```http
GET /api/consulta-cnpj/11222333000181
```

### Consultar CEP:
```http
GET /api/consulta-cep/01310100
```

## ⚠️ Tratamento de Erros

### Cenários de erro:

1. **CNPJ Inválido**:
   - Menos de 14 dígitos
   - CNPJ não encontrado na Receita Federal
   - Empresa com situação irregular

2. **CEP Inválido**:
   - Menos de 8 dígitos
   - CEP não encontrado nos Correios

3. **APIs Indisponíveis**:
   - Falha na conexão
   - Timeout de resposta
   - Rate limiting

### Mensagens de erro exibidas:
- "CNPJ deve conter 14 dígitos"
- "CNPJ não encontrado"
- "CEP deve conter 8 dígitos"
- "CEP não encontrado"
- "Erro interno do servidor..."

## 🚀 Melhorias Futuras

### Para CPF:
- Integração com APIs pagas (Serasa, SPC)
- Validação de dígitos verificadores
- Consulta de situação cadastral

### Para CNPJ:
- Cache local de consultas
- API de backup (consulta.gov.br)
- Histórico de alterações

### Gerais:
- Offline mode com cache
- Validação avançada de dados
- Log de consultas realizadas

## 📝 Notas Importantes

1. **LGPD**: A consulta de CPF não é implementada por questões de privacidade
2. **Rate Limiting**: As APIs gratuitas podem ter limitações de consultas por minuto
3. **Fallback**: O sistema funciona normalmente mesmo se as APIs estiverem indisponíveis
4. **Validação**: Sempre valide os dados retornados antes de usar em produção

---

**💡 Dica**: Teste as funcionalidades com dados reais para verificar a qualidade das informações retornadas pelas APIs. 