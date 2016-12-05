const Position = require('./Position');

class Entity {
	constructor(inputs) {
		this.id = parseInt(inputs[0], 10);
		this.position = new Position(parseInt(inputs[2], 10), parseInt(inputs[3], 10));
		this.velocityX = parseInt(inputs[4], 10);
		this.velocityY = parseInt(inputs[5], 10);
	}

	get x() {
		return this.position.x;
	}

	get y() {
		return this.position.y;
	}

	get speed() {
		return Math.sqrt(this.velocityX*this.velocityX + this.velocityY*this.velocityY);
	}

	distanceTo(position) {
		if (position instanceof Entity) {
			position =  position.position;
		}
		return this.position.distanceTo(position);
	}

	getPositionIn(turns) {
		return new Position(this.x + (turns * this.velocityX), this.y + (turns * this.velocityY));
	}

	isTravellingTowards(entity) {
		return entity.x < this.x
			? this.velocityX < 0
			: this.velocityX > 0;
	}

	isInHalf(goal) {
		return goal.x > 0 ? this.x > 8000 : this.x < 8000;
	}
}

module.exports = Entity;