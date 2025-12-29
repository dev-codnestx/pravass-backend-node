import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

import { IUserDoc, IUserModel } from './user.interfaces.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) throw new Error('Invalid email');
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/))
          throw new Error('Password must contain at least one letter and one number');
      },
      private: true, // used by the toJSON plugin
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      dialCode: {
        type: Number,
        required: true,
      },
      phone: {
        type: Number,
        required: true,
      },
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    company: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
      role: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Role',
        },
      ],
      _id: false,
    },

    subCompany: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
      role: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Role',
        },
      ],
      _id: false,
    },
    reportingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inActive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static('isEmailTaken', async function (email: string, excludeUserId: mongoose.ObjectId): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
});

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method('isPasswordMatch', async function (password: string): Promise<boolean | void> {
  const user = this;
  return bcrypt.compare(password, user.password);
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) user.password = await bcrypt.hash(user.password, 8);

  next();
});

const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);

export default User;
