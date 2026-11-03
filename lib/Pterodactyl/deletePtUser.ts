import { describeResponse } from '../logger';

/** Deletes a Pterodactyl user (application API). Throws if the panel rejects the request. */
export default async function deletePtUser(ptUserId: number): Promise<void> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/users/${ptUserId}`,
        {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${process.env.PTERODACTYL_API_KEY}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to delete PT user ${ptUserId}: ${JSON.stringify(await describeResponse(response))}`,
        );
    }
}
