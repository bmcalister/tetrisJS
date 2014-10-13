/**
 * Tetris in JS using Canvas
 * http://github.com/bmcalister
 *
 * Copyright (c) 2014 Brian Mc Alister
 *
 * Released under the MIT license
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

;(function(global) {
    'use strict';

    var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d"),
        game = {
            level: 1,
            grid_width: 25,
            standardFps: 4,
            fps: 4,
            state: 'playing',
            grid: {
                x: 10,
                y: 16
            }
        },
        blockTypes = [{
            color: '#0000FE',
            layout: [
                [0, 1, 0],
                [1, 1, 1]
            ]
        }, {
            color: '#008001',
            layout: [
                [0, 1, 1],
                [1, 1, 0]
            ]
        }, {
            color: '#81007F',
            layout: [
                [1, 1, 0],
                [0, 1, 1]
            ]
        }, {
            color: '#FFFF01',
            layout: [
                [0, 0, 1],
                [1, 1, 1]
            ]
        }, {
            color: '#FF6600',
            layout: [
                [1, 0, 0],
                [1, 1, 1]
            ]
        }, {
            color: '#FF99CB',
            layout: [
                [1, 1],
                [1, 1]
            ]
        }, {
            color: '#FE0000',
            layout: [
                [0, 0, 0, 0],
                [1, 1, 1, 1]
            ]
        }],
        gameMatrix = [], // contains all static squares
        activeBlock; // holds a reference to the currently moving Block

    // append canvas to body
    document.body.appendChild(canvas);

    // set the canvas width and height according to the grid definitions
    canvas.width = game.grid.x * game.grid_width;
    canvas.height = game.grid.y * game.grid_width;

    // center canvas and add styling
    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.marginTop = -canvas.height/2 + 'px';
    canvas.style.marginLeft = -canvas.width/2 + 'px';
    canvas.style.border = '1px solid black';

    // prepare game matrix
    for( var i = 0; i < game.grid.y; i++ ) {
        gameMatrix.push( new Array(game.grid.x) );
    }

    /**
     * Block constructor
     * creates new Block and places it randomly on x-axis and outside of view on y-axis
     *
     * @param <Number> type
     */
    var Block = function(type) {
        this.type = blockTypes[type] || blockTypes[0];
        this.x =  Math.floor(Math.random() * (game.grid.x - this.type.layout[0].length + 1) );
        this.y =  0 - this.type.layout.length;
    };

    /**
     * Checks wether Block conflicts with objects in gameMatrix or is out of bounds
     * returns true on conflict
     *
     * @param <Number> x
     * @param <Number> y
     * @param <Object> layout
     * @return <Boolean>
     */
    Block.prototype.hitTest = function(x, y, layout) {

        var newLayout = layout || this.type.layout,
            newX = this.x + x,
            newY = this.y + y;

        // check if new position conflicts with object in matrix
        // or is out of bounds
        for( var i = 0; i < newLayout.length; i++ ){

            for( var j = 0; j < newLayout[i].length; j++ ) {

                if( newLayout[i][j] == 1) { // object in layout

                    if( i + newY >= game.grid.y ) { // out of bounds on y axis
                        return true;
                    }

                    if( j + newX < 0 || j + newX >= game.grid.x) { // out of bounds on x axis
                        return true;
                    }

                    if( typeof gameMatrix[ i + newY ] !== 'undefined' &&
                        typeof gameMatrix[ i + newY ][ j + newX ] !== 'undefined' && 
                        gameMatrix[ i + newY ][ j + newX ] !== 0 ) { // object colliding with gameMatrix

                        // check if game is over and set state only if not rotating
                        if(this.y - i < 0 && layout === undefined){
                            game.state = 'over';
                        }
                        
                        return true;
                    }
                }
            }
        }

        return false;
    };

    /**
     * Updates Block position on x- and/or y-axis
     *
     * @param <Number> x
     * @param <Number> y
     */
    Block.prototype.updatePosition = function(x, y) {

        // return if conflicting
        if (this.hitTest(x, y)) {
            return;
        }

        // update x and y positions
        this.x = this.x + x;
        this.y = this.y + y;
    }

    /**
     * Transfers Block to gameMatrix
     */
    Block.prototype.transfer = function() {

        for( var i = 0; i < this.type.layout.length; i++ ){
            for( var j = 0; j < this.type.layout[i].length; j++ ) {
                if(this.type.layout[i][j] === 1){
                    gameMatrix[ this.y + i ][ this.x + j ] = { block: 1, color: this.type.color };
                }
            }
        }
    }

    /**
     * rotate obstacle by 90 degrees
     */
    Block.prototype.rotate = function() {

        var newLayout = Object.create( this.type.layout );

        // transpose from http://www.codesuck.com/2012/02/transpose-javascript-array-in-one-line.html
        newLayout = Object.keys(newLayout[0]).map(function(c) {
            return newLayout.map(function(r) {
                return r[c];
            });
        });

        // row reverse 
        for (var i = 0; i < newLayout.length; i++) {
            newLayout[i] = newLayout[i].reverse();
        }

        // check if new squares pass hit test and only then change the layout
        if (this.hitTest(0, 0, newLayout) === false) {
            this.type.layout = newLayout;
        }
    };

    /**
     * draws block to canvas
     *
     * @param <Object> ctx
     */
    Block.prototype.draw = function(ctx) {

        for( var i = 0; i < this.type.layout.length; i++ ){
            for( var j = 0; j < this.type.layout[i].length; j++ ) {
                if(this.type.layout[i][j] === 1){
                    drawSquare( this.x + j, this.y + i, this.type.color, ctx );
                }
            }
        }
    }

    /**
     * Draws a square to the canvas
     *
     * @param <Number> x
     * @param <Number> y
     * @param <String> color
     * @param <Object> ctx
     */
    var drawSquare = function(x, y, color, ctx){
        var calc_x = x * game.grid_width,
            calc_y = y * game.grid_width;

        // draw square
        ctx.beginPath();
        ctx.rect(calc_x, calc_y, game.grid_width, game.grid_width);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // draw white stroke with opacity
        ctx.beginPath();
        ctx.rect(calc_x+2, calc_y+2, game.grid_width-4, game.grid_width-4);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.stroke();
    };

    /**
     * move obstacle on key press, adjust speed on arrow down
     *
     * @param <Object> event
     */
    function keyDown(event) {

        if (activeBlock === undefined) {
            return;
        }

        switch (event.keyCode) {
            case 37:
                activeBlock.updatePosition(-1, 0);
                break;

            case 39:
                activeBlock.updatePosition(1, 0);
                break;

            case 38:
                activeBlock.rotate();
                break;
            
            case 40:
                game.fps = 20;
                break;
        }
    }

    /**
     * adjust speed on releasing down arrow
     *
     * @param <Object> event
     */
    function keyUp(event) {

        switch (event.keyCode) {
            case 40:
                game.fps = game.standardFps;
                break;
        }
    }

    // add event listeners
    global.addEventListener("keydown", keyDown, false);
    global.addEventListener("keyup", keyUp, false);

    /**
     * calculate everything for each frame then draw
     */
    var update = function() {

        // add initial block if none exists
        if (activeBlock === undefined) {
            activeBlock = new Block( Math.floor(Math.random()*(blockTypes.length)) );
        }

        // hit test with on y axis
        if (activeBlock.hitTest(0, 1)) {

            // check if game over
            if (game.state === 'over') {
                console.log('Game Over!');
                return;
            }

            // transfer block to gameMatrix
            activeBlock.transfer();

            // remove Block reference
            activeBlock = undefined;

        } else {

            activeBlock.updatePosition(0, 1);

        }

        // remove completed layers
        for(var i = gameMatrix.length - 1; i >= 0; i--){
            if( gameMatrix[i].filter(function(e){ return e !== undefined }).length === game.grid.x ) {

                // remove finished layer
                gameMatrix.splice(i,1); 

                // add fresh layer at top
                gameMatrix.unshift( new Array( game.grid.x ) ); 
                
                // update i
                i++; 
            }
        }

        // draw
        render();

        // animate game
        setTimeout(function() {
            global.requestAnimationFrame(update, canvas);
        }, 1000 / game.fps);

    };

    /**
     * draw everything onto the canvas
     */
    var render = function() {

        // draw canvas
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fill();

        // draw obstacle
        if (activeBlock !== undefined) {
            activeBlock.draw(ctx);
        }

        // draw static squares
        for (var i = 0; i < gameMatrix.length; i++) {
            for( var j = 0; j < gameMatrix[i].length; j++){
                if(gameMatrix[i][j] !== undefined) {
                    drawSquare(j, i, gameMatrix[i][j].color, ctx);
                }
            }
        }

    };

    update();

})(window, undefined);

/**
 * requestAnimationFrame polyfill
 * https://gist.github.com/paulirish/1579671
 */
(function() {

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
})();