# 💼 CLT AI — Dashboard de Finanças Pessoais

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript">
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma">
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss">
</p>

---

## 📖 Sobre o Projeto

**CLT AI** é uma aplicação web **full stack** de finanças pessoais, desenvolvida para trabalhadores **CLT**, com foco em **visualização de ganhos em tempo real**, organização financeira e persistência de dados por usuário.

O sistema calcula automaticamente quanto o usuário está ganhando **por segundo**, com base em salário e jornada de trabalho, além de permitir o controle de **despesas**, **investimentos** e **patrimônio** em um dashboard moderno e seguro.

---

## 🎯 Objetivo

- Demonstrar uma arquitetura **full stack moderna**  
- Implementar autenticação segura via **OAuth 2.0 (Google)**  
- Persistir dados financeiros por usuário  
- Aplicar boas práticas com **Next.js, React e Prisma**  
- Criar uma base escalável para aplicações financeiras  

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Login com **Google OAuth 2.0**
- Sessões gerenciadas com **NextAuth.js**
- Isolamento total de dados por usuário

### 💰 Simulação Financeira
- Cálculo de ganhos **em tempo real (por segundo)**
- Salário diário, semanal e mensal
- Atualização instantânea no frontend

### 📊 Dashboard
- Visão geral do patrimônio
- Valores consolidados de ganhos e gastos
- Interface moderna e responsiva

### 💸 Despesas
- Registro e categorização de gastos
- Histórico financeiro por usuário

### 📈 Investimentos
- Cadastro de investimentos
- Cálculo de rendimento anual
- Consolidação no patrimônio total

### 🔒 Privacidade
- Modo de ocultação de valores sensíveis
- Controle total pelo usuário

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Finalidade |
|----------|-----------|
| Next.js 15 | Framework React |
| React 18 | Interface do usuário |
| TypeScript | Tipagem estática |
| Tailwind CSS | Estilização |
| shadcn/ui + Radix | Componentes acessíveis |

### Backend
| Tecnologia | Finalidade |
|----------|-----------|
| Next.js API Routes | Backend REST |
| NextAuth.js | Autenticação OAuth |
| Zod | Validação de dados |

### Banco de Dados
| Tecnologia | Finalidade |
|----------|-----------|
| PostgreSQL | Persistência dos dados |
| Prisma ORM | Acesso e modelagem |

---

## 🏗️ Arquitetura do Sistema

```text
[ Navegador do Usuário ]
           |
           v
[ Frontend (Next.js + React) ]
           |
           v
[ API REST (Next.js API Routes) ]
           |
           v
[ Prisma ORM ]
           |
           v
[ Banco PostgreSQL ]
```

### 🏗️ Decisão Arquitetural

A lógica de **cálculo em tempo real** é executada no **frontend** para:

- evitar chamadas excessivas à API  
- garantir maior fluidez da interface  
- reduzir latência e custo computacional no backend  

O backend é responsável apenas por **autenticação, validação e persistência**.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+  
- PostgreSQL (local ou cloud)  
- Conta no Google Cloud (OAuth)  

---

### 1️⃣ Clone o repositório
```bash
git clone https://github.com/ricardaoquadros-jpg/CLTAI.git
cd CLTAI
```
### 2️⃣ Instale as dependências

```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente
- Crie o arquivo .env.local na raiz do projeto:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cltai?schema=public"

NEXTAUTH_SECRET="gere-um-secret"
NEXTAUTH_URL="http://localhost:9002"

GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```
### 4️⃣ Configure o banco de dados
```bash
npx prisma generate
npx prisma db push
```

### 5️⃣ Inicie o projeto
```bash
npm run dev
Acesse: http://localhost:9002
```

--- 

### 📁 Estrutura do Projeto
```bash
src/
├─ app/
│ ├─ api/
│ │ ├─ auth/
│ │ ├─ transactions/
│ │ └─ investments/
│ ├─ dashboard/
│ └─ page.tsx
├─ components/
│ ├─ dashboard/
│ └─ ui/
├─ services/
│ └─ api.ts
├─ lib/
│ ├─ auth.ts
│ ├─ prisma.ts
│ └─ utils.ts
└─ types/

prisma/
└─ schema.prisma
```

## 🔐 Segurança

- ✔ Autenticação via OAuth 2.0  
- ✔ Isolamento de dados por usuário  
- ✔ Validação de entrada com Zod  
- ✔ Credenciais protegidas por variáveis de ambiente  
- ✔ Sessões verificadas em todas as rotas da API  

---

## 🚧 Próximos Passos

- Testes automatizados  
- Gráficos de evolução financeira  
- Metas e alertas  
- Exportação de relatórios (PDF / Excel)  
- Suporte a múltiplas moedas  

---

## 🧑‍💻 Autor

**Ricardo Quadros**  
- Estudante de Engenharia da Computação – UERGS  
- Técnico em Informática – E.E.E.M. Dr. Solon Tavares  
- Estagiário de Tecnologia da Informação – Prefeitura de Guaíba  
- Guaíba, RS – Brasil  

---

## 📫 Contato

- GitHub: https://github.com/ricardaoquadros-jpg  
- Email: ricardaoquadros@gmail.com  
- LinkedIn: https://www.linkedin.com/in/ricardopquadros/
