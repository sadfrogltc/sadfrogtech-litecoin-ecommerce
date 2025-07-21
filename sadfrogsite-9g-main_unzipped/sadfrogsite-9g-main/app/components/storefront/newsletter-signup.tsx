import { useState } from "react"

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [error, setError] = useState("");

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log("Subscribe response:", data);
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setError("Network or server error.");
      console.error("Subscribe error:", err);
    }
  }

  return (
    <section className="py-16 bg-background border-t">
      <div className="container mx-auto px-4 max-w-xl">
        <h3 className="text-2xl font-bold mb-2">Subscribe for Updates</h3>
        <p className="mb-4 text-muted-foreground">Get the latest news, product drops, and exclusive offers.</p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
          <input
            type="email"
            className="flex-1 border rounded px-4 py-2"
            placeholder="you@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded">Subscribe</button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {status === "success" && <div className="text-green-600 mt-2">Thank you for subscribing!</div>}
        {status === "error" && <div className="text-red-600 mt-2">Something went wrong. Please try again.</div>}
      </div>
    </section>
  );
} 