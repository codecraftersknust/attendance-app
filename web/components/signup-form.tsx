"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
    getStudentEmailError,
    getLecturerEmailError,
    getStudentIdError,
    getLecturerIdError,
    getPasswordError,
} from "@/lib/auth-validation";
import { LEVELS, levelToYearLabel } from "@/lib/level-utils";
import { PROGRAMMES } from "@/lib/programmes";

type Role = "student" | "lecturer";

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [role, setRole] = useState<Role>("student");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");
    const [lecturerId, setLecturerId] = useState("");
    const [level, setLevel] = useState<number>(100);
    const [programme, setProgramme] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const { start } = useTopLoader();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!fullName.trim()) {
            toast.error("Full name is required");
            return;
        }

        const emailErr = role === "student" ? getStudentEmailError(email) : getLecturerEmailError(email);
        if (emailErr) {
            toast.error(emailErr);
            return;
        }

        if (role === "student") {
            const idErr = getStudentIdError(studentId);
            if (idErr) {
                toast.error(idErr);
                return;
            }
            if (!programme.trim()) {
                toast.error("Please select your programme");
                return;
            }
        } else {
            const idErr = getLecturerIdError(lecturerId);
            if (idErr) {
                toast.error(idErr);
                return;
            }
        }

        const pwdErr = getPasswordError(password);
        if (pwdErr) {
            toast.error(pwdErr);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        try {
            setIsLoading(true);
            await register({
                email: email.trim(),
                password,
                full_name: fullName.trim(),
                role,
                user_id: role === "student" ? studentId.trim() : lecturerId.trim(),
                level: role === "student" ? level : undefined,
                programme: role === "student" ? programme.trim() : undefined,
            });

            toast.success("Account created successfully!");
            start();
            router.push(role === "student" ? "/auth/setup-face" : "/dashboard");
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
                <div className="flex flex-col items-center gap-3 text-center">
                    <Image src="/icon-2.png" alt="Absense" className="w-10 h-10 rounded-md" width={100} height={100} />
                    <h1 className="text-2xl font-bold text-emerald-900">
                        Create your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Join Absense for smart attendance
                    </p>
                </div>

                <Field>
                    <FieldLabel>Role <span className="text-red-500">*</span></FieldLabel>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${role === "student"
                                ? "bg-emerald-100 border-emerald-600 text-emerald-800"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("lecturer")}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${role === "lecturer"
                                ? "bg-emerald-100 border-emerald-600 text-emerald-800"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Lecturer
                        </button>
                    </div>
                </Field>

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
                        placeholder={role === "student" ? "username@st.knust.edu.gh" : "lecturer@knust.edu.gh"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Field>

                {role === "student" && (
                    <Field>
                        <FieldLabel htmlFor="student_id">
                            Student ID <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="student_id"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{8}"
                            placeholder="8 digits (e.g. 12345678)"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            required
                        />
                    </Field>
                )}

                {role === "lecturer" && (
                    <Field>
                        <FieldLabel htmlFor="lecturer_id">
                            Lecturer ID <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="lecturer_id"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{8}"
                            placeholder="8 digits (e.g. 12345678)"
                            value={lecturerId}
                            onChange={(e) => setLecturerId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            required
                        />
                    </Field>
                )}

                {role === "student" && (
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
                        <Field>
                            <FieldLabel>
                                Year <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Select
                                value={level ? level.toString() : ""}
                                onValueChange={(v) => setLevel(parseInt(v))}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select your year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEVELS.map((lvl) => (
                                        <SelectItem key={lvl} value={lvl.toString()}>
                                            {levelToYearLabel(lvl)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field>
                            <FieldLabel>
                                Programme <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Select
                                value={programme || ""}
                                onValueChange={(v) => setProgramme(v)}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select your programme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROGRAMMES.map((prog) => (
                                        <SelectItem key={prog} value={prog}>
                                            {prog}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Min 8 chars, letter + number"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
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
                            minLength={8}
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
