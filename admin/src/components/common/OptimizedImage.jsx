import React, { useState } from 'react';
import { Image } from 'react-bootstrap';
import { PLACEHOLDER_IMAGE_PATH } from '../../utils/constants';

const OptimizedImage = ({ 
    src, 
    alt, 
    width, 
    height, 
    className = '', 
    style = {},
    onClick 
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className={`position-relative ${className}`}>
            {isLoading && (
                <div 
                    className="position-absolute w-100 h-100 bg-light animate-pulse"
                    style={{ 
                        top: 0, 
                        left: 0,
                        minHeight: height || '60px' 
                    }} 
                />
            )}
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`
                    transition-opacity duration-300
                    ${isLoading ? 'opacity-0' : 'opacity-100'}
                    ${error ? 'hidden' : 'block'}
                `}
                style={{
                    ...style,
                    objectFit: 'cover'
                }}
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                    setError(true);
                    setIsLoading(false);
                    e.target.src = PLACEHOLDER_IMAGE_PATH;
                }}
                onClick={onClick}
                loading="lazy"
            />
        </div>
    );
};

export default OptimizedImage;