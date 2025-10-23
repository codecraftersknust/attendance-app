import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const { nextUrl, cookies } = req;
    const path = nextUrl.pathname;

    const token = cookies.get('access_token')?.value;
    const role = cookies.get('role')?.value as 'student' | 'lecturer' | 'admin' | undefined;

    const isAuthPage = path.startsWith('/auth');
    const isProtected =
        path === '/dashboard' || path.startsWith('/student') || path.startsWith('/lecturer');
    const isAdminRoute = path.startsWith('/admin');
    const isAdminLogin = path === '/admin/login';

    // General protected routes
    if (!token && isProtected) {
        const url = new URL('/auth/login', nextUrl);
        url.searchParams.set('redirect', path);
        return NextResponse.redirect(url);
    }

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    if (role === 'student' && path.startsWith('/lecturer')) {
        return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
    if (role === 'lecturer' && path.startsWith('/student')) {
        return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }

    // Admin area protection
    if (isAdminRoute) {
        if (!isAdminLogin && !token) {
            return NextResponse.redirect(new URL('/admin/login', nextUrl));
        }
        if (token && isAdminLogin && role === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
        }
        if (!isAdminLogin && role !== 'admin') {
            return NextResponse.redirect(new URL('/unauthorized', nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/auth/:path*', '/dashboard', '/student/:path*', '/lecturer/:path*', '/admin/:path*'],
};
