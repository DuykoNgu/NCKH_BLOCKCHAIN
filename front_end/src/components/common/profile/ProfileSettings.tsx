import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, User, Image as ImageIcon, Loader2 } from 'lucide-react';
import { updateProfile } from "@/services/authService";
import { toast } from "sonner";
import { UserAvatar } from "../UserAvatar";
import { useAuth } from "@/hooks/useAuth";

interface ProfileSettingsProps {
  onBack: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onBack }) => {
  const { fullName, avatarUrl, address } = useAuth();
  const [name, setName] = useState(fullName || '');
  const [avatar, setAvatar] = useState(avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(address || '', name, avatar);
      toast.success("Đã cập nhật hồ sơ thành công!");
      // Force refresh of Auth state by reloading or using a global state.
      // For now, since useAuth reads from localStorage, it will update on next render
      // but we might need a small delay or a window reload to be sure.
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Không thể cập nhật hồ sơ");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="glass-card border-border/50 animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <CardTitle className="text-lg">Cài đặt hồ sơ</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <div className="flex flex-col items-center gap-4 mb-6">
          <UserAvatar address={address || ''} avatarUrl={avatar} size={80} className="ring-4 ring-primary/10" />
          <p className="text-xs text-muted-foreground">Xem trước ảnh đại diện</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="w-3 h-3" />
              Tên hiển thị
            </label>
            <Input
              placeholder="Nhập tên của bạn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30 border-border/50 h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-3 h-3" />
              URL Ảnh đại diện
            </label>
            <Input
              placeholder="https://..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="bg-muted/30 border-border/50 h-10"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Để trống để sử dụng Avatar tự động (Identicon)
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Lưu thay đổi
        </Button>
      </CardFooter>
    </Card>
  );
};