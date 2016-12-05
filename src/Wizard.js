const Position = require('./Position');
const Entity = require('./Entity');
const Spell = require('./Spell');
const Snaffle = require('./Snaffle');

const FUTURE_TURNS = 2;

class Wizard extends Entity {
	constructor(inputs) {
		super(inputs);
		this.state = parseInt(inputs[6], 10);
	}

	get radius() {
		return 400;
	}

	get diameter() {
		return this.radius * 2; 
	}

	hasSnaffle() {
		return this.state === 1;
	}

	setTarget(value) {
		if (this.target && this.target.target === this) {
			this.target.target = null;
		}

		this.target = value && value.snaffle || value;
		if (this.target && this.target instanceof Snaffle) {
			this.target.target = this;
		}
	}

	throw(x, y) {
		if (x instanceof Position) {
			y = x.y;
			x = x.x;
		} else if (x.position) {
			y = x.position.y;
			x = x.position.x;
		}
		print(`THROW ${x} ${y} 500`);
	}

	move(x, y) {
		if (x instanceof Position) {
			y = x.y;
			x = x.x;
		} else if (x.position) {
			y = x.position.y;
			x = x.position.x;
		}
		print(`MOVE ${x} ${y} 150`);
	}

	moveToTarget() {
		if (this.target) {
			if (this.target instanceof Spell) {
				print(this.target);
			} else {
				this.move(this.target);
			}
		} else {
			this.move(this.position);
		}
	}
}

module.exports = Wizard;