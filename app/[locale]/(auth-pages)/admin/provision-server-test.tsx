"use client";
import { useState } from "react";

export default function ProvisionServerAdmin() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProvision() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/provision-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Provision Server (Admin Test)</h1>
      <label className="block mb-2 font-medium">Server Order ID</label>
      <input
        className="border px-3 py-2 rounded w-full mb-4"
        value={orderId}
        onChange={e => setOrderId(e.target.value)}
        placeholder="Enter GameServerOrder ID"
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleProvision}
        disabled={loading || !orderId}
      >
        {loading ? "Provisioning..." : "Provision Server"}
      </button>
      {result && (
        <pre className="mt-4 p-2 bg-green-100 rounded text-sm overflow-x-auto">{result}</pre>
      )}
      {error && (
        <pre className="mt-4 p-2 bg-red-100 rounded text-sm overflow-x-auto text-red-700">{error}</pre>
      )}
    </div>
  );
}
