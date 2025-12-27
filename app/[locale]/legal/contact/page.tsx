export default async function Page() {
    return (
        <div className="p-2 md:p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Contact Us</h1>

            <p className="mb-4">
                For enquiries, email us at{' '}
                <a href="mailto:xxxx" className="text-blue-600 underline">
                    info@scyed.com
                </a>
                .
            </p>
        </div>
    );
}
