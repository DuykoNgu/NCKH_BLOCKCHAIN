import { Header } from "../Header";
import { PDF_Preview } from "./PDF_Preview";
import { StatGridContent } from "./StatGridContent";
import { WalletIn4 } from "./WalletIn4";
import { WalletRegister } from "./WalletRegister";
import {TransactionList } from  "@/components/common/home_common/TransactionList"
interface DashboardProps {
  address: string;
  balance: string | null;
  chainId: string | null;
  onDisconnect: () => void;
}

export const Dashboard = ({
  address,
  balance,
  chainId,
  onDisconnect,
}: DashboardProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatGridContent />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <WalletIn4
              address={address}
              balance={balance}
              chainId={chainId}
              onDisconnect={onDisconnect}
            />
            <WalletRegister />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <TransactionList />
            <PDF_Preview />
          </div>
        </div>
      </main>
    </div>
  );
};
