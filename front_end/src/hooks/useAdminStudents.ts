import { useState, useEffect, useMemo } from "react";
import { AccountService } from "@/services/accountService";
import type { AccountInfo } from "@/services/accountService";
import { NFTService } from "@/services/nftService";

export function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 14) return addr || '-';
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export interface StudentDisplay {
  address: string;
  name: string;
  org_name: string;
  role: string;
  is_active: boolean;
  nftCount: number;
}

export const useAdminStudents = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentDisplay[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const accountRes = await AccountService.getAllAccounts();
        const accounts = accountRes.accounts || [];

        // For each account, fetch their NFT count
        const studentsWithNfts = await Promise.all(
          accounts.map(async (acc: AccountInfo) => {
            let nftCount = 0;
            try {
              const nftRes = await NFTService.getUserNFTs(acc.address);
              nftCount = nftRes.total || 0;
            } catch {
              // Ignore errors for individual NFT fetches
            }
            return {
              address: acc.address,
              name: acc.full_name || truncateAddress(acc.address),
              org_name: acc.org_name || "-",
              role: acc.role,
              is_active: acc.is_active,
              nftCount,
            };
          })
        );

        setStudents(studentsWithNfts);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.org_name.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const totalNfts = useMemo(() => students.reduce((sum, s) => sum + s.nftCount, 0), [students]);
  const activeCount = useMemo(() => students.filter((s) => s.is_active).length, [students]);

  return {
    search,
    setSearch,
    loading,
    students,
    filtered,
    totalNfts,
    activeCount
  };
};
