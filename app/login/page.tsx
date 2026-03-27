"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-xl w-full max-w-sm"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
      >
        <h1 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--text-primary)" }}>
          Paraguay Decision Dashboard
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg mb-4 text-sm"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          autoFocus
        />
        {error && <p className="text-sm mb-4" style={{ color: "var(--red)" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
          style={{ background: "var(--amber)", color: "#000" }}
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
