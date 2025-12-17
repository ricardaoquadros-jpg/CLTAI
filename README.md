# CLT AI - Personal Finance Dashboard

<div align="center">
  <h3>🚀 Aplicação web full stack para finanças pessoais com autenticação OAuth, persistência de dados por usuário e frontend moderno em React/Next.js</h3>
  
  ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
  ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=flat-square&logo=postgresql)
  ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
</div>

---

## 📌 Descrição

**CLT AI** é uma aplicação web de finanças pessoais desenvolvida para trabalhadores CLT que desejam acompanhar seus ganhos em tempo real. A aplicação calcula quanto você está ganhando a cada segundo do seu dia de trabalho, baseado no seu salário e horário de expediente.

### Por que esse projeto?

Este projeto foi desenvolvido como demonstração de:
- Autenticação OAuth 2.0 com Google
- Backend API REST com Next.js
- Persistência de dados com PostgreSQL
- Arquitetura full stack limpa e escalável

---

## ✨ Funcionalidades

- **🔐 Login com Google** - Autenticação segura via OAuth 2.0
- **💰 Simulação em Tempo Real** - Veja seus ganhos crescendo a cada segundo
- **📊 Dashboard Completo** - Visualize salário diário, semanal, mensal e patrimônio
- **💸 Registro de Despesas** - Categorize e acompanhe gastos
- **📈 Investimentos** - Registre investimentos com rendimento anual
- **👤 Persistência por Usuário** - Cada usuário tem seus próprios dados
- **🔒 Modo Privacidade** - Esconda valores sensíveis com um clique

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript |
| **Styling** | TailwindCSS, shadcn/ui, Radix UI |
| **Autenticação** | NextAuth.js (Google OAuth) |
| **Backend** | Next.js API Routes |
| **ORM** | Prisma |
| **Banco de Dados** | PostgreSQL |
| **Validação** | Zod |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js + React + TypeScript                                │
│  • Interface do usuário                                      │
│  • Simulação em tempo real (cálculos locais)                │
│  • Consumo da API                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (API REST)                      │
│  Next.js API Routes                                          │
│  • Autenticação via NextAuth                                │
│  • Endpoints para CRUD de dados                             │
│  • Validação com Zod                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BANCO DE DADOS                          │
│  PostgreSQL + Prisma ORM                                     │
│  • Users, FinancialData, Transactions, Investments          │
└─────────────────────────────────────────────────────────────┘
```

### Por que a lógica financeira fica no Frontend?

Os cálculos em tempo real (ganhos por segundo) são executados no cliente por motivos de:
- **Performance**: Atualizações a cada segundo sem latência de rede
- **Responsividade**: UI fluida e imediata
- **Simplicidade**: Backend focado apenas em persistência

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou cloud como [Neon](https://neon.tech), [Supabase](https://supabase.com))
- Conta no [Google Cloud Console](https://console.cloud.google.com) para OAuth

### 1. Clone o repositório

```bash
git clone https://github.com/ricardaoquadros-jpg/CLTAI.git
cd CLTAI
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# PostgreSQL Connection
DATABASE_URL="postgresql://user:password@localhost:5432/cltai?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="gere-um-secret-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:9002"

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

### 4. Configure o banco de dados

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrations
npx prisma db push
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:9002](http://localhost:9002)

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth routes
│   │   ├── me/                   # User data endpoint
│   │   ├── transactions/         # Transactions CRUD
│   │   └── investments/          # Investments CRUD
│   ├── dashboard/                # Main dashboard page
│   └── page.tsx                  # Login page
├── components/
│   ├── dashboard/                # Dashboard components
│   └── ui/                       # shadcn/ui components
├── services/
│   └── api.ts                    # API client service
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # Utility functions
└── types/                        # TypeScript types

prisma/
└── schema.prisma                 # Database schema
```

---

## 🔐 Segurança

- **Isolamento de dados**: Cada usuário acessa apenas seus próprios dados
- **Autorização por sessão**: Todas as rotas API verificam a sessão do usuário
- **Validação de entrada**: Zod em todos os endpoints
- **Variáveis de ambiente**: Credenciais sensíveis em `.env.local`

---

## 📈 Próximos Passos

- [ ] Testes automatizados (Jest + Testing Library)
- [ ] Gráficos de evolução temporal
- [ ] Metas financeiras
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações de gastos
- [ ] Suporte a múltiplas moedas

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

<div align="center">
  <p>Desenvolvido por <a href="https://github.com/ricardaoquadros-jpg">Ricardo Quadros</a></p>
</div>
