import mongoose from "mongoose";

const SocialsSchema = new mongoose.Schema({
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
}, { _id: false });

const ThemeSchema = new mongoose.Schema({
    theme: { type: String, enum: ['light', 'dark', 'system', 'custom'], default: 'light' },
    buttonStyle: { type: String, enum: ['rounded', 'square', 'pill'], default: 'rounded' },
    buttonColor: { type: String, default: '#3b82f6'},
    backgroundColor: { type: String, default: '#ffffff'},
    textColor: { type: String, default: '#000000'}
}, { _id: false });

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: '' },
    handle: { type: String, required: true, unique: true, lowercase: true, index: true },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    socials: { type: SocialsSchema, default: () => ({}) },
    theme: { type: ThemeSchema, default: () => ({}) },
    privacy: { type: String, enum: ['public', 'unlisted'], default: 'public' },
}, { timestamps: true });

export default mongoose.model("User", UserSchema)