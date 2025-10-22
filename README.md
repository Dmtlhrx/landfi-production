# Hedera Africa - Land Tokenization dApp

Une plateforme complète de tokenisation foncière construite sur Hedera Hashgraph pour le marché africain.

## 🚀 Fonctionnalités

- **Tokenisation HTS**: Transformez vos parcelles en NFT sécurisés
- **Traçabilité HCS**: Historique immuable de toutes les transactions
- **Identité DID**: Système d'identité décentralisée
- **DeFi**: Prêts avec collatéral NFT et liquidité optimisée
- **Marketplace**: Achat/vente de parcelles tokenisées
- **Dashboard**: Analytics et gestion de portefeuille

## 🛠️ Stack Technique

### Frontend
- React 18 + TypeScript
- Vite (build/dev)
- Tailwind CSS + Framer Motion
- Zustand (state management)
- React Router v6
- @react-three/fiber (3D)
- HashPack wallet integration

### Backend
- Node.js 20 + TypeScript
- Fastify + Prisma ORM
- PostgreSQL database
- Hedera SDK (@hashgraph/sdk)
- JWT authentication
- Docker containerization

## 📦 Installation

1. **Cloner et installer les dépendances**:
```bash
pnpm install
```



2. **Configuration de l'environnement**:
```bash
cp .env.example .env
# Éditer .env avec vos clés Hedera
```

3. **Démarrer la base de données**:
```bash
pnpm docker:up
```

4. **Migrer la base de données**:
```bash
cd apps/api && pnpm prisma migrate dev
```

5. **Démarrer l'application**:
```bash
pnpm dev
```

## 🌍 Configuration Hedera

1. Créer un compte sur [Hedera Portal](https://portal.hedera.com)
2. Obtenir vos clés testnet
3. Configurer les variables d'environnement dans `.env`

## 🔧 Scripts Disponibles

- `pnpm dev` - Démarrer le développement (frontend + backend)
- `pnpm build` - Construire pour la production
- `pnpm test` - Exécuter les tests
- `pnpm lint` - Linter le code
- `pnpm format` - Formatter le code

## 🐳 Docker

Démarrer tous les services:
```bash
docker compose up -d
```

Services disponibles:
- API: http://localhost:3001
- Web: http://localhost:5173  
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:8080

## 📁 Structure du Projet

```
hedera-africa-dapp/
├── apps/
│   ├── web/          # Frontend React
│   └── api/          # Backend Fastify
├── packages/
│   ├── ui/           # Design system
│   └── config/       # Configuration partagée
└── docker-compose.yml
```

## 🎨 Thème & Design

- **Couleurs**: Inspirées du Bénin avec accents néon modernes
- **Typographie**: Space Grotesk (headings) + Inter (body)
- **Animations**: Framer Motion + Three.js pour le hero 3D
- **Accessibilité**: Conforme aux standards AA

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Validation Zod sur tous les endpoints
- Rate limiting et CORS configurés
- Row Level Security (RLS) sur PostgreSQL
- Intégration HashPack sécurisée

## 🧪 Tests

Exécuter tous les tests:
```bash
pnpm test
```

## 🚀 Déploiement

1. Construire l'application:
```bash
pnpm build
```

2. Déployer via Docker:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 📝 Licence

MIT - Voir [LICENSE](LICENSE) pour plus de détails.














rm -rf node_modules         # Supprime tous les modules installés
rm pnpm-lock.yaml           # Supprime le lockfile pour repartir propre
pnpm add -D esbuild@0.25.9  # Installe uniquement la version stable pré-compilée
pnpm install --force        # Réinstalle toutes les dépendances, en forçant la résolution
