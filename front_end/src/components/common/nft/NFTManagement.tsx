import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTCreate } from './NFTCreate';
import { NFTList } from './NFTList';
import { NFTDetail } from './NFTDetails';
import { NFTVerify } from './NFTVerify';
import { MyNFTs } from './MyNFT';
import { NetworkManagement } from '../admin/NetworkManagement';
import { useAuth } from '@/hooks/useAuth';

interface NFTManagementProps {
  account: string;
}

export const NFTManagement = ({ account }: NFTManagementProps) => {
  const { isAdmin, isValidator, isUser } = useAuth();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(isUser ? 'my-nfts' : 'all-nfts');

  const handleSelectNFT = (tokenId: string) => {
    setSelectedTokenId(tokenId);
  };

  const handleBackFromDetail = () => {
    setSelectedTokenId(null);
  };

  if (selectedTokenId) {
    return <NFTDetail tokenId={selectedTokenId} onBack={handleBackFromDetail} />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full mb-6 ${isUser ? 'grid-cols-1' : isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {isUser && <TabsTrigger value="my-nfts">Chứng chỉ của tôi</TabsTrigger>}
          {!isUser && <TabsTrigger value="all-nfts">Tất cả</TabsTrigger>}
          {(isAdmin || isValidator) && <TabsTrigger value="create">Cấp phát</TabsTrigger>}
          {!isUser && <TabsTrigger value="verify">Xác minh</TabsTrigger>}
          {isAdmin && <TabsTrigger value="network">Mạng lưới</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-nfts">
          <MyNFTs account={account} onSelectNFT={handleSelectNFT} />
        </TabsContent>

        {!isUser && (
          <TabsContent value="all-nfts">
            <NFTList onSelectNFT={handleSelectNFT} />
          </TabsContent>
        )}

        <TabsContent value="create">
          <NFTCreate account={account} />
        </TabsContent>

        {!isUser && (
          <TabsContent value="verify">
            <NFTVerify />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="network">
            <NetworkManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
