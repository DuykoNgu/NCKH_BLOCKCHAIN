const saveUserData = (user: any) => {
  const { user_id, public_key, address, vault, role, full_name, is_active } = user;

  const entriesMap: Record<string, any> = {
    user_id,
    public_key,
    address,
    vault: JSON.stringify(vault),
    role,
    full_name,
    is_active
  };

  Object.entries(entriesMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, String(value));
    }
  });
};

export default saveUserData;