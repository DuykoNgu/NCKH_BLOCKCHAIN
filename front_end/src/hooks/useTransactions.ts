import { useQuery } from "@tanstack/react-query";
import { TransactionService } from "@/services/transactionService";

export const useAllTransactions = () => {
  return useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () => TransactionService.getAllTransactions(),
  });
};

export const useUserTransactions = (address: string) => {
  return useQuery({
    queryKey: ["transactions", "user", address],
    queryFn: () => TransactionService.getTransactionsByAddress(address),
    enabled: !!address,
  });
};
