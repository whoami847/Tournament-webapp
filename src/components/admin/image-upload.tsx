'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Camera, AlertCircle, Loader2, Link, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/storage-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageUploadProps {
  initialImageUrl?: string;
  onUploadComplete: (url: string) => void;
  maxDimension?: number;
  quality?: number;
}

export function ImageUpload({ 
  initialImageUrl = '', 
  onUploadComplete, 
  maxDimension = 1024, 
  quality = 0.8 
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize tab based on existing image URL
  useEffect(() => {
    if (initialImageUrl) {
      // Check if it's a Firebase storage URL or external link
      if (initialImageUrl.includes('firebasestorage') || initialImageUrl.includes('googleapis')) {
        setActiveTab('upload');
      } else {
        setActiveTab('link');
        setLinkInput(initialImageUrl);
      }
    }
  }, [initialImageUrl]);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP).';
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB.';
    }

    return null;
  };

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast({
        title: 'Invalid File',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Show compression message for large files
      if (file.size > 500 * 1024) {
        toast({
          title: 'Processing Image',
          description: 'Optimizing image for better performance...',
        });
      }

      const downloadURL = await uploadImage(
        file, 
        `uploads/${Date.now()}-${file.name}`, 
        setProgress,
        maxDimension,
        quality
      );
      
      setImageUrl(downloadURL);
      onUploadComplete(downloadURL);
      // Clear link input when upload is successful
      setLinkInput('');
      
      toast({
        title: 'Image Uploaded Successfully',
        description: 'Your image has been uploaded and is ready to use.',
      });
    } catch (e) {
      const errorMessage = (e as Error).message || 'An unexpected error occurred during image upload.';
      setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLinkSubmit = () => {
    if (!linkInput.trim()) {
      setError('Please enter a valid image URL.');
      return;
    }

    if (!validateImageUrl(linkInput.trim())) {
      setError('Please enter a valid URL.');
      return;
    }

    setError(null);
    const url = linkInput.trim();
    setImageUrl(url);
    onUploadComplete(url);
    
    toast({
      title: 'Image Link Added',
      description: 'Image link has been set successfully.',
    });
  };

  const handleClearImage = () => {
    setImageUrl('');
    setLinkInput('');
    onUploadComplete('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'upload' | 'link');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearImage}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <Camera className="mx-auto h-12 w-12 mb-2" />
            <p>No image selected</p>
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin" />
              <p className="font-semibold">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 100 ? `Uploading... ${Math.round(progress)}%` : 'Finalizing upload...'}
          </p>
        </div>
      )}

      {/* Tabs for Upload/Link Options */}
      {!imageUrl && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={uploading}>
              <Camera className="mr-2 h-4 w-4" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="link" disabled={uploading}>
              <Link className="mr-2 h-4 w-4" />
              Image Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              disabled={uploading}
            />
            <Button 
              type="button" 
              onClick={triggerFileSelect} 
              disabled={uploading} 
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Choose Image File'}
            </Button>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                disabled={uploading}
              />
              <Button 
                type="button" 
                onClick={handleLinkSubmit}
                disabled={uploading || !linkInput.trim()}
              >
                <Link className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
