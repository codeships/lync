// models/dashboard.model.js
import mongoose from "mongoose";

const WidgetSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., "chart", "stat", "list"
    title: String,
    config: { type: Object, default: {} },
  },
  { _id: false }
);

const DashboardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    layout: { type: Object, default: {} },    // grid layout, positions, etc.
    widgets: { type: [WidgetSchema], default: [] },
    visibility: { type: String, enum: ["private", "public", "unlisted"], default: "private" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Dashboard", DashboardSchema);
