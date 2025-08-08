#!/usr/bin/env node

// Deployment readiness checker for NeuroDecor
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking NeuroDecor deployment readiness...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log('✅', description);
    checks.passed++;
    return true;
  } else {
    console.log('❌', description, `(Missing: ${filePath})`);
    checks.failed++;
    return false;
  }
}

function checkOptionalFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log('✅', description);
    checks.passed++;
    return true;
  } else {
    console.log('⚠️ ', description, `(Optional: ${filePath})`);
    checks.warnings++;
    return false;
  }
}

function checkPackageJson(dirPath, description) {
  const packagePath = path.join(__dirname, dirPath, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasStartScript = pkg.scripts && pkg.scripts.start;
      const hasDependencies = pkg.dependencies && Object.keys(pkg.dependencies).length > 0;
      
      if (hasStartScript && hasDependencies) {
        console.log('✅', description);
        checks.passed++;
        return true;
      } else {
        console.log('❌', description, '(Missing start script or dependencies)');
        checks.failed++;
        return false;
      }
    } catch (e) {
      console.log('❌', description, '(Invalid JSON)');
      checks.failed++;
      return false;
    }
  } else {
    console.log('❌', description, '(Missing package.json)');
    checks.failed++;
    return false;
  }
}

// Check deployment configuration files
console.log('📋 Deployment Configuration:');
checkFile('render.yaml', 'Render Blueprint configuration');
checkFile('package.json', 'Root package.json');
checkOptionalFile('build.sh', 'Build script');

console.log('\n🔧 Backend Configuration:');
checkPackageJson('backend', 'Backend package.json with dependencies');
checkFile('backend/server.js', 'Backend server file');
checkOptionalFile('backend/.env.production', 'Backend production environment');

console.log('\n🎨 Frontend Configuration:');
checkPackageJson('frontend', 'Frontend package.json with dependencies');
checkFile('frontend/src/App.js', 'Frontend main application');
checkFile('frontend/public/index.html', 'Frontend HTML template');
checkOptionalFile('frontend/.env.production', 'Frontend production environment');

console.log('\n🧪 Testing Setup:');
checkOptionalFile('backend/__tests__', 'Backend tests directory');
checkOptionalFile('frontend/src/utils/__tests__', 'Frontend tests directory');

console.log('\n📚 Documentation:');
checkFile('DEPLOYMENT.md', 'Deployment documentation');
checkFile('QUICK_DEPLOY.md', 'Quick deploy guide');
checkOptionalFile('README.md', 'Project README');

// Check critical code files
console.log('\n🔑 Critical Files:');
checkFile('backend/serviceAccountKey.json', 'Firebase service account (for local dev)');
checkFile('frontend/src/firebase.js', 'Frontend Firebase configuration');
checkFile('frontend/src/utils/api.js', 'Frontend API utilities');

console.log('\n' + '='.repeat(50));
console.log(`📊 Deployment Readiness Report:`);
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 Ready for deployment!');
  console.log('Next steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Connect repository to Render');
  console.log('3. Set environment variables');
  console.log('4. Deploy using render.yaml blueprint');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the failed checks before deploying.');
  console.log('Run this script again after fixes.');
  process.exit(1);
}