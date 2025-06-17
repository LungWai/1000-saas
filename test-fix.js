#!/usr/bin/env node

// Quick test to verify our Jest setup works
console.log('Testing Jest configuration...');

// Test that we can import the setup files
try {
  require('./jest.setup.js');
  console.log('✅ jest.setup.js loads correctly');
} catch (error) {
  console.log('❌ jest.setup.js failed:', error.message);
}

try {
  require('./jest.setup.node.js');
  console.log('✅ jest.setup.node.js loads correctly');
} catch (error) {
  console.log('❌ jest.setup.node.js failed:', error.message);
}

// Test that global mocks are available
if (typeof global.fetch === 'function') {
  console.log('✅ global.fetch is available');
} else {
  console.log('❌ global.fetch is not available');
}

if (typeof global.Request === 'function') {
  console.log('✅ global.Request is available');
} else {
  console.log('❌ global.Request is not available');
}

console.log('Test complete!');
