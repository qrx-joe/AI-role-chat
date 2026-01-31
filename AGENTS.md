# AI Role Chat - Agent Instructions

> Guide for AI coding agents working in this repository.

## Project Structure

```
AI role chat/
├── backend/              # NestJS + TypeORM + SQLite
│   ├── src/
│   │   ├── chat/         # DeepSeek API integration, SSE streaming
│   │   ├── roles/        # Role CRUD operations
│   │   ├── conversations/# Session management
│   │   ├── messages/     # Message storage
│   │   ├── upload/       # File upload handling
│   │   └── common/       # Exception filters, utilities
│   └── test/             # E2E tests
├── frontend/             # Vue3 + Pinia + Vite
│   ├── src/
│   │   ├── components/   # Vue SFC components
│   │   ├── stores/       # Pinia state management
│   │   ├── api/          # API client functions
│   │   └── assets/       # Static resources
│   └── index.html
└── start.bat / start.ps1 # One-click start scripts
```

## Build & Development Commands

### Backend (NestJS)

```bash
cd backend

# Development
npm run start:dev          # Watch mode with hot reload

# Build
npm run build              # Production build to dist/
npm run start:prod         # Run production build

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier format all files

# Testing
npm run test               # Run all unit tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage report
npm run test:debug         # Node debugger
npm run test:e2e           # End-to-end tests

# Single test file
npx jest src/chat/chat.service.spec.ts
npx jest --testNamePattern="should stream chat"
```

### Frontend (Vue3)

```bash
cd frontend

# Development
npm run dev                # Vite dev server (port 5173)

# Build
npm run build              # Production build
npm run preview            # Preview production build
```

### Full Stack

```bash
# Windows
start.bat                  # Launch both frontend and backend
stop.bat                   # Stop all services
```

## Code Style Guidelines

### TypeScript (Backend)

- **Decorators**: Use NestJS standard decorators (`@Controller`, `@Injectable`, `@Entity`)
- **Imports**: Group by external → internal → relative; alphabetical within groups
- **Types**: Explicit return types on public methods; strict null checks enabled
- **Naming**: PascalCase classes/interfaces, camelCase variables/functions, UPPER_SNAKE constants
- **DTOs**: Use `class-validator` decorators for validation (`@IsNotEmpty`, `@IsUUID`)
- **Comments**: JSDoc for public APIs, Chinese for business logic explanations
- **Error Handling**: Use built-in NestJS exceptions (`BadRequestException`, `NotFoundException`)

### Vue/JS (Frontend)

- **Script Setup**: Use `<script setup>` Composition API exclusively
- **Imports**: Group Vue → Pinia → components → API → utilities
- **Naming**: PascalCase components, camelCase composables/stores, UPPER_SNAKE constants
- **Reactivity**: Use `ref()` for primitives, `computed()` for derived state
- **Store Pattern**: Pinia with Composition API style (`defineStore('name', () => {...})`)
- **API Calls**: Centralize in `src/api/` directory, return promises
- **Comments**: Chinese for business logic, minimal for self-documenting code

### Prettier Config (enforced)

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### File Organization

- **Backend**: One class per file, filename matches exported class
- **Frontend**: Components in `components/`, stores in `stores/`, API in `api/`
- **Maximum size**: Prefer files under 250 lines; split by concern when growing

## Testing Patterns

```typescript
// NestJS service test example
describe('ChatService', () => {
  let service: ChatService;
  let repository: MockType<Repository<Role>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Role), useFactory: repositoryMockFactory },
      ],
    }).compile();
    
    service = module.get(ChatService);
    repository = module.get(getRepositoryToken(Role));
  });

  it('should validate role exists', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.streamChat('invalid', ...)).rejects.toThrow('角色不存在');
  });
});
```

## Database & API

- **ORM**: TypeORM with SQLite (dev) / PostgreSQL (prod-ready)
- **Migrations**: Auto-sync enabled in development only (`synchronize: true`)
- **Streaming**: SSE protocol for real-time chat (`text/event-stream`)
- **DTO Validation**: Global `ValidationPipe` with whitelist enabled

## Environment Setup

Create `backend/.env`:

```env
DEEPSEEK_API_KEY=sk-your-key-here
DATABASE_PATH=./database.sqlite
```

## Critical Reminders

1. Always run `npm run lint` before committing backend changes
2. Backend uses ES2023 target with NodeNext module resolution
3. Frontend streams use native `fetch()` + `ReadableStream`, not Axios
4. Image uploads processed via two-phase: vision identification → role response
5. Never commit `.env` files or SQLite databases to git
