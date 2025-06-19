// delete user handler
const deleteUser = async (req, res) => {
  const user = req.user;

  try {
    // checking if the user is the last moderator of any board
    const boardsModerated = await Board.find({ moderators: user.userId });
    for (const board of boardsModerated) {
      if (board.moderators.length === 1) {
        return res.status(400).json({
          error: `Cannot delete account. You are the last moderator of the board "${board.name}". Please transfer moderation rights first.`,
        });
      }
    }

    // removing the user from boards they are a member or moderator of
    await Board.updateMany(
      { members: user._id },
      { $pull: { members: user._id, moderators: user._id } }
    );

    // setting the deleted parameter as true
    user.deleted = true;
    // removing other user info
    user.username = "<deleted>";
    user.password = undefined;

    await user.save();

    res.json({ message: "User profile has been deleted and anonymized." });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during account deletion." });
  }
};

module.exports = { deleteUser };