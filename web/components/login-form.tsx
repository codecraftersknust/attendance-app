"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useTopLoader } from "nextjs-toploader"
import toast from "react-hot-toast"
import { getLoginIdentifierError } from "@/lib/auth-validation"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
    const { start } = useTopLoader()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const identifierErr = getLoginIdentifierError(email)
        if (identifierErr) {
            toast.error(identifierErr)
            return
        }

        if (!password.trim()) {
            toast.error("Password is required")
            return
        }

        try {
            setIsLoading(true)
            await login(email.trim(), password)

            // Redirect based on user role - trigger top loader for programmatic nav
            start()
            router.push('/dashboard')
        } catch (error) {
            // Error is already handled in the login function
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
                            <div className="flex flex-col items-center gap-3 text-center">
                                <Image src="/icon-2.png" alt="Absense" className="w-10 h-10 rounded-md" width={100} height={100} />
                                <h1 className="text-2xl font-bold text-emerald-900">Welcome back</h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your Absense account
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="email">Email or KNUST ID <span className="text-red-500">*</span></FieldLabel>
                                <Input
                                    id="email"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Email or 8-digit ID"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password <span className="text-red-500">*</span></FieldLabel>
                                    <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </Field>
                            <Field>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={!email.trim() || !password.trim() || isLoading}
                                >
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                            </Field>
                            <FieldDescription className="text-center">
                                Don&apos;t have an account? <Link className="text-amber-600 hover:text-amber-700 active:text-amber-800 font-medium underline-offset-2 hover:underline transition-colors" href="/auth/register">Sign up</Link>
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
                By clicking continue, you agree to our <Link className="hover:text-white/80" href="/terms">Terms of Service</Link>{" "}
                and <Link className="hover:text-white/80" href="/privacy">Privacy Policy</Link>.
            </FieldDescription>
        </div>
    )
}
