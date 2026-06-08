type UserLike = {
    username?: string | null;
    displayUsername?: string | null;
    name?: string | null;
    email?: string | null;
};

export function getUserDisplayName(user: UserLike | null | undefined): string {
    const username = user?.username?.trim();
    if (username) return username;

    const displayUsername = user?.displayUsername?.trim();
    if (displayUsername) return displayUsername;

    const name = user?.name?.trim();
    if (name) return name;

    const email = user?.email?.trim();
    if (email) return email;

    return 'User';
}

export function getUserInitials(user: UserLike | null | undefined): string {
    const displayName = getUserDisplayName(user);
    const parts = displayName
        .split(/[\s._-]+/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length === 0) return 'U';

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}
