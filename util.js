class Users {
  constructor() {
    this.users = [];
  }

  addUser(id, name) {
    let user = { id, name };
    this.users.push(user);
    return user;
  }

  getUserList() {
    // let users = this.users.filter((user) => user.room === room);
    let namesArray = this.users.map((user) => user.name);

    return namesArray;
  }

  getUser(name) {
    return this.users.filter((user) => user.name === name)[0];
  }

  removeUser(name) {
    let user = this.getUser(name);

    if (user) {
      this.users = this.users.filter((user) => user.name !== name);
    }

    return user;
  }
}

module.exports = { Users };
