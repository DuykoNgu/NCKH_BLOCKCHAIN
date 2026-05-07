import { STORAGE_KEYS } from "@/constants/storage";

const saveUserData = (user: any) => {
  const { user_id, public_key, address, vault, role, full_name, is_active, org_name } = user;

  const entriesMap: Record<string, any> = {
    [STORAGE_KEYS.USER_ID]: user_id,
    [STORAGE_KEYS.PUBLIC_KEY]: public_key,
    [STORAGE_KEYS.ADDRESS]: address,
    [STORAGE_KEYS.VAULT]: typeof vault === 'string' ? vault : JSON.stringify(vault),
    [STORAGE_KEYS.ROLE]: role,
    [STORAGE_KEYS.FULL_NAME]: full_name,
    [STORAGE_KEYS.IS_ACTIVE]: is_active,
    [STORAGE_KEYS.ORG_NAME]: org_name,
  };

  Object.entries(entriesMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, String(value));
    }
  });
};

export default saveUserData;