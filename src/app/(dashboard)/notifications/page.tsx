import React from 'react';
import { NotificationsModel } from '../../../../models/notifications.model';
import NotificationsList from '@/_components/notifications/NotificationsList';
import { Suspense } from 'react';
import { Loader } from '@/_components/utils/loader';

async function page() {

    const notifications = await NotificationsModel.find({}).lean().sort({ createdAt: -1 });

    notifications.map((notification) => (
        notification._id = String(notification._id),
        notification.assignmentId = String(notification.assignmentId)
    ))



    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader />
                </div>
            }
        >
            <NotificationsList notifications={notifications} />
        </Suspense>
    )
}

export default page
