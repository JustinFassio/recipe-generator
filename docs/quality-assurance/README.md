# Quality Assurance Documentation

This directory contains comprehensive documentation for the Recipe Generator project's quality assurance and verification systems.

## 📋 **Documentation Overview**

### **Core Verification System**

- **[Pre-PR Verification System](PRE-PR-VERIFICATION.md)** - Complete implementation guide for the automated verification pipeline
- **[Pre-PR Verification Checklist](PRE-PR-VERIFICATION-CHECKLIST.md)** - Comprehensive diagnostic checklist for AI agents and developers
- **[AI Agent Quick Reference](AI-AGENT-QUICK-REFERENCE.md)** - Essential commands and patterns for AI agents

## 🎯 **Quick Start**

### **For Developers**

1. Read the [Pre-PR Verification System](PRE-PR-VERIFICATION.md) to understand the quality pipeline
2. Use the [Pre-PR Verification Checklist](PRE-PR-VERIFICATION-CHECKLIST.md) before making changes
3. Run `npm run verify` to execute the full verification suite

### **For AI Agents**

1. Start with the [AI Agent Quick Reference](AI-AGENT-QUICK-REFERENCE.md) for essential commands
2. Follow the [Pre-PR Verification Checklist](PRE-PR-VERIFICATION-CHECKLIST.md) systematically
3. Reference the [Pre-PR Verification System](PRE-PR-VERIFICATION.md) for detailed implementation

## 🔧 **Quality Assurance Tools**

### **Automated Verification**

- **Linting**: ESLint with TypeScript and React rules
- **Formatting**: Prettier with Tailwind CSS plugin
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest with React Testing Library
- **Coverage**: Configurable coverage thresholds
- **Build Verification**: Production build testing
- **Security**: npm audit integration

### **Git Hooks**

- **Pre-commit**: Linting and formatting checks
- **Pre-push**: Full verification suite
- **CI/CD**: GitHub Actions automated pipeline

## 📊 **Current Status**

- ✅ **26 tests** passing across 3 test files
- ✅ **Automated verification** on every commit/push
- ✅ **Type safety** with TypeScript strict mode
- ✅ **Code formatting** with Prettier
- ✅ **Security scanning** with npm audit
- ✅ **Coverage tracking** with configurable thresholds

## 🚀 **Getting Started**

### **First Time Setup**

```bash
# Install dependencies
npm install

# Run initial verification
npm run verify

# Set up git hooks
npm run prepare
```

### **Daily Development**

```bash
# Quick health check
npm run verify:quick

# Run tests
npm run test:run

# Format code
npm run format

# Full verification
npm run verify
```

## 📚 **Related Documentation**

- **[Project README](../../README.md)** - Main project documentation
- **[Test Examples](../../src/__tests__/)** - Working test patterns
- **[Component Patterns](../../src/components/)** - Established component structure

---

**Last Updated**: January 2025  
**Status**: ✅ ACTIVE
