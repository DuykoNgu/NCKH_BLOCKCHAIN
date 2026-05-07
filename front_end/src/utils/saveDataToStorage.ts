const saveUserData = (user: any) => {
  const { user_id, public_key, address, vault, role, full_name, is_active } = user;

  // 1. Maintain the "Current/Active" account flat keys for backward compatibility
  const entriesMap: Record<string, any> = {
    user_id,
    public_key,
    address,
    vault: vault ? (typeof vault === 'string' ? vault : JSON.stringify(vault)) : null,
    role,
    full_name,
    is_active
  };

  Object.entries(entriesMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'null') {
      localStorage.setItem(key, String(value));
    }
  });

  // 2. Maintain a list of all accounts for the "Recent Accounts" feature
  try {
    const accountsRaw = localStorage.getItem('accounts');
    let accounts = accountsRaw ? JSON.parse(accountsRaw) : [];

    // Check if account already exists to preserve existing info (like full_name)
    const existingIndex = accounts.findIndex((a: any) => a.address.toLowerCase() === address.toLowerCase());
    const existingAccount = existingIndex > -1 ? accounts[existingIndex] : null;
    
    // Priority: incoming full_name > existing account's full_name > empty string
    const finalFullName = full_name || (existingAccount ? existingAccount.full_name : '');

    const accountInfo = {
      address: address.toLowerCase(),
      full_name: finalFullName,
      role: role || (existingAccount ? existingAccount.role : 'client'),
      public_key,
      vault: vault ? (typeof vault === 'string' ? vault : JSON.stringify(vault)) : (existingAccount ? existingAccount.vault : null),
      last_login: new Date().toISOString()
    };

    if (existingIndex > -1) {
      // Update existing and move to front
      accounts.splice(existingIndex, 1);
    }
    
    // Add to front of list
    accounts.unshift(accountInfo);

    // Keep only last 10 accounts
    if (accounts.length > 10) accounts = accounts.slice(0, 10);

    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // Also ensure the primary full_name key is set if we have one
    if (finalFullName) {
      localStorage.setItem('full_name', finalFullName);
    }
  } catch (err) {
    console.error('[saveUserData] Failed to update accounts list:', err);
  }
};

export default saveUserData;