// 4. Create a User model with functions for getting all the users, adding a user, and confirming user login.
export const users = [];

export const getAllUsers = () => {
  return users;
};

export const registerUser = (user) => {
  const existingUser = users.find(
    (existing) => existing.fullname === user.fullname || existing.email === user.email
  );

  if (existingUser) {
    return { error: "Username or email is already taken." };
  }

  const newId =
    users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;
  const newUser = { id: newId, lastVisit:null, ...user };
  users.push(newUser);
  return newUser;
};

export const authenticateUser = (reqUser) => {
  const foundUser = users.find((user) => user.username === reqUser.username || user.email === reqUser.email);
  if (!foundUser) {
    return { error: "Invalid username or email" };
  }

  if (foundUser.password !== reqUser.password) {
    return { error: "Invalid password" };
  }
  return foundUser;
};

export const updateLastVisit = (userId, visitTime) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.lastVisit = visitTime;
  }
};

