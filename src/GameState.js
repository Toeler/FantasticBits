const intersection = require('intersection');
const Goal = require('./Goal');
const Position = require('./Position');
const Spell = require('./Spell');

class GameState {
	constructor() {
		this.goals = [
			new Goal(0, 3750),
			new Goal(16000, 3750)
		];
		this.myWizards = [];
		this.opponentWizards = [];
		this.snaffles = [];
		this.bludgers = [];
		this.mana = -1;
	}

	get myGoal() {
		return this.goals[this.myTeamId];
	}

	get opponentGoal() {
		return this.goals[1 - this.myTeamId];
	}

	tick() {
		this.mana++;

		const snaffleDistances = {};
		for (let wizard of this.myWizards) {
			for (let snaffle of this.snaffles) {
				if (!snaffleDistances[wizard.id]) {
					snaffleDistances[wizard.id] = [];
				}
				snaffleDistances[wizard.id].push({
					distance: wizard.distanceTo(snaffle),
					snaffle: snaffle
				});
			}
			snaffleDistances[wizard.id].sort((a, b) => a.distance - b.distance);
		}

		const wizardsToProcess = this.myWizards.slice();
		let caster;
		while (wizardsToProcess.length > 0) {
			const wizard = wizardsToProcess.shift();
			let index = 0;
			let snaffle, distance;
			do {
				const item = snaffleDistances[wizard.id][index++];
				if (item) {
					snaffle = item.snaffle;
					distance = item.distance;
					// TODO: Handle 1 snaffle left

					if (snaffle.target) {
						if (snaffle.target.distanceTo(snaffle) > distance) {
							printErr(`${wizard.id} targeting ${snaffle.id} at distance ${distance} closer than ${snaffle.target.id} which was ${snaffle.target.distanceTo(snaffle)}`);
							wizardsToProcess.push(snaffle.target);
							snaffle.target.setTarget(null);
							wizard.setTarget(snaffle);
							break;
						}
					} else {
						printErr(`${wizard.id} targeting ${snaffle.id} at distance ${distance}`);
						wizard.setTarget(snaffle);
						if (!wizard.hasSnaffle() && (!caster || caster.distanceTo(caster.target) < distance)) {
							caster = wizard;
						}
						break;
					}
				} else {
					wizard.setTarget(snaffleDistances[wizard.id][index - 2].snaffle);
					break;
				}
			} while (snaffle);
		}

		this.tryCastASpell(caster);
		
		for (let wizard of this.myWizards) {
			if (wizard.hasSnaffle()) {
				let desiredTarget = this.opponentGoal;
				const wizardDistance = wizard.distanceTo(desiredTarget);
				for (let otherWizard of this.myWizards.filter(w => w !== wizard)) {
					const otherWizardDistance = otherWizard.distanceTo(desiredTarget);
					if (otherWizardDistance < wizardDistance && Math.abs(otherWizardDistance - wizardDistance) > 1000) {
						desiredTarget = otherWizard;
					}
				}
				const target = this.getOptimalWay(wizard, desiredTarget);
				wizard.throw(target);
			} else {
				wizard.moveToTarget();
			}
		}

		if (this.hasCastPetrificus > 1) {
			this.hasCastPetrificus = undefined;
		} else if (this.hasCastPetrificus) {
			this.hasCastPetrificus++;
		}
	}

	tryCastASpell(caster) {
		for (let snaffle of this.snaffles) {
			if (this.mana >= Spell.Flipendo.cost && snaffle.isTravellingTowardsGoal(this.myGoal) && snaffle.speed > 50 && snaffle.distanceTo(this.myGoal) < 6000) {
				const nearbyWizards = this.myWizards.filter(wizard => !wizard.hasSnaffle() && wizard.x > Math.min(this.myGoal.x, snaffle.x + snaffle.velocityX) && wizard.x < Math.max(this.myGoal.x, snaffle.x + snaffle.velocityX));
				for (let wizard of nearbyWizards) {
					printErr(`${wizard.id} hitting ${snaffle.id} to block goal (Distance: ${snaffle.distanceTo(this.myGoal)} with ${wizard.id}'s x: ${wizard.x} between ${this.myGoal.x} and ${snaffle.x + snaffle.velocityX})`);
					this.mana -= Spell.Flipendo.cost;
					wizard.setTarget(new Spell.Flipendo(snaffle));
					return;
				}
			} 

			if (caster && this.mana >= Spell.Petrificus.cost && snaffle.isTravellingTowardsGoal(this.myGoal) && (snaffle.position.x + snaffle.velocityX > 800 && snaffle.position.x + snaffle.velocityX < 15200)) {
				printErr(`${snaffle.id} travelling towards my goal at ${snaffle.velocityX} - distance ${snaffle.distanceTo(this.myGoal)} - will be at ${snaffle.position.x + snaffle.velocityX}`);
				if ((snaffle.speed > 1200 || (snaffle.speed > 0 && snaffle.distanceTo(this.myGoal) <= 1000 && !this.opponentWizards.some(wizard => wizard.distanceTo(snaffle) > 500))) && !this.hasCastPetrificus) {
					printErr(this.hasCastPetrificus);
					this.hasCastPetrificus = 1;
					this.mana -= Spell.Petrificus.cost;
					printErr(`${caster.id} cast Petrificus on ${snaffle.id}`);
					caster.setTarget(new Spell.Petrificus(snaffle));
					return;
				}
			}
		}

		for (let snaffle of this.snaffles) {
			if (this.mana >= (Spell.Flipendo.cost + Spell.Petrificus.cost) && snaffle.distanceTo(this.opponentGoal) > 2000) {
				const nearbyWizards = this.myWizards.filter(wizard => wizard.distanceTo(snaffle) <= 6000 && !wizard.hasSnaffle() && wizard.distanceTo(this.opponentGoal) > snaffle.distanceTo(this.opponentGoal));
				for (let wizard of nearbyWizards) {
					const intersect = intersection.intersect({ start: { x: wizard.position.x + wizard.velocityX, y: wizard.position.y + wizard.velocityY }, end: { x: snaffle.position.x + snaffle.velocityX, y: snaffle.position.y + snaffle.velocityY } }, { start: this.opponentGoal.top, end: this.opponentGoal.bottom });
					if (!intersect) {
						continue;
					}
					printErr(`${wizard.id} hitting ${snaffle.id} would hit at ${intersect.y} ({${wizard.position}, ${snaffle.position}} and {${this.opponentGoal.top}, ${this.opponentGoal.bottom}}) (${intersect.y} >= ${this.opponentGoal.top.y} && ${intersect.y} <= ${this.opponentGoal.bottom.y})`);
					let willHitSomething = false;
					for (let entity of this.opponentWizards.concat(this.bludgers).concat(this.snaffles.filter(s => s !== snaffle))) {
						if (entity.x > Math.min(this.opponentGoal.x, snaffle.x + snaffle.velocityX) && entity.x < Math.max(this.opponentGoal.x, snaffle.x + snaffle.velocityX) && this.doesLineIntersectCircle(
							{ x: wizard.position.x + wizard.velocityX, y: wizard.position.y + wizard.velocityY },
							{ x: snaffle.position.x + snaffle.velocityX, y: snaffle.position.y + snaffle.velocityY },
							{ x: entity.position.x + entity.velocityX, y: entity.position.y + entity.velocityY },
							entity.radius
						)) {
							printErr(`WARNING: This will hit ${entity.id}`)
							willHitSomething = true;
							break;
						}
					}
					if (!willHitSomething && intersect.y >= this.opponentGoal.top.y && intersect.y <= this.opponentGoal.bottom.y) {
						this.mana -= Spell.Flipendo.cost;
						printErr(`${wizard.id} cast Flipendo on ${snaffle.id}`);
						wizard.setTarget(new Spell.Flipendo(snaffle));
						return;
					}
				}
			} 

			/*if (this.mana >= (Spell.Obliviate.cost + Spell.Petrificus.cost)) {
				const nearbyWizards = this.myWizards.filter(wizard => wizard.distanceTo(snaffle) <= 1200 && !wizard.hasSnaffle());
				for (let wizard of nearbyWizards) {
					const nearbyBludgers = this.bludgers.filter(bludger => bludger.distanceTo(wizard) < 3000);
					if (nearbyBludgers.length) {
						printErr(`${snaffle.id} has ${nearbyWizards.length} nearby wizards, and ${nearbyBludgers.length} nearby bludgers`);
						this.mana -= Spell.Obliviate.cost;
						wizard.setTarget(new Spell.Obliviate(nearbyBludgers[0]));
						return;
					}
				}
			}*/
			
			if (this.mana >= Spell.Accio.cost) {
				const nearbyWizards = this.myWizards.filter(wizard => wizard.distanceTo(snaffle) <= 3500 && !wizard.hasSnaffle()).sort((a, b) => a.distanceTo(snaffle) - b.distanceTo(snaffle));
				const hasNearbyEnemy = this.opponentWizards.filter(wizard => wizard.distanceTo(snaffle) <= 1000);
				if (snaffle.id === 4) {
					printErr(`${nearbyWizards.length} nearby wizards (${nearbyWizards.map(w => w.id).join(', ')}) and is ${snaffle.isTravellingTowardsGoal(this.myGoal) ? '' : 'not'} travelling towards my goal`);
				}
				for (let wizard of nearbyWizards) {
					const distanceToSnaffle = wizard.distanceTo(snaffle);

					if (snaffle.isTravellingTowardsGoal(this.myGoal) && snaffle.isInHalf(this.myGoal)) {
						printErr(`${wizard.id} is ${distanceToSnaffle} away from ${snaffle.id} towards goal at ${snaffle.speed}`);
						if (snaffle.x > Math.min(this.myGoal.x, wizard.x) && snaffle.x < Math.max(this.myGoal.x, wizard.x) && snaffle.speed > (hasNearbyEnemy ? 100 : 500)) {
							this.mana -= Spell.Accio.cost;
							printErr(`${wizard.id} cast Accio on ${snaffle.id}`);
							wizard.setTarget(new Spell.Accio(snaffle));
							return;
						}
					}

					if (this.mana >= (Spell.Accio.cost + Spell.Petrificus.cost)) {
						printErr(`${wizard.id} is ${distanceToSnaffle} from ${snaffle.id}`);
						for (let opponentWizard of this.opponentWizards) {
							const opponentDistance = opponentWizard.distanceTo(snaffle);
							printErr(`${wizard.id} is ${distanceToSnaffle} from ${snaffle.id} and opponent is ${opponentWizard.distanceTo(snaffle)} away`);
							if (opponentDistance < distanceToSnaffle && opponentDistance < 1500) {
								this.mana -= Spell.Accio.cost;
								printErr(`${wizard.id} cast Accio on ${snaffle.id}`);
								wizard.setTarget(new Spell.Accio(snaffle));
								return;
							}
						}
					}
				}
			}
		}
	}


	getOptimalWay(wizard, desiredTarget) {
		const leftX = Math.min(wizard.x, desiredTarget.x);
		const rightX = Math.max(wizard.x, desiredTarget.x);
		const entitiesToCollide = Array.concat(
			this.bludgers.filter(bludger => bludger.x > leftX && bludger.x < rightX),
			this.opponentWizards.filter(wizard => wizard.x > leftX && wizard.x < rightX)
		);

		// Get the closest entity that will prevent us from straight lining to the target
		let closestDistance, closestEntity;
		for (let entity of entitiesToCollide) {
			const distanceToTarget = entity.distanceTo(wizard);
			const distanceToIntercept = Math.abs(this.getDistanceToIntercept(wizard, desiredTarget, entity));
			printErr(`${entity.id}'s distance to target is ${distanceToTarget} with a distance to intercept of ${distanceToIntercept}`);
			if ((!closestEntity || distanceToTarget < closestDistance) && distanceToIntercept <= wizard.diameter) {
				closestEntity = entity;
				closestDistance = distanceToTarget;
			}
		}
		printErr(`Closest entity is ${closestEntity && closestEntity.id}`);
		
		if (closestEntity) {
			var p = this.getOptimalPoint(wizard, desiredTarget, closestEntity, wizard.diameter);
			if (this.doesLineIntersectCircle(wizard.position, desiredTarget, { x: closestEntity.position.y + closestEntity.velocityX, y: closestEntity.position.y + closestEntity.velocityY }, closestEntity.radius * 1.3)) {
				printErr(`Wizard ${wizard.id} throwing to ${p} which intersects ${closestEntity.id}`);
			} else {
				printErr(`Wizard ${wizard.id} throwing to ${p} which does not intersect ${closestEntity.id}`);
			}
			return p;
		} else {
			return desiredTarget.position;
		}
	}

	getDistanceToIntercept(start, end, blocker) {
		const a = (blocker.x - start.x) * (end.y - start.y) / (end.x - start.x) + start.y - blocker.y;
		const b = (end.x - start.x) * (blocker.y - start.y) / (end.y - start.y) + start.x - blocker.x;
		const posA = new Position(blocker.x, blocker.y + Math.round(a));
		const posB = new Position(blocker.x + Math.round(b), blocker.y);
		return a * b / posA.distanceTo(posB);
	}

	getOptimalPoint(entityA, entityB, entityC, diameter) {
		const a = (entityC.x - entityA.x) * (entityB.y - entityA.y) / (entityB.x - entityA.x) + entityA.y - entityC.y;
		const b = (entityB.x - entityA.x) * (entityC.y - entityA.y) / (entityB.y - entityA.y) + entityA.x - entityC.x;
		const c = Math.sqrt(a*a + b*b);
		const h = a * b / c;
		const c2 = b * diameter / h;
		const newX = Math.round(entityC.x + Math.sqrt(c2*c2 - diameter*diameter) * diameter / c2);
		const newY = Math.round(entityC.y + a);
		if (newX < 0 || newX > 16000 || newY < 0 || newY > 16000) {
			return new Position(entityA.x, entityA.y);
		}
		return new Position(newX, newY);
	}

	doesLineIntersectCircle(lineStart, lineEnd, circleCenter, circleRadius) {
		const eDistAtoB = Math.sqrt(Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2));
		const vector = { x: (lineEnd.x - lineStart.x) / eDistAtoB, y: (lineEnd.y - lineStart.y) / eDistAtoB };
		const t = (vector.x * (circleCenter.x - lineStart.x)) + (vector.y * (circleCenter.y - lineStart.y));
		const pointOnLine = { x: (t * vector.x) + lineStart.x, y: (t * vector.y) + lineStart.y };
		const eDistCtoE = Math.sqrt(Math.pow(pointOnLine.x - circleCenter.x, 2) + Math.pow(pointOnLine.y - circleCenter.y, 2));

		return eDistCtoE < circleRadius;
	}

	controlDefender(wizard) {
		const target = this.getHostileSnaffle(wizard);
		if (target) {
			if (wizard.distanceTo(this.myGoal) > target.distanceTo(this.myGoal) && this.mana > 20) {
				this.mana -= 20;
				print(`ACCIO ${target.id}`);
			} else {
				const position = this.getOptimalWay(wizard, target).clone();
				position.x += target.velocityX;
				position.y += target.velocityY;
				printErr('Move Target ' + position);
				wizard.move(position);
			}
		} else {
			printErr('Move Goal ' + this.myGoal.position);
			wizard.move(this.myGoal);
		}
	}

	controlStriker(wizard) {
		if (wizard.distanceTo(wizard.target.object) < wizard.target.object.distanceTo(this.opponentGoal && this.mana > 20)) {
			this.mana -= 20;
			print(`FLIPENDO ${wizard.target.object.id}`);
		} else {
			wizard.moveToTarget();
		}
	}

	getHostileSnaffle(wizard) {
		const weights = [];
		for (let snaffle of this.snaffles) {
			const distanceToWizard = wizard.distanceTo(snaffle);
			const distanceToGoal = snaffle.distanceTo(this.myGoal);

			if (distanceToGoal < 8000) {
				weights.push({
					distanceToWizard: distanceToWizard,
					distanceToGoal: distanceToGoal,
					object: snaffle
				});
			}
		}

		weights.sort((a, b) => a.distanceToGoal - b.distanceToGoal);
		return weights[0] && weights[0].object;
	}
}

module.exports = new GameState();