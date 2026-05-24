import React from 'react';
import { Bell } from 'lucide-react';
import type { NotificationType } from '../../../types/notifications.types';

function NotificationsList({
    notifications
}: {
    notifications: NotificationType[];
}) {

    if (!notifications.length) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Bell size={32} className="mb-2 opacity-60" />
                <p>No notifications found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto p-4">
            {notifications.map((notification) => (
                <div
                    key={notification._id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-sm text-gray-800">
                                {notification.message}
                            </p>

                            <p className="text-sm font-medium text-gray-600 mt-2">
                                {notification.assignmentName}
                            </p>
                        </div>

                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default NotificationsList;