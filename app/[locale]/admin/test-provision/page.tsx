"use client"

"use client"

import { provisionAction } from "@/app/actions/provision";
import { useState } from "react";

export default function TestProvisionPage() {
    const [orderId, setOrderId] = useState("");
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await provisionAction(orderId);
        setResult(res);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Test Server Provisioning</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
                        Order ID
                    </label>
                    <input
                        type="text"
                        id="orderId"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Provision Server
                </button>
            </form>
            {result && (
                <div className={`mt-4 p-4 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    <p>{result.message}</p>
                </div>
            )}
        </div>
    );
}
