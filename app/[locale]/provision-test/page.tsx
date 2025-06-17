"use client"

import { useState } from "react";
import { provisionServerAction } from "../../actions/provisionServerAction";

export default function ProvisionTestPage() {
  const [intentId, setIntentId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await provisionServerAction(Number(intentId));
      setResult(res);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Provision Server Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          className="border p-2 w-full rounded"
          placeholder="Enter intentId"
          value={intentId}
          onChange={e => setIntentId(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Provisioning..." : "Provision Server"}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
