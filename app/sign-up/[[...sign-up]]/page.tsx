import { SignUp } from "@clerk/nextjs";
import { Zap } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary mb-3">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">AgentForge</h1>
          <p className="text-sm text-slate-500">Create your account to get started</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md border border-border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
