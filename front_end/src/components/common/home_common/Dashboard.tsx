import { Header } from "../Header";
import { WalletIn4 } from "./WalletIn4";
import { WalletRegister } from "./WalletRegister";

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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <WalletIn4
              address={address}
              balance={balance}
              chainId={chainId}
              onDisconnect={onDisconnect}
            />
            <WalletRegister/>
          </div>
          {/* <div className="lg:col-span-2">
            <WalletRegister />
          </div> */}


        </div>
      </main>
    </div>
  );
};
