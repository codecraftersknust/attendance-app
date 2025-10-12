"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
}: React.ComponentProps<"div">) {
    const [userRole, setUserRole] = useState<"student" | "lecturer">("student")
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
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

        // Get form data
        const formData = new FormData(e.currentTarget)
        const formObject = {
            email: email,
            password: formData.get("password") as string,
            confirmPassword: formData.get("confirm-password") as string,
            role: userRole,
            fullName: formData.get("fullName") as string || ""
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
                role: formObject.role
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
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 border-none">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold text-emerald-900">Create your account</h1>
                                <p className="text-muted-foreground text-sm text-balance">
                                    Choose your role and enter your email below to create your account
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
                                    Select whether you are a student or lecturer at KNUST
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
                                <FieldDescription>
                                    {userRole === "student"
                                        ? "Enter your student email (ending with @st.knust.edu.gh)"
                                        : "Enter your lecturer email (ending with @knust.edu.gh)"
                                    }
                                </FieldDescription>
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
                                <FieldDescription>
                                    Enter your full name as it appears on your KNUST ID
                                </FieldDescription>
                            </Field>

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
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/students.jpg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center text-white">
                By clicking continue, you agree to our <Link className="hover:text-white/80" href="#">Terms of Service</Link>{" "}
                and <Link className="hover:text-white/80" href="#">Privacy Policy</Link>.
            </FieldDescription>
        </div>
    )
}
