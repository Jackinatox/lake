import { prisma } from "@/prisma";
import { generateFromEmail, generateUsername } from "unique-username-generator";

const MAX_ATTEMPTS = 100;

export default async function generateUniqueUserName(email: string): Promise<string> {
    const fromEmail = generateFromEmail(email, 3);
    const baseCandidate = normalizeCandidate(fromEmail);

    let attempt = 0;
    let suffix = 1;
    let candidate = baseCandidate || normalizeCandidate(generateUsername());

    while (attempt < MAX_ATTEMPTS) {
        if (!candidate) {
            candidate = normalizeCandidate(generateUsername());
            attempt++;
            continue;
        }

        if (await checkAvailability(candidate)) {
            return candidate;
        }

        candidate = baseCandidate
            ? normalizeCandidate(`${baseCandidate}${suffix++}`)
            : normalizeCandidate(generateUsername());
        attempt++;
    }

    throw new Error("Unable to generate a unique username after multiple attempts.");
}

function normalizeCandidate(username: string): string {
    return username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

async function checkAvailability(username: string): Promise<boolean> {
    if (!username) {
        return false;
    }

    const userCount = await prisma.user.count({ where: { ptUsername: username } });
    return userCount === 0;
}