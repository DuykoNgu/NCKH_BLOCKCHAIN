import { Header } from "./Header";
import { NFTManagement } from "../nft/NFTManagernent";
import { PDF_Preview } from "../home_common/PDF_Preview";
import { WalletIn4 } from "../home_common/WalletIn4";
import { WalletRegister } from "../home_common/WalletRegister";
import { TransactionList } from "../home_common/TransactionList";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  address: string;
  onDisconnect: () => void;
}

export const Dashboard = ({
  address,
  onDisconnect,
}: DashboardProps) => {
  const { isUser } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <WalletIn4
              address={address}
              onDisconnect={onDisconnect}
            />
            {isUser && <WalletRegister />}
          </div>
          <div className="lg:col-span-2 space-y-6">
            <NFTManagement account={address} />
            <TransactionList />
            {isUser && <PDF_Preview />}
          </div>
        </div>
      </main>
    </div>
  );
};
