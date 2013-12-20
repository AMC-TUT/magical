module.exports = User;

function User() {
  this.switch = false;
}

User.prototype.turnOn = function () {
  this.switch = true;
};
User.prototype.turnOff = function () {
  this.switch = false;
};
User.prototype.isOn = function () {
  return this.switch;
};
