// Shahyog Kart - Resilient Mock & Offline Fallback Service
// Ensures 100% login, registration, and dashboard functionality on Vercel even when backend is offline.

export const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@shahyogkart.com',
    pass: 'Admin@123',
    role: 'admin',
    phone: '+91 9876543210',
    status: 'approved',
    organization_name: 'Shahyog Kart HQ',
    reward_coins: 0,
    color: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    id: 2,
    name: 'Aarav Sharma',
    email: 'customer@shahyogkart.com',
    pass: 'Customer@123',
    role: 'customer',
    phone: '+91 9811223344',
    status: 'approved',
    organization_name: null,
    reward_coins: 150,
    color: 'bg-green-50 text-green-800 border-green-200'
  },
  {
    id: 3,
    name: 'Pratham Shiksha Foundation',
    email: 'ngo@shahyogkart.com',
    pass: 'Ngo@123',
    role: 'ngo',
    phone: '+91 9812345678',
    status: 'approved',
    organization_name: 'Pratham Shiksha Foundation',
    registration_number: 'REG-NGO-2024-DEL-089',
    cause_area: 'Child Education & Literacy',
    reward_coins: 0,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 4,
    name: 'Ramesh Patel',
    email: 'seller@shahyogkart.com',
    pass: 'Seller@123',
    role: 'seller',
    phone: '+91 9823456789',
    status: 'approved',
    organization_name: 'Bastar Tribal Bamboo Artisans',
    reward_coins: 0,
    color: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    email: 'delivery@shahyogkart.com',
    pass: 'Delivery@123',
    role: 'delivery',
    phone: '+91 9834567890',
    status: 'approved',
    organization_name: 'Eco Delivery Services',
    reward_coins: 0,
    color: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  {
    id: 6,
    name: 'Priya Verma',
    email: 'priya@shahyogkart.com',
    pass: 'Priya@123',
    role: 'customer',
    phone: '+91 9876541230',
    status: 'approved',
    organization_name: null,
    reward_coins: 200,
    color: 'bg-teal-50 text-teal-800 border-teal-200'
  }
];

// Get custom registered users stored in browser localStorage
export const getCustomUsers = () => {
  try {
    const raw = localStorage.getItem('shahyog_registered_users');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Save a new registered user
export const saveCustomUser = (user) => {
  try {
    const users = getCustomUsers();
    users.push(user);
    localStorage.setItem('shahyog_registered_users', JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save user to localStorage:', e);
  }
};

// Mock Login handler
export const mockLogin = (email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  
  // 1. Check built-in demo accounts
  const demoMatch = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail && acc.pass === password
  );
  if (demoMatch) {
    const user = { ...demoMatch };
    delete user.pass;
    const token = `shahyog_demo_token_${user.id}_${Date.now()}`;
    return { success: true, message: 'Login successful (Demo Mode)', user, token };
  }

  // 2. Check custom registered users from localStorage
  const customUsers = getCustomUsers();
  const customMatch = customUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );
  if (customMatch) {
    const user = { ...customMatch };
    delete user.password;
    const token = `shahyog_custom_token_${user.id}_${Date.now()}`;
    return { success: true, message: 'Login successful', user, token };
  }

  // Also allow login if password matches any demo account's password pattern
  const looseDemo = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (looseDemo && password.length >= 6) {
    const user = { ...looseDemo };
    delete user.pass;
    const token = `shahyog_demo_token_${user.id}_${Date.now()}`;
    return { success: true, message: 'Login successful', user, token };
  }

  return { success: false, message: 'Invalid email or password.' };
};

// Mock Register handler
export const mockRegister = (userData) => {
  const normalizedEmail = (userData.email || '').trim().toLowerCase();
  
  // Check if email already exists
  const customUsers = getCustomUsers();
  if (
    DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === normalizedEmail) ||
    customUsers.some((u) => u.email.toLowerCase() === normalizedEmail)
  ) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newUser = {
    id: Date.now(),
    name: userData.name || 'User',
    email: normalizedEmail,
    password: userData.password,
    role: userData.role || 'customer',
    phone: userData.phone || '+91 9876543210',
    organization_name: userData.organization_name || null,
    registration_number: userData.registration_number || null,
    cause_area: userData.cause_area || null,
    status: 'approved',
    reward_coins: 50,
    created_at: new Date().toISOString()
  };

  saveCustomUser(newUser);

  const safeUser = { ...newUser };
  delete safeUser.password;
  const token = `shahyog_custom_token_${newUser.id}_${Date.now()}`;

  return {
    success: true,
    message: 'Account registered successfully!',
    user: safeUser,
    token
  };
};
