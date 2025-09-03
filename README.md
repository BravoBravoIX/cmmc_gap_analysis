# CMMC Gap Analysis Tool

## 🚀 Quick Start

### Development Environment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run individual commands:
docker-compose build
docker-compose up
```

The application will be available at: http://localhost:3000

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utilities and shared logic
│   │   └── templates/     # JSON templates
│   ├── assessment/        # Assessment pages
│   ├── clients/           # Client management
│   ├── homework/          # Follow-up tasks
│   └── reports/           # Reporting system
├── public/
│   ├── frameworks/        # CMMC L1/L2 JSON data
│   ├── clients/           # Client data storage
│   └── config.json        # App configuration
└── reference/             # Original documentation
```

## 🔧 Docker Commands

```bash
# Development mode (hot reload)
docker-compose up

# Production mode
docker-compose --profile production up cmmc-tool-prod

# Rebuild containers
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f cmmc-tool
```

## 🏗️ Development Status

✅ Environment Setup Complete
✅ Next.js 14 + TypeScript
✅ Tailwind CSS + Theme System
✅ Docker Development Environment
✅ Reference Assets Copied

🔄 Next: Implement core assessment engine

## 🎯 Architecture

- **JSON-Driven**: All frameworks and questions loaded from JSON
- **File-Based**: No database - uses filesystem for client data
- **Auto-Discovery**: Frameworks automatically detected from folders
- **Privacy-First**: Client data separated from assessment data