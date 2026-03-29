import { Header } from "./Header";
import { NFTManagement } from "../nft/NFTManagement";
import { PDFPreview as PDF_Preview } from "../pdf/PDFPreview";
import { WalletInfo as WalletIn4 } from "../wallet/WalletInfo";
import { WalletRegister } from "../wallet/WalletRegister";
import { TransactionList } from "../transaction/TransactionList";
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
