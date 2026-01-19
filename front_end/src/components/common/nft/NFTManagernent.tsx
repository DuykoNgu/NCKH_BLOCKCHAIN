import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTCreate } from './NFTCreate';
import { NFTList } from './NFTList';
import { NFTDetail } from './NFTDetails';
import { NFTVerify } from './NFTVerify';
import { MyNFTs } from './MyNFT';

interface NFTManagementProps {
  account: string;
}

export const NFTManagement = ({ account }: NFTManagementProps) => {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-nfts');

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
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="my-nfts">Của tôi</TabsTrigger>
          <TabsTrigger value="all-nfts">Tất cả</TabsTrigger>
          <TabsTrigger value="create">Tạo mới</TabsTrigger>
          <TabsTrigger value="verify">Xác minh</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nfts">
          <MyNFTs account={account} onSelectNFT={handleSelectNFT} />
        </TabsContent>

        <TabsContent value="all-nfts">
          <NFTList onSelectNFT={handleSelectNFT} />
        </TabsContent>

        <TabsContent value="create">
          <NFTCreate account={account} />
        </TabsContent>

        <TabsContent value="verify">
          <NFTVerify />
        </TabsContent>
      </Tabs>
    </div>
  );
};
