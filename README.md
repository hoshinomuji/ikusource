# 🚀 Ikuzen Hosting System

A modern, full-stack web hosting management platform built with cutting-edge technologies. Empower your users with seamless hosting services through an intuitive admin dashboard and customer portal.

## ✨ Features

- **🏠 Modern Landing Page**: Beautiful, responsive design with dynamic content management
- **👥 User Management**: Complete authentication system with role-based access control
- **💰 Wallet System**: Integrated payment processing with TrueMoney and slip verification
- **🌐 Hosting Management**: DirectAdmin integration for automated hosting provisioning
- **📊 Admin Dashboard**: Comprehensive analytics and management tools
- **🔔 Notification System**: Email and Discord webhook integrations
- **🌍 Multi-language Support**: Built-in translation system
- **📱 Mobile Responsive**: Optimized for all devices
- **🔒 Security First**: Encrypted data storage and secure authentication

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Next.js API Routes, Elysia (planned)
- **Database**: PostgreSQL with Drizzle ORM
- **Runtime**: Bun
- **Deployment**: Docker, Coolify, Vercel
- **Monitoring**: Sentry
- **Email**: Nodemailer with SMTP
- **Authentication**: Custom JWT-based sessions

## 📋 Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Docker (for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ikuzen-hosting.git
cd ikuzen-hosting
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/ikuzen_db

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your-random-session-secret-here

# Email (optional - can be configured later in admin)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment APIs
TRUEMONEY_API_URL=https://api.mystrix2.me/truemoney
SLIP_VERIFICATION_API_URL=https://slip-c.oiioioiiioooioio.download/api/slip
```

### 4. Database Setup

```bash
# Push database schema
bunx drizzle-kit push

# Optional: Run development seed
bun run demo:user
```

### 5. Development Server

```bash
# Start development server
bun run dev

# Or with Turbo (faster)
bun run dev:turbo
```

Visit `http://localhost:3000` to see your application!

### 6. Create Admin User

After starting the server, create your first admin account by registering at `/register`, then promote it to admin:

```bash
bunx tsx scripts/set-admin.ts your-email@example.com
```

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   └── (public)/       # Public pages
├── components/         # Reusable React components
│   ├── ui/            # Base UI components (Radix)
│   ├── admin/         # Admin-specific components
│   └── dashboard/     # Dashboard components
├── db/                # Database configuration and schemas
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
└── types/             # TypeScript type definitions
```

## 🔧 Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bunx drizzle-kit push` - Push database schema changes
- `bunx drizzle-kit studio` - Open Drizzle Studio for database management

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run with Docker
docker build -t ikuzen-hosting .
docker run -p 3000:3000 ikuzen-hosting
```

### Coolify Deployment

1. Push your code to GitHub
2. Connect your repository to Coolify
3. Set environment variables in Coolify dashboard
4. Deploy!

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] User authentication and authorization
- [x] Basic hosting package management
- [x] Wallet and payment integration
- [x] Admin dashboard
- [ ] Email notification system improvements

### Phase 2: Advanced Features 🚧
- [ ] Multi-tenant architecture
- [ ] Advanced analytics and reporting
- [ ] API rate limiting and security enhancements
- [ ] Plugin system for extensibility
- [ ] Migration to Elysia backend

### Phase 3: Enterprise Features 📋
- [ ] White-label solutions
- [ ] Advanced billing and invoicing
- [ ] Integration with popular hosting panels
- [ ] Mobile app companion
- [ ] AI-powered support chat

### Known Issues & TODOs
- **Database**: Some migration scripts need environment variable validation
- **Security**: Review and audit all API endpoints for potential vulnerabilities
- **Performance**: Implement caching for frequently accessed data
- **Testing**: Add comprehensive test suite (unit, integration, e2e)

## 🤝 Contributing

We welcome contributions from the community! Ikuzen Studio is built by developers, for developers.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Areas for Contribution

- **Frontend**: UI/UX improvements, new components
- **Backend**: API enhancements, performance optimizations
- **Database**: Schema improvements, migration scripts
- **Documentation**: Tutorials, API docs, deployment guides
- **Testing**: Unit tests, integration tests, e2e tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by the Ikuzen Studio team
- Special thanks to the open source community
- Inspired by modern hosting platforms and developer tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ikuzen-hosting/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ikuzen-hosting/discussions)
- **Email**: support@ikuzen.com

---

**Made with ❤️ by Ikuzen Studio - Empowering developers, one hosting solution at a time.**
