const saveUserData = (user: any) => {
  const { user_id, public_key, address, vault, role, full_name, is_active } = user;

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

  try {
    const accountsRaw = localStorage.getItem('accounts');
    let accounts = accountsRaw ? JSON.parse(accountsRaw) : [];

    const existingIndex = accounts.findIndex((a: any) => a.address.toLowerCase() === address.toLowerCase());
    const existingAccount = existingIndex > -1 ? accounts[existingIndex] : null;
    
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
      accounts.splice(existingIndex, 1);
    }
    
    accounts.unshift(accountInfo);

    if (accounts.length > 10) accounts = accounts.slice(0, 10);

    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    if (finalFullName) {
      localStorage.setItem('full_name', finalFullName);
    }
  } catch (err) {
    console.error('[saveUserData] Failed to update accounts list:', err);
  }
};

export default saveUserData;