import { useState } from 'react';
import { HiXMark } from 'react-icons/hi2';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`relative ${sizes[size]} w-full mx-4 bg-white rounded-2xl shadow-2xl
                       transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
                    <h2 className="text-lg font-bold text-dark-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-dark-100 transition-colors"
                    >
                        <HiXMark className="w-5 h-5 text-dark-400" />
                    </button>
                </div>
                {/* Content */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
