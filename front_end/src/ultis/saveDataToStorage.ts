const saveUserData = (user: any) => {
  const { user_id, public_key, address, private_key } = user;

  const entries = {
    isLoggedIn: "true",
    user_id,
    public_key,
    address,
    private_key,
  };

  Object.entries(entries).forEach(([key, value]) =>
    localStorage.setItem(key, value)
  );
};

export default saveUserData;