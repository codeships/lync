// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SocialsSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: "" },
    twitter:   { type: String, default: "" },
    facebook:  { type: String, default: "" },
    twitter: { type: String, default: "" },
    facebook: { type: String, default: "" },
  },
  { _id: false }
);

const ThemeSchema = new mongoose.Schema(
  {
    theme:           { type: String, enum: ["light", "dark", "system", "custom"], default: "light" },
    buttonStyle:     { type: String, enum: ["rounded", "square", "pill"], default: "rounded" },
    buttonColor:     { type: String, default: "#3b82f6" },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor:       { type: String, default: "#000000" },
    theme: {
      type: String,
      enum: ["light", "dark", "system", "custom"],
      default: "light",
    },
    buttonStyle: {
      type: String,
      enum: ["rounded", "square", "pill"],
      default: "rounded",
    },
    buttonColor: { type: String, default: "#3b82f6" },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#000000" },
  },
  { _id: false }
);

// simple handle normalizer (lowercase, spaces->dash, safe chars)
function normalizeHandle(s = "") {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

const UserSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false }, // <-- store hash here
    displayName:  { type: String, default: "" },
    handle:       { type: String, required: true, unique: true, lowercase: true, index: true },
    bio:          { type: String, default: "" },
    avatarUrl:    { type: String, default: "" },
    role:         { type: String, default: "user" },
    socials:      { type: SocialsSchema, default: () => ({}) },
    theme:        { type: ThemeSchema, default: () => ({}) },
    privacy:      { type: String, enum: ["public", "unlisted"], default: "public" },
  },
  { timestamps: true }
);

/* ------------------------- virtual: password (plain) ------------------------- */
// Set a plain password via user.password = '...'
UserSchema.virtual("password")
  .set(function (plain) {
    this._password = plain; // stash temporarily; hashed in pre-save
  });

/* ----------------------------- normalizations ----------------------------- */
UserSchema.pre("save", function (next) {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.trim().toLowerCase();
  }
  if (this.isModified("handle") && typeof this.handle === "string") {
    this.handle = normalizeHandle(this.handle);
  }
  next();
});

/* ------------------------------ hashing hooks ------------------------------ */
// Hash when creating/updating via .save() if a plain password was set
UserSchema.pre("save", async function (next) {
  if (this._password) {
    this.passwordHash = await bcrypt.hash(this._password, 10);
  }
  next();
});

// Hash when updating via findOneAndUpdate if 'password' is present in the update
UserSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  // Support direct fields and $set
  const plain =
    update.password ??
    (update.$set && update.$set.password);

  if (plain) {
    const hashed = await bcrypt.hash(plain, 10);
    if (update.$set) {
      update.$set.passwordHash = hashed;
      delete update.$set.password;
    } else {
      update.passwordHash = hashed;
      delete update.password;
    }
    this.setUpdate(update);
  }

  // Normalize handle if updated
  const newHandle =
    update.handle ??
    (update.$set && update.$set.handle);
  if (newHandle) {
    const norm = normalizeHandle(newHandle);
    if (update.$set) update.$set.handle = norm;
    else update.handle = norm;
    this.setUpdate(update);
  }

  next();
});

/* ---------------------------- compare helper ---------------------------- */
UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false; // guard to avoid "Illegal arguments"
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
