// Utility function to process comments and include user-specific vote information.
const processComments = (comments, userId) => {
    // If there are no comments, return an empty array.
    if (!comments || comments.length === 0) {
        return [];
    }

    // The userId must be a string to be used as a key in the Map.
    const userIdStr = userId?.toString();

    return comments.map(comment => {
        // For each comment, get the user's vote from the 'votes' Map.
        // If the user is a guest or hasn't voted, the vote is 0.
        const userVote = userIdStr ? (comment.votes.get(userIdStr) || 0) : 0;

        return {
            _id: comment._id,
            post: comment.post,
            postTitle: comment.postTitle,
            parentComment: comment.parentComment,
            author: comment.author,
            authorName: comment.authorName,
            content: comment.content,
            updatedAt: comment.updatedAt,
            voteCount: comment.voteCount,
            deleted: comment.deleted,
            createdAt: comment.createdAt,
            userVote: userVote // The newly added field
            // The original 'votes' map is intentionally not included.
        };
    });
};

module.exports = processComments;