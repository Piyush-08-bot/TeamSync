import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { FriendRequest } from "../models/friendRequest.model.js";

export async function getRecommendedUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId);

        const recommendedUsers = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, 
                { _id: { $nin: currentUser.friends } }, 
                { isOnboarded: true },
            ],
        }).select("-password");

        res.status(200).json(recommendedUsers);
    } catch (error) {
        console.error("Error in getRecommendedUsers controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user._id)
            .select("friends")
            .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getMyFriends controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user._id;
        const { id: recipientId } = req.params;

        
        if (myId.toString() === recipientId) {
            return res.status(400).json({ message: "You can't send friend request to yourself" });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        
        if (recipient.friends.includes(myId)) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }

        
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId },
            ],
        });

        if (existingRequest) {
            return res
                .status(400)
                .json({ message: "A friend request already exists between you and this user" });
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId,
        });

        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error in sendFriendRequest controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        
        if (friendRequest.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to accept this request" });
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        
        
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient },
        });

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender },
        });

        res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
        console.log("Error in acceptFriendRequest controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getFriendRequests(req, res) {
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user._id,
            status: "pending",
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user._id,
            status: "accepted",
        }).populate("recipient", "fullName profilePic");

        res.status(200).json({ incomingReqs, acceptedReqs });
    } catch (error) {
        console.log("Error in getFriendRequests controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user._id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.log("Error in getOutgoingFriendReqs controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export async function getAllUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        
        const users = await User.find({
            _id: { $ne: currentUserId },
            isOnboarded: true
        })
        .select("-password")
        .sort({ name: 1 })
        .limit(100); 

        res.status(200).json(
            users.map(user => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.Bio,
                profilePic: user.profilePic
            }))
        );
    } catch (error) {
        console.error("❌ Error in getAllUsers controller:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
}


export async function searchUser(req, res) {
    try {
        console.log('🔍 Search user endpoint called');
        console.log('Query params:', req.query);
        console.log('Current user:', req.user?._id);

        const { userId, email } = req.query;
        const currentUserId = req.user._id;

        if (!userId && !email) {
            console.log('❌ No userId or email provided');
            return res.status(400).json({
                message: "Either userId or email is required"
            });
        }

        let query = {
            _id: { $ne: currentUserId }, 
            isOnboarded: true
        };

        if (userId) {
            console.log('🔍 Searching by userId:', userId);
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "Invalid userId format. User ID must be a valid MongoDB ObjectId (24 characters)"
                });
            }
            query._id = userId;
        } else if (email) {
            console.log('🔍 Searching by email:', email);
            query.email = { $regex: email, $options: 'i' }; 
        }

        console.log('🔍 MongoDB query:', JSON.stringify(query));
        const user = await User.findOne(query).select("-password");
        console.log('🔍 User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                message: `User not found with ${userId ? 'userId' : 'email'}: ${userId || email}. Make sure the user exists and has completed onboarding.`
            });
        }

        console.log('✅ User found:', user.email);
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.Bio,
            profilePic: user.profilePic
        });
    } catch (error) {
        console.error("❌ Error in searchUser controller:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
}