import mongoose, { Schema, model } from "mongoose";


const NotificationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    assignmentName: {
        type: String,
        required: true
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AssignmentInput",
    }
}, {
    timestamps: true
})

export const NotificationsModel = mongoose.models.Notification || model("Notification", NotificationSchema); 