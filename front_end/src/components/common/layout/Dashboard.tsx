import { Header } from "./Header";
import { NFTManagement } from "../nft/NFTManagement";
import { WalletInfo as WalletIn4 } from "../wallet/WalletInfo";
import { NetworkStatus } from "../wallet/NetworkStatus";
import { TransactionList } from "../transaction/TransactionList";
import { DashboardStats } from "./DashboardStats";
import { PageTransition } from "./PageTransition";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  address: string;
  onDisconnect: () => void;
}

export const Dashboard = ({
  address,
  onDisconnect,
}: DashboardProps) => {
  const { isUser, isValidator } = useAuth();

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 animate-fade-in">
          {/* Dashboard Stats displayed on top of everything */}
          <DashboardStats />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <WalletIn4
                address={address}
                onDisconnect={onDisconnect}
              />
              <NetworkStatus />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <NFTManagement account={address} />
              <TransactionList />
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};
