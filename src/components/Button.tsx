import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    type = 'button',
    disabled = false,
    loading = false,
}) => {
    const baseStyles = 'px-8 py-3 rounded-full font-medium text-base transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-primary text-background hover:bg-primary/90 hover:shadow-glow',
        secondary: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/10 hover:shadow-glow',
        success: 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg',
        danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg',
        ghost: 'bg-transparent text-white hover:bg-white/10',
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </span>
            ) : children}
        </motion.button>
    );
};
