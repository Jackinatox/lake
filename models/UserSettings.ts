export type UserSettings = {
    NewsLetter: NotificationSettings
    ServerExpires7Days: NotificationSettings
    ServerExpires1Day: NotificationSettings
    ServerDeleted: NotificationSettings
};

type NotificationSettings = {
    emailNotifications: boolean;
    pushNotifications: boolean;
};

export const defaultUserSettings: UserSettings = {
    NewsLetter: {
        emailNotifications: false,
        pushNotifications: false,
    },
    ServerExpires7Days: {
        emailNotifications: true,
        pushNotifications: false,
    },
    ServerExpires1Day: {
        emailNotifications: true,
        pushNotifications: false,
    },
    ServerDeleted: {
        emailNotifications: true,
        pushNotifications: false,
    },
};