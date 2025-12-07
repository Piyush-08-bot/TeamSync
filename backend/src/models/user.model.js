import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    Bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log('Comparing password:');
  console.log('  Candidate password type:', typeof candidatePassword);
  console.log('  Stored password type:', typeof this.password);
  console.log('  Stored password value:', this.password);
  
  if (!candidatePassword || !this.password) {
    throw new Error('Password comparison failed: missing password data');
  }
  
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password comparison result:', result);
  return result;
};

export const User = mongoose.model("User", userSchema);