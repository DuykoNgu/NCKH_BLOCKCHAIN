const saveUserData = (user: any) => {
  const { user_id, public_key, address, vault, role } = user;

  const entries = {
    user_id,
    public_key,
    address,
    vault: JSON.stringify(vault),
    role,
  };

  Object.entries(entries).forEach(([key, value]) =>
    localStorage.setItem(key, value)
  );
};

export default saveUserData;