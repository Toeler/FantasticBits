const Position = require('./Position');

const HALF_GOAL_WIDTH = 2000;
const POST_RADIUS = 300;
const SNAFFLE_RADIUS = 150;

class Goal {
	constructor(x, y) {
		this.position = new Position(x, y);
	}

	get x() {
		return this.position.x;
	}

	get y() {
		return this.position.y;
	}

	get top() {
		if (!this._top) {
			this._top = new Position(this.x, this.y - HALF_GOAL_WIDTH + POST_RADIUS + 50);
		}
		return this._top;
	}

	get bottom() {
		if (!this._bottom) {
			this._bottom = new Position(this.x, this.y + HALF_GOAL_WIDTH - POST_RADIUS - 50);
		}
		return this._bottom;
	}
}

module.exports = Goal;