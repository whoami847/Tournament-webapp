'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/storage-service';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const triggerFileSelect = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt="Uploaded preview" fill className="object-cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Camera className="mx-auto h-12 w-12 mb-2" />
            <p>No image uploaded</p>
          </div>
        )}
        
        {!uploading && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={triggerFileSelect}
          >
            <div className="text-center text-white">
              <Camera className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">{imageUrl ? 'Change Image' : 'Upload Image'}</p>
            </div>
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        disabled={uploading}
      />

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 100 ? `Uploading... ${Math.round(progress)}%` : 'Finalizing upload...'}
          </p>
        </div>
      )}
      
      {!uploading && !imageUrl && (
        <Button 
          type="button" 
          onClick={triggerFileSelect} 
          disabled={uploading} 
          className="w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
