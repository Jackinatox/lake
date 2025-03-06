export function checkIfAdmin(userId: string): boolean{
    const admins: string[] = JSON.parse(process.env.ADMIN_IDS);

    return admins.includes(userId);
}