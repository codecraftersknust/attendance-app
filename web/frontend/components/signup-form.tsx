"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [userRole, setUserRole] = useState<"student" | "lecturer">("student")
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [studentId, setStudentId] = useState("")
    const [studentIdError, setStudentIdError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { register } = useAuth()
    const router = useRouter()

    const validateEmail = (email: string, role: "student" | "lecturer") => {
        if (!email) return ""

        if (role === "student") {
            const studentEmailPattern = /^[a-zA-Z0-9._%+-]+@st\.knust\.edu\.gh$/
            if (!studentEmailPattern.test(email)) {
                return "Student email must be in the format: username@st.knust.edu.gh"
            }
        } else if (role === "lecturer") {
            const lecturerEmailPattern = /^[a-zA-Z0-9._%+-]+@knust\.edu\.gh$/
            if (!lecturerEmailPattern.test(email)) {
                return "Lecturer email must be in the format: username@knust.edu.gh"
            }
        }

        return ""
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value
        setEmail(newEmail)
        setEmailError(validateEmail(newEmail, userRole))
    }

    const handleRoleChange = (role: "student" | "lecturer") => {
        setUserRole(role)
        if (email) {
            setEmailError(validateEmail(email, role))
        }
        // Reset student id validation on role change
        if (role !== "student") {
            setStudentId("")
            setStudentIdError("")
        }
    }

    const getEmailPlaceholder = () => {
        return userRole === "student" ? "jdadoo@st.knust.edu.gh" : "kotenggyasi@knust.edu.gh"
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validate email one more time before submission
        const finalEmailError = validateEmail(email, userRole)
        if (finalEmailError) {
            setEmailError(finalEmailError)
            return
        }

        // Validate student id if role is student: exactly 8 digits
        if (userRole === "student") {
            const id = (e.currentTarget.elements.namedItem("student_id") as HTMLInputElement)?.value || studentId
            const idValid = /^\d{8}$/.test(id)
            if (!idValid) {
                setStudentIdError("Student ID must be exactly 8 digits")
                return
            }
            setStudentIdError("")
        }

        // Get form data
        const formData = new FormData(e.currentTarget)
        const formObject = {
            email: email,
            password: formData.get("password") as string,
            confirmPassword: formData.get("confirm-password") as string,
            role: userRole,
            fullName: formData.get("fullName") as string || "",
            student_id: formData.get("student_id") as string | null
        }

        // Basic validation
        if (formObject.password !== formObject.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (formObject.password.length < 8) {
            toast.error("Password must be at least 8 characters long")
            return
        }

        try {
            setIsLoading(true)
            await register({
                email: formObject.email,
                password: formObject.password,
                full_name: formObject.fullName,
                role: formObject.role,
                student_id: formObject.role === "student" ? (formObject.student_id || undefined) : undefined
            })

            // Redirect to dashboard after successful registration
            router.push('/dashboard')
        } catch (error) {
            // Error is already handled in the register function
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold text-emerald-900">Create your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Fill in the form below to create your account
                    </p>
                </div>

                <Field>
                    <FieldLabel>Account Type</FieldLabel>
                    <RadioGroup
                        value={userRole}
                        onValueChange={handleRoleChange}
                        className="flex flex-row gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="student" id="student" />
                            <Label htmlFor="student" className="cursor-pointer">Student</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lecturer" id="lecturer" />
                            <Label htmlFor="lecturer" className="cursor-pointer">Lecturer</Label>
                        </div>
                    </RadioGroup>
                    <FieldDescription>
                        Select whether you are a student or lecturer
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder={getEmailPlaceholder()}
                        value={email}
                        onChange={handleEmailChange}
                        required
                        className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && (
                        <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                    <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        required
                    />
                </Field>

                {userRole === "student" && (
                    <Field>
                        <FieldLabel htmlFor="student_id">Student ID</FieldLabel>
                        <Input
                            id="student_id"
                            name="student_id"
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="8-digit student ID"
                            value={studentId}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                setStudentId(value)
                                setStudentIdError(/^\d{8}$/.test(value) ? "" : "Student ID must be exactly 8 digits")
                            }}
                            required
                            className={studentIdError ? "border-red-500" : ""}
                        />
                        {studentIdError && (
                            <p className="text-red-500 text-sm mt-1">{studentIdError}</p>
                        )}
                    </Field>
                )}

                <Field>
                    <Field className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" name="password" type="password" required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirm-password">
                                Confirm Password
                            </FieldLabel>
                            <Input id="confirm-password" name="confirm-password" type="password" required />
                        </Field>
                    </Field>
                    <FieldDescription>
                        Must be at least 8 characters long.
                    </FieldDescription>
                </Field>
                <Field>
                    <Button
                        className="bg-emerald-900 hover:bg-emerald-900/90"
                        type="submit"
                        disabled={!!emailError || !email || isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                </Field>
                <FieldDescription className="text-center">
                    Already have an account? <Link className="hover:text-white/80" href="/auth/login">Sign in</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    )
}
