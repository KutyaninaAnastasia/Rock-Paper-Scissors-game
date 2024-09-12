const readline = require('readline');
const crypto = require('crypto');
const Table = require('cli-table3');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class SecretGenerator {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex'); 
    }

    static generateHMAC(key, move) {
        return crypto.createHmac('sha256', key).update(move).digest('hex');
    }
}

class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.numMoves = moves.length;
    }

    winnerCalculating(playerMove, computerMove) {
        if (playerMove === computerMove) return 'Draw';

        const playerIndex = this.moves.indexOf(playerMove);
        const computerIndex = this.moves.indexOf(computerMove);
        const halfRange = Math.floor(this.numMoves / 2);

        const result = Math.sign((playerIndex - computerIndex + halfRange + this.numMoves) % this.numMoves - halfRange);

        switch (result) {
            case 1:
                return 'Win';
            case -1:
                return 'Lose';
        }
    }
}

class HelpTable {
    constructor(moves) {
        this.moves = moves;
        this.game = new GameRules(moves);
    }

    generateTable() {
        const table = new Table({
            head: ['v PC/User >', ...this.moves]
        });

        this.moves.forEach((computerMove, i) => {
            const row = [chalk.red(computerMove)];
            this.moves.forEach((playerMove, j) => {
                if (i === j) row.push('Draw');
                else {
                    row.push(this.game.winnerCalculating(playerMove, computerMove));
                }
            });
            table.push(row);
        });

        console.log(table.toString());
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.rules = new GameRules(moves);
    }

    generateComputerMove() {
        this.key = SecretGenerator.generateKey();
        this.keyBuffer = Buffer.from(this.key, 'hex');
        const randomIndex = crypto.randomInt(this.moves.length);
        this.computerMove = this.moves[randomIndex];
        this.hmac = SecretGenerator.generateHMAC(this.keyBuffer, this.computerMove);
    }

    start() {
        this.generateComputerMove();
        console.log(`\nHMAC: ${this.hmac}`);
        this.showMenu();
    }

    showMenu() {
        console.log('Available moves:');
        this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
        console.log('0 - Exit');
        console.log('? - Help');

        rl.question('Enter your move: ', (input) => {
            if (input === '?') {
                new HelpTable(this.moves).generateTable();
                this.showMenu();
            } else if (input === '0') {
                rl.close();
            } else {
                const playerMove = this.moves[parseInt(input) - 1];
                if (!playerMove) {
                    console.log('Invalid input. Try again.\n');
                    this.showMenu();
                } else {
                    this.playGame(playerMove);
                }
            }
        });
    }

    playGame(playerMove) {
        console.log(`Your move: ${playerMove}`);
        console.log(`Computer move: ${this.computerMove}`);
        console.log(`Key: ${this.key}`);
        const winner = this.rules.winnerCalculating(playerMove, this.computerMove);

        switch (winner) {
            case 'Win':
                console.log(chalk.green("You win!"));
                break;
            case 'Lose':
                console.log(chalk.red("You lose :("));
                break;
            case 'Draw':
                console.log(chalk.blue("It's draw!"));
                break;
        }

        this.start();
    }
}

function validateArgs(args){
    const uniqueInputs = new Set(args);
    if(args.length < 3){
        console.log("Error: the number of moves must be equal to or greater than 3");
        return false;
    } else if (uniqueInputs.size !== args.length) {
        console.log("Error: moves must be unique (e.g. Rock Paper Scissors).");
        return false;
    } else if(args.length % 2 === 0){
        console.log("Error: the number of moves must be odd");
        return false;
    } else{
        return true;
    }
}

const args = process.argv.slice(2);

if (validateArgs(args)) {
    const game = new Game(args);
    game.start();
} else {
    console.log("Please provide valid moves.");
    rl.close();
}
