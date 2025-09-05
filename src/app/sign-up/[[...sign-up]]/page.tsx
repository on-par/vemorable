import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "shadow-xl",
            headerTitle: "Create your VeMorable account",
            headerSubtitle: "Start transforming your voice into organized knowledge",
          },
        }}
      />
    </div>
  );
}