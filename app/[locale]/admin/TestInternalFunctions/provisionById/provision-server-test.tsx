'use client';
import { useState, useTransition } from 'react';
import { testProvisionServer } from './testProvisionServer';
import { Info } from 'lucide-react';

export default function ProvisionServerTest() {
    const [orderId, setOrderId] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleProvision() {
        setResult(null);
        setError(null);
        startTransition(async () => {
            try {
                const res = await testProvisionServer(orderId);
                if (res?.success) {
                    setResult(JSON.stringify(res, null, 2));
                } else {
                    // Prefer structured error.message if present, otherwise stringify
                    const msg = res?.error?.message ?? JSON.stringify(res?.error ?? res);
                    setError(typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2));
                }
            } catch (e: any) {
                // Fallback for unexpected throw shapes
                setError(JSON.stringify(e));
            }
        });
    }

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 border rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Provision Server</h1>
            <div className="flex items-start mb-4 p-3 bg-blue-50 rounded">
                <Info className="w-5 h-5 text-blue-600 mt-1 mr-3 shrink-0" />
                <p className="text-blue-800 text-lg">
                    Die ServerOrder wird überschrieben mit den neuen Daten. Am besten nur für Server
                    ausführen, die noch nicht erstellt wurden, oder zu Debug-Zwecken verwenden.
                </p>
            </div>
            <label className="block mb-2 font-medium">Server Order ID</label>
            <input
                className="border px-3 py-2 rounded w-full mb-4"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter GameServerOrder ID"
            />
            <button
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={handleProvision}
                disabled={isPending || !orderId}
            >
                {isPending ? 'Provisioning...' : 'Provision Server'}
            </button>
            {result && (
                <pre className="mt-4 p-2 bg-green-100 rounded text-sm overflow-x-auto">
                    {result}
                </pre>
            )}
            {error && (
                <pre className="mt-4 p-2 bg-red-100 rounded text-sm overflow-x-auto text-red-700">
                    {error}
                </pre>
            )}
        </div>
    );
}
