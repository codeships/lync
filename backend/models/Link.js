import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
    clicks: { type: Number, default: 0, min: 0 }, // ⚠️ Suggestion: Consider using a `Number` with `min: 0` to avoid negative values
  },
  { timestamps: true }
);

// ⚠️ Suggestion: Add a compound index if queries often use (user + order) or (user + isActive)
LinkSchema.index({ user: 1, order: 1});
LinkSchema.index({ user: 1, isActive: 1});

export default mongoose.model("Link", LinkSchema);
