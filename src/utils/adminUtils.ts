// Admin user detection utility
export const ADMIN_EMAILS = [
  'sasenav74@gmail.com',
  'admin@test.com'
] as const;

export const ADMIN_PASSWORD = 'admin123';

export interface AdminUser {
  email: string;
  password: string;
}

export const ADMIN_USERS: AdminUser[] = [
  { email: 'sasenav74@gmail.com', password: 'admin123' },
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
  
  return ADMIN_EMAILS.some(adminEmail => 
    adminEmail.toLowerCase() === email.toLowerCase()
  );
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
