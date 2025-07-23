
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useAuth } from '@/hooks/use-auth';
import { getUserProfileStream, updateUserProfile } from '@/lib/users-service';
import type { PlayerProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EditProfileForm, type EditProfileFormValues } from '@/components/profile/edit-profile-form';

// Helper function to compress images
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to get canvas context.'));
          }
  
          // Keep aspect ratio
          let { width, height } = img;
          const maxDim = 1024; // Max dimension for profile pictures
          if (width > height) {
            if (width > maxDim) {
              height = Math.round(height * (maxDim / width));
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round(width * (maxDim / height));
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
  
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas to Blob failed.'));
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.7 // 70% quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};


export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = getUserProfileStream(user.uid, (data) => {
        setProfile(data);
        if (data) {
          setAvatarPreview(data.avatar);
          setBannerPreview(data.banner || "https://placehold.co/800x300.png");
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImagePreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    let file = event.target.files?.[0];
    if (!file) return;

    try {
        if (file.size > 500 * 1024) { // 500KB limit
            toast({
                title: 'Compressing Large Image',
                description: "This may take a moment...",
            });
            file = await compressImage(file);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            toast({
                title: 'Image Ready',
                description: 'Image has been updated. Click "Save Changes" to apply.',
            });
        };
        reader.onerror = () => {
            throw new Error('Failed to read the file.');
        };
        reader.readAsDataURL(file);

    } catch (e) {
        toast({
            title: 'Upload Failed',
            description: (e as Error).message || "An unexpected error occurred.",
            variant: 'destructive',
        });
    }
  };

  const handleProfileUpdate = async (data: EditProfileFormValues) => {
    if (!user?.uid) return;
    setIsSubmitting(true);
    
    const updateData: Partial<PlayerProfile> = {
        ...data,
        avatar: avatarPreview || profile?.avatar,
        banner: bannerPreview || profile?.banner,
    };

    const result = await updateUserProfile(user.uid, updateData);
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      router.push('/profile');
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update profile.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (!profile || !avatarPreview || !bannerPreview) {
    return (
      <div className="pb-24 animate-pulse">
        <div className="relative h-48 w-full bg-muted"></div>
        <div className="relative z-10 -mt-16 flex flex-col items-center text-center px-4">
            <Skeleton className="h-28 w-28 rounded-full border-4 border-background" />
        </div>
        <div className="p-4 mt-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <Skeleton className="h-12 w-32" />
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }
  
  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Player';

  return (
    <div className="pb-24">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => handleImageChange(e, setBannerPreview)}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <input
        type="file"
        ref={avatarInputRef}
        onChange={(e) => handleImageChange(e, setAvatarPreview)}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      {/* Header Section */}
      <div className="relative h-48 w-full">
        <Image
          src={bannerPreview}
          alt="Profile banner"
          data-ai-hint="abstract background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
             <Button
                variant="outline"
                size="sm"
                className="bg-black/50 text-white hover:bg-black/70 hover:text-white border-white/50"
                onClick={() => bannerInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload Banner
              </Button>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="relative z-10 -mt-16 flex flex-col items-center text-center px-4">
        <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background">
              <AvatarImage src={avatarPreview} alt="Avatar" data-ai-hint="fantasy character" />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
             <div 
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-white hover:bg-black/50 hover:text-white"
                >
                    <Camera className="h-6 w-6" />
                </Button>
            </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Change your details below. Click save when you're done.</CardDescription>
            </CardHeader>
            <CardContent>
                <EditProfileForm
                    profile={profile}
                    onSubmit={handleProfileUpdate}
                    isSubmitting={isSubmitting}
                    onClose={() => router.back()}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
