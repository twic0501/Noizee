import React, { useState, useCallback } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';
import imageCompression from 'browser-image-compression';
import logger from '../../utils/logger';

const ImageUpload = ({
    onUpload,
    maxFiles = 5,
    maxSizeMB = 1,
    disabled = false,
    acceptedFileTypes = {
        'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    className = ''
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = useCallback(async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            const optimizedFiles = await Promise.all(
                Array.from(files).map(async file => {
                    try {
                        const compressedFile = await imageCompression(file, {
                            maxSizeMB,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            fileType: 'image/webp'
                        });

                        return compressedFile;
                    } catch (err) {
                        logger.error('Image compression error:', err);
                        return file; // Return original if compression fails
                    }
                })
            );

            await onUpload(optimizedFiles);
            event.target.value = null; // Reset input
        } catch (err) {
            logger.error('Image upload error:', err);
            setError(err.message || 'Có lỗi xảy ra khi xử lý ảnh');
        } finally {
            setIsProcessing(false);
        }
    }, [onUpload, maxSizeMB]);

    return (
        <div className={className}>
            <Form.Group controlId="imageUpload">
                <Form.Control
                    type="file"
                    multiple
                    accept={Object.keys(acceptedFileTypes).join(',')}
                    onChange={handleFileChange}
                    disabled={disabled || isProcessing}
                    size="sm"
                />
                {isProcessing && (
                    <div className="d-flex align-items-center mt-2">
                        <Spinner 
                            animation="border" 
                            size="sm" 
                            className="me-2"
                        />
                        <small className="text-muted">
                            Đang xử lý ảnh...
                        </small>
                    </div>
                )}
                {error && (
                    <Alert variant="danger" className="mt-2 py-2">
                        <small>{error}</small>
                    </Alert>
                )}
            </Form.Group>
        </div>
    );
};

export default ImageUpload;