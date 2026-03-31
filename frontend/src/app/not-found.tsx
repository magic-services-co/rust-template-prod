import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-2xl font-semibold text-muted-foreground">
                    Page not found
                </h2>
                <p className="text-muted-foreground max-w-[600px]">
                    {"Sorry, we couldn't find the page you're looking for. Please check the URL or return home."}
                </p>
                <Link 
                    href="/"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Return Home
                </Link>
            </div>
        </main>
    )
} 