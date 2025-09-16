// Admin user detection utility
export const ADMIN_EMAILS = [
  'sasenav74@gmail.com',
  'admin@test.com',
  // Add your working email here temporarily for testing
  // 'your-working-email@gmail.com'
] as const;

export const ADMIN_PASSWORD = 'Domino@007';

export interface AdminUser {
  email: string;
  password: string;
}

export const ADMIN_USERS: AdminUser[] = [
  { email: 'sasenav74@gmail.com', password: 'Domino@007' },
  { email: 'admin@test.com', password: 'admin123' }
];

/**
 * Check if a user is an admin based on email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns true if user is admin, false otherwise
 */
export const isAdminUser = (email: string, password: string): boolean => {
  if (!email || !password) return false;
  
  return ADMIN_USERS.some(admin => 
    admin.email.toLowerCase() === email.toLowerCase() && 
    admin.password === password
  );
};

/**
 * Check if an email belongs to an admin user (without password verification)
 * @param email - User's email address
 * @returns true if email belongs to admin user, false otherwise
 */
export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;
  
  const isAdmin = ADMIN_EMAILS.some(adminEmail => 
    adminEmail.toLowerCase() === email.toLowerCase()
  );
  
  console.log('🔍 isAdminEmail check:', {
    inputEmail: email,
    adminEmails: ADMIN_EMAILS,
    isAdmin: isAdmin
  });
  
  // TEMPORARY: Force admin mode disabled - admin tab is now visible to all users
  // const forceAdminMode = true; // Set to false to disable
  // if (forceAdminMode) {
  //   console.log('🚨 TEMPORARY: Force admin mode enabled for testing');
  //   return true;
  // }
  
  return isAdmin;
};

/**
 * Get admin user info by email
 * @param email - User's email address
 * @returns AdminUser object if found, null otherwise
 */
export const getAdminUser = (email: string): AdminUser | null => {
  if (!email) return null;
  
  return ADMIN_USERS.find(admin => 
    admin.email.toLowerCase() === email.toLowerCase()
  ) || null;
};

// Debug function to help troubleshoot admin detection
export const debugAdminDetection = (email: string) => {
  console.log('🔍 DEBUG: Admin Detection Analysis');
  console.log('=====================================');
  console.log('📧 Input email:', email);
  console.log('📋 Admin emails list:', ADMIN_EMAILS);
  console.log('👤 Admin users list:', ADMIN_USERS);
  
  const isAdminByEmail = isAdminEmail(email);
  const adminUser = getAdminUser(email);
  
  console.log('✅ Is admin by email:', isAdminByEmail);
  console.log('👤 Admin user found:', adminUser);
  
  if (adminUser) {
    console.log('🔑 Expected password:', adminUser.password);
  }
  
  return {
    email,
    isAdminByEmail,
    adminUser,
    adminEmails: ADMIN_EMAILS,
    adminUsers: ADMIN_USERS
  };
};
