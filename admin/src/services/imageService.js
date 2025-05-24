import imageCompression from 'browser-image-compression';
import logger from '../utils/logger';

export const optimizeImage = async (file, options = {}) => {
    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        const compressedFile = await imageCompression(
            file,
            { ...defaultOptions, ...options }
        );

        // Convert to WebP
        const optimizedBlob = new Blob([compressedFile], { 
            type: 'image/webp' 
        });

        return new File(
            [optimizedBlob],
            file.name.replace(/\.[^/.]+$/, '.webp'),
            { type: 'image/webp' }
        );
    } catch (error) {
        logger.error('Image optimization error:', error);
        return file; // Return original file if optimization fails
    }
};

export const createImagePreview = (file) => {
    return URL.createObjectURL(file);
};

export const revokeImagePreview = (previewUrl) => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
    }
};