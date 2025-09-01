import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "shadow-xl",
            headerTitle: "Sign in to VemoRable",
            headerSubtitle: "Welcome back! Please sign in to continue",
          },
        }}
      />
    </div>
  );
}