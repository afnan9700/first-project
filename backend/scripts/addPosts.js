const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('../models/userModel'); // Adjust path as needed
const Board = require('../models/boardModel'); // Adjust path as needed
const Post = require('../models/postModel'); // Adjust path as needed

dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    await User.deleteMany({});
    await Board.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');
  } catch (err) {
    console.error('Error clearing database:', err);
    throw err;
  }
}

async function createUsers() {
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const username = `user${i}`;
    const password = await bcrypt.hash(`password${i}`, 10);
    const user = new User({
      username,
      password,
      isAdmin: false,
      joinedBoards: [],
    });
    await user.save();
    users.push(user);
    console.log(`Created user: ${username}`);
  }
  return users;
}

async function createBoards(users) {
  const boards = [];
  for (let i = 1; i <= 5; i++) {
    const creator = users[i - 1]; // user1 creates board1, user2 creates board2, etc.
    const board = new Board({
      name: `board${i}`,
      description: `Description for board${i}`,
      membersCount: 1,
      moderators: [creator._id],
      createdBy: creator._id,
    });
    await board.save();
    creator.joinedBoards.push(board._id);
    await creator.save();
    boards.push(board);
    console.log(`Created board: board${i} by ${creator.username}`);
  }

  // All users join all boards
  for (const user of users) {
    for (const board of boards) {
      if (!user.joinedBoards.includes(board._id)) {
        user.joinedBoards.push(board._id);
        board.membersCount += 1;
        await user.save();
        await board.save();
      }
    }
  }
  console.log('All users joined all boards');
  return boards;
}

function generateRandomDate() {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
}

function selectUnique(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function createPosts(users, boards) {
  let totalPosts = 0;
  let postCounter = 1;

  for (const board of boards) {
    const numPosts = 20 + Math.floor(Math.random() * 11); // 20–30 posts per board
    for (let i = 0; i < numPosts; i++) {
      const title = `post${postCounter}`;
      const content = `Content for ${title}`;
      const author = users[Math.floor(Math.random() * users.length)];
      const randomDate = generateRandomDate();

      const numVoters = Math.floor(Math.random() * 4); // 0–3 voters
      const voters = selectUnique(users, numVoters);
      const votes = voters.map(user => ({
        user: user._id,
        value: Math.random() < 0.5 ? 1 : -1,
      }));
      const voteCount = votes.reduce((sum, v) => sum + v.value, 0);

      const post = new Post({
        title,
        content,
        author: author._id,
        board: board._id,
        voteCount,
        votes,
        createdAt: randomDate,
        updatedAt: randomDate,
      });
      await post.save();
      postCounter++;
      totalPosts++;
    }
    console.log(`Created ${numPosts} posts for ${board.name}`);
  }
  console.log(`Total posts created: ${totalPosts}`);
}

async function generateTestData() {
  try {
    await connectToDatabase();
    await clearDatabase(); // Comment out to keep existing data
    const users = await createUsers();
    const boards = await createBoards(users);
    await createPosts(users, boards);
    console.log('Test data generation completed successfully');
  } catch (err) {
    console.error('Error generating test data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearDatabase();
generateTestData();