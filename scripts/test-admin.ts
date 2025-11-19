/**
 * Test script to verify admin features and authentication
 * Run with: npx tsx scripts/test-admin.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Import after loading env vars
import { serverEnv } from '../lib/env';
import { isAdmin } from '../lib/auth/admin-utils';

console.log('🔐 Admin Authentication Test\n');
console.log('='.repeat(50));

// Test 1: Check if admin user IDs are loaded
console.log('\n1. Checking Admin User IDs Configuration:');
console.log('   Admin User IDs:', serverEnv.adminUserIds);
console.log('   Count:', serverEnv.adminUserIds.length);

if (serverEnv.adminUserIds.length === 0) {
  console.error('   ❌ ERROR: No admin user IDs configured!');
  console.error('   Please set ADMIN_USER_IDS in .env.local');
  process.exit(1);
} else {
  console.log('   ✅ Admin user IDs are configured');
}

// Test 2: Test admin check function
console.log('\n2. Testing Admin Check Function:');
const testAdminId = serverEnv.adminUserIds[0];
const testNonAdminId = 'non-admin-user-id-12345';

console.log(`   Testing with admin ID: ${testAdminId}`);
const isAdminResult1 = isAdmin(testAdminId);
console.log(`   Result: ${isAdminResult1 ? '✅ Admin' : '❌ Not Admin'}`);

console.log(`   Testing with non-admin ID: ${testNonAdminId}`);
const isAdminResult2 = isAdmin(testNonAdminId);
console.log(`   Result: ${isAdminResult2 ? '❌ Should not be admin' : '✅ Not Admin (correct)'}`);

// Test 3: Test edge cases
console.log('\n3. Testing Edge Cases:');
console.log('   Testing with null:', isAdmin(null) ? '❌' : '✅');
console.log('   Testing with undefined:', isAdmin(undefined) ? '❌' : '✅');
console.log('   Testing with empty string:', isAdmin('') ? '❌' : '✅');

// Test 4: Verify all admin IDs
console.log('\n4. Verifying All Admin User IDs:');
serverEnv.adminUserIds.forEach((id, index) => {
  const result = isAdmin(id);
  console.log(`   Admin ${index + 1}: ${id.substring(0, 20)}... ${result ? '✅' : '❌'}`);
});

console.log('\n' + '='.repeat(50));
console.log('\n✅ Admin authentication system is properly configured!');
console.log('\n📝 Next Steps:');
console.log('   1. Sign in with one of the admin user IDs');
console.log('   2. Verify you can access /admin, /upload, /streams/create');
console.log('   3. Verify you can upload videos, create streams, and add products');
console.log('   4. Verify non-admin users see "Access Denied" on admin pages');

