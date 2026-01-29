'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const pathname = usePathname();

    const segments = pathname
        .split("/")
        .filter(Boolean);

    const buildHref = (index: number) => {
        return "/" + segments.slice(0, index + 1).join("/");
    };

    const formatLabel = (slug: string) => {
        return slug
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const hasSegments = segments.length > 0;
    const hasDropdown = segments.length > 2;
    const secondLastIndex = segments.length - 2;
    const lastIndex = segments.length - 1;

    return (
        <header className="bg-emerald-900 shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <Breadcrumb>
                    <BreadcrumbList>
                        {!hasSegments ? (
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-white">Home</BreadcrumbPage>
                            </BreadcrumbItem>
                        ) : (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild className="text-white/90 hover:text-white">
                                        <Link href="/">Home</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />

                                {hasDropdown && (
                                    <>
                                        <BreadcrumbItem>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex items-center gap-1 text-white/90 hover:text-white">
                                                    <BreadcrumbEllipsis className="size-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {segments.slice(0, secondLastIndex).map((segment, index) => {
                                                        const href = buildHref(index);
                                                        const label = formatLabel(segment);
                                                        return (
                                                            <DropdownMenuItem key={href}>
                                                                <Link href={href}>{label}</Link>
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                    </>
                                )}

                                {segments.length >= 2 && (
                                    <>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink asChild className="text-white/90 hover:text-white">
                                                <Link href={buildHref(secondLastIndex)}>
                                                    {formatLabel(segments[secondLastIndex])}
                                                </Link>
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                    </>
                                )}

                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        {formatLabel(segments[lastIndex])}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    );
}