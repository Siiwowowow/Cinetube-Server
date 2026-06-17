import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';

interface IComment {
  content: string;
  reviewId: string;
  parentId?: string;
}

const createComment = async (data: IComment, userId: string) => {
  const reviewExists = await prisma.review.findUnique({
    where: { id: data.reviewId }
  });
  if (!reviewExists) {
    throw new AppError(404, 'Review not found');
  }

  if (data.parentId) {
    const parentExists = await prisma.comment.findUnique({
      where: { id: data.parentId }
    });
    if (!parentExists) {
      throw new AppError(404, 'Parent comment not found');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      ...data,
      userId
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  
  return comment;
};

const getCommentsByReview = async (reviewId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { 
        reviewId,
        parentId: null
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { likes: true, replies: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { likes: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.comment.count({ where: { reviewId, parentId: null } })
  ]);
  
  return {
    data: comments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const updateComment = async (id: string, content: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  
  if (!comment) throw new AppError(404, 'Comment not found');
  if (comment.userId !== userId) throw new AppError(403, 'You can only update your own comments');
  
  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    include: { user: { select: { name: true, email: true } } }
  });
  
  return updated;
};

const deleteComment = async (id: string, userId: string, isAdmin: boolean = false) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  
  if (!comment) throw new AppError(404, 'Comment not found');
  if (!isAdmin && comment.userId !== userId) throw new AppError(403, 'Unauthorized');
  
  await prisma.comment.delete({ where: { id } });
  
  return { message: 'Comment deleted successfully' };
};

const toggleLikeReview = async (reviewId: string, userId: string) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_reviewId: { userId, reviewId }
    }
  });
  
  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    await prisma.review.update({
      where: { id: reviewId },
      data: { likesCount: { decrement: 1 } }
    });
    return { liked: false };
  } else {
    await prisma.like.create({ data: { userId, reviewId } });
    await prisma.review.update({
      where: { id: reviewId },
      data: { likesCount: { increment: 1 } }
    });
    return { liked: true };
  }
};

const toggleLikeComment = async (commentId: string, userId: string) => {
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: { userId, commentId }
    }
  });
  
  if (existingLike) {
    await prisma.commentLike.delete({ where: { id: existingLike.id } });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likesCount: { decrement: 1 } }
    });
    return { liked: false };
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } }
    });
    return { liked: true };
  }
};

export const CommentService = {
  createComment,
  getCommentsByReview,
  updateComment,
  deleteComment,
  toggleLikeReview,
  toggleLikeComment
};