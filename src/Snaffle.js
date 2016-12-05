const intersection = require('intersection');
const Entity = require('./Entity');

class Snaffle extends Entity {
	constructor(inputs) {
		super(inputs);
	}

	get radius() {
		return 150;
	}

	isTravellingTowardsGoal(goal) {
		const intersect = intersection.intersect({ start: this.position, end: { x: this.position.x + this.velocityX, y: this.position.y + this.velocityY} }, { start: goal.top, end: goal.bottom });
		if (this.id === 4) {
			printErr(`${this.id} intersecting my goal at ${intersect && intersect.y} at ${Math.sqrt(this.velocityX*this.velocityX + this.velocityY*this.velocityY)} (${this.velocityX}, ${this.velocityY})`);
		}
		return intersect && intersect.y >= goal.top.y && intersect.y <= goal.bottom.y && this.isTravellingTowards(intersect);
	}
}

module.exports = Snaffle;