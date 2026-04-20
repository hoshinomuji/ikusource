# 🤝 Contributing to Ikuzen Hosting System

Thank you for your interest in contributing to Ikuzen Hosting System! We welcome contributions from developers of all skill levels. This document provides guidelines and information to help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## 🤟 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- PostgreSQL database
- Git
- Docker (optional, for containerized development)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/ikuzen-hosting.git
   cd ikuzen-hosting
   ```

2. **Install Dependencies**
   ```bash
   bun install  # or npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb ikuzen_dev

   # Push schema
   bunx drizzle-kit push

   # Optional: Seed with demo data
   bun run demo:user
   ```

5. **Start Development Server**
   ```bash
   bun run dev
   ```

## 🔄 Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](https://github.com/your-username/ikuzen-hosting/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clear, focused commits
- Test your changes thoroughly
- Follow the coding standards below

### 4. Test Your Changes

```bash
# Run linting
bun run lint

# Build the project
bun run build

# Run tests (when available)
bun run test
```

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a Pull Request with a clear description
- Reference any related issues

## 📝 Pull Request Process

### PR Requirements

- **Title**: Clear, descriptive title (e.g., "Add user profile picture upload")
- **Description**: Detailed explanation of changes
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Note any breaking changes

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All existing tests pass

## Screenshots (if applicable)
Add screenshots of UI changes.

## Additional Notes
Any additional information or context.
```

### Review Process

1. Automated checks must pass (linting, build)
2. At least one maintainer review required
3. Address review feedback
4. Maintainers will merge when ready

## 💻 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Prefer `const` over `let`, avoid `var`

### React Components

- Use functional components with hooks
- Follow component naming conventions (PascalCase)
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Optimize with `React.memo` when appropriate

### Database

- Use Drizzle ORM for all database operations
- Follow existing schema patterns
- Add proper indexes for performance
- Use transactions for multi-step operations

### API Routes

- Validate input with Zod schemas
- Return consistent response formats
- Handle errors gracefully
- Implement proper authentication/authorization

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(auth): add two-factor authentication
fix(dashboard): resolve memory leak in chart component
docs(readme): update installation instructions
```

## 🧪 Testing

### Current Testing Status

Testing infrastructure is under development. Help us improve it!

### Testing Guidelines

- Write tests for new features
- Test both happy path and error scenarios
- Mock external dependencies
- Aim for good test coverage
- Run tests before submitting PRs

### Test Structure

```
__tests__/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── e2e/          # End-to-end tests
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments to complex functions
- Document API endpoints
- Update README for new features
- Comment complex business logic

### User Documentation

- Update user guides for new features
- Add screenshots for UI changes
- Document configuration options
- Create tutorials for complex features

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node version
- **Screenshots**: If applicable
- **Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

- **Description**: What feature you'd like
- **Use Case**: Why this feature would be useful
- **Implementation Ideas**: How you think it could be implemented
- **Alternatives**: Other solutions you've considered

## 🎯 Areas for Contribution

### High Priority

- **Testing**: Help build comprehensive test suites
- **Documentation**: Improve docs and guides
- **Performance**: Optimize slow queries and components
- **Security**: Audit and improve security measures

### Other Areas

- **UI/UX**: Improve user interface and experience
- **Internationalization**: Add more languages
- **Accessibility**: Improve accessibility compliance
- **API**: Enhance and extend API functionality
- **Database**: Optimize queries and schema

## 💬 Communication

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Pull Request Comments**: For code review discussions

## 🙏 Recognition

Contributors will be recognized in:
- GitHub repository contributors list
- Release notes
- Project documentation
- Special mentions in announcements

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to Ikuzen Hosting System! Your efforts help make hosting management better for everyone.** 🚀