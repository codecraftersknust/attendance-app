"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const PROGRAMMES = [
    "Computer Engineering",
    "Telecommunication Engineering",
    "Electrical Engineering",
    "Biomedical Engineering",
];
const LEVELS = [100, 200, 300, 400];

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");
    const [level, setLevel] = useState<number>(100);
    const [programme, setProgramme] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!fullName.trim()) {
            toast.error("Fill in your full name");
            return;
        }

        if (!email.trim()) {
            toast.error("Fill in your email");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Check your email address");
            return;
        }

        if (!programme.trim()) {
            toast.error("Please select your programme");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            toast.error("Use at least 6 characters for password");
            return;
        }

        try {
            setIsLoading(true);
            await register({
                email: email.trim(),
                password,
                full_name: fullName.trim(),
                user_id: studentId.trim() || undefined,
                role: "student",
                level,
                programme: programme.trim(),
            });

            toast.success("Account created successfully!");
            router.push("/auth/setup-face");
        } catch {
            // Error handled in register
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={handleSubmit}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-emerald-900">
                        Create your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Join Absense for smart attendance
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="fullName">
                            Full Name <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Field>
                </div>

                <Field>
                    <FieldLabel htmlFor="student_id">
                        Student ID <span className="text-gray-500">(Optional)</span>
                    </FieldLabel>
                    <Input
                        id="student_id"
                        type="text"
                        placeholder="e.g., STU12345"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                    />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel>
                            Level <span className="text-red-500">*</span>
                        </FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {LEVELS.map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setLevel(lvl)}
                                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                                        level === lvl
                                            ? "bg-emerald-100 border-emerald-600 text-emerald-800"
                                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field>
                        <FieldLabel>
                            Programme <span className="text-red-500">*</span>
                        </FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {PROGRAMMES.map((prog) => (
                                <button
                                    key={prog}
                                    type="button"
                                    onClick={() => setProgramme(prog)}
                                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors truncate max-w-full ${
                                        programme === prog
                                            ? "bg-emerald-100 border-emerald-600 text-emerald-800"
                                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {prog}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="confirmPassword">
                            Confirm Password <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </Field>
                </div>

                <Field>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                </Field>

                <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <Link
                        className="text-amber-600 hover:text-amber-700 active:text-amber-800 font-medium underline-offset-2 hover:underline transition-colors"
                        href="/auth/login"
                    >
                        Sign in
                    </Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    );
}
