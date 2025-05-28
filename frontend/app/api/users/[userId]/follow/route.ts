import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createNotification(
  userId: string,
  type: "FOLLOW" | "UNFOLLOW",
  follower: { id: string; name: string }
) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title: type === "FOLLOW" ? "New Follower" : "User Unfollowed",
        message:
          type === "FOLLOW"
            ? `${follower.name} started following you`
            : `${follower.name} unfollowed you`,
        read: false,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { followerId } = await request.json();

    if (!followerId) {
      return NextResponse.json(
        { error: "followerId is required" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    // Get user details for notification
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!follower) {
      throw new Error("Follower not found");
    }

    // Create notification
    await createNotification(userId, "FOLLOW", follower);

    return NextResponse.json({
      success: true,
      message: "Successfully followed user",
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { followerId } = await request.json();

    if (!followerId) {
      return NextResponse.json(
        { error: "followerId is required" },
        { status: 400 }
      );
    }

    // Delete follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: userId,
      },
    });

    if (deletedFollow.count === 0) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    // Get user details for notification
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!follower) {
      throw new Error("Follower not found");
    }

    // Create notification
    await createNotification(userId, "UNFOLLOW", follower);

    return NextResponse.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
