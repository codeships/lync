import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Link', LinkSchema);