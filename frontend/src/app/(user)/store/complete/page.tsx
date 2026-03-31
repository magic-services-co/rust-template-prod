"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function StoreCompleteContent() {
    const searchParams = useSearchParams();
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const returnUrl = searchParams.get('return_url');
        
        let targetUrl: string;
        
        if (returnUrl) {
            try {
                targetUrl = decodeURIComponent(returnUrl);
            } catch (error) {
                targetUrl = '/store?success=true';
            }
        } else {
            targetUrl = '/store?success=true';
        }
        
        setRedirectUrl(targetUrl);
        
        const redirectTimer = setTimeout(() => {
            setIsRedirecting(true);
            window.location.replace(targetUrl);
        }, 100);

        return () => {
            clearTimeout(redirectTimer);
        };
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Completing your purchase...</p>
                <p className="text-gray-400 text-sm mt-2">
                    {isRedirecting ? 'Redirecting now...' : 'Preparing to redirect...'}
                </p>
                {redirectUrl && (
                    <p className="text-gray-500 text-xs mt-4">
                        If you are not redirected automatically,{' '}
                        <a 
                            href={redirectUrl} 
                            className="underline text-blue-400 hover:text-blue-300"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.replace(redirectUrl);
                            }}
                        >
                            click here
                        </a>.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function StoreCompletePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        }>
            <StoreCompleteContent />
        </Suspense>
    );
}

