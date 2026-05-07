import { useCallback, useEffect, useRef, useState } from 'react';
import {
  attachImage,
  detachImage,
  getImageBlob,
  ImageValidationError,
} from '../../services/imageService';
import type { Language } from '../../types';

/**
 * Hook to load + manage the custom image for a single flashcard word.
 *
 * - Returns an object URL (or null) for direct use in <img src={url} />
 * - Revokes old URLs on word change to avoid memory leaks
 * - Exposes upload + remove actions with loading/error state
 *
 * Usage:
 *   const { imageUrl, uploading, error, uploadImage, removeImage } = useCustomImage(word.id, word.lang);
 *   return imageUrl ? <img src={imageUrl} /> : <UploadButton onClick={...} />;
 */
export function useCustomImage(wordId: string, lang: Language) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current object URL so we can revoke it on change/unmount
  const currentUrlRef = useRef<string | null>(null);

  // Load image for this word
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await getImageBlob(wordId);

      // Revoke previous URL before replacing
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        currentUrlRef.current = url;
        setImageUrl(url);
      } else {
        setImageUrl(null);
      }
    } catch (err) {
      console.error('[useCustomImage] load failed:', err);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  }, [wordId]);

  // Load on wordId change
  useEffect(() => {
    load();
    // Cleanup on unmount or wordId change
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [wordId, load]);

  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        await attachImage(wordId, lang, file);
        await load(); // refresh URL
      } catch (err) {
        if (err instanceof ImageValidationError) {
          setError(err.message);
        } else {
          setError('Upload thất bại. Vui lòng thử lại.');
          console.error('[useCustomImage] upload failed:', err);
        }
      } finally {
        setUploading(false);
      }
    },
    [wordId, lang, load]
  );

  const removeImage = useCallback(async () => {
    setUploading(true); // reuse busy flag
    setError(null);
    try {
      await detachImage(wordId);
      await load();
    } catch (err) {
      setError('Xoá thất bại. Vui lòng thử lại.');
      console.error('[useCustomImage] delete failed:', err);
    } finally {
      setUploading(false);
    }
  }, [wordId, load]);

  return {
    imageUrl,
    loading,
    uploading,
    error,
    uploadImage,
    removeImage,
    /** Manually refresh (e.g. after auth change triggers sync) */
    refresh: load,
  };
}
