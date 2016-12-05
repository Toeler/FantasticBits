class Position {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	distanceTo(position) {
		const x = position.x - this.x;
		const y = position.y - this.y;
		return Math.sqrt(x*x + y*y);
	}

	clone() {
		return new Position(this.x, this.y);
	}

	toString() {
		return `${this.x} ${this.y}`;
	}
}

module.exports = Position;