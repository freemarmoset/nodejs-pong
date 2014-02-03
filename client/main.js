var
  _ = require('underscore'),
  THREE = require('THREE');

var
  config = require('lib/config'),
  util = require('lib/util');

var
  Camera = require('support/camera'),
  Board = require('support/board'),
  Ball = require('support/ball'),
  Paddle = require('support/paddle'),
  Light = require('support/light'),
  SkyPlane = require('support/sky_plane'),
  FairyParticleSystem = require('support/fairy_particle_system');

function Game() {
  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.clock = new THREE.Clock;
  this.canvas = document.getElementById('canvas');
  this.canvas.appendChild(this.renderer.domElement);
  this.scene = new THREE.Scene();

  this.board = new Board();
  this.scene.add(this.board.object);

  this.ball = new Ball({ game: this });
  this.scene.add(this.ball.object);

  this.player = new Paddle({ id: 1, game: this });
  this.scene.add(this.player.object);

  this.opponent = new Paddle({ id: 2, game: this });
  this.scene.add(this.opponent.object);

  this.playerLight = new Light({ id: 1, game: this });
  this.scene.add(this.playerLight.object);

  this.opponentLight = new Light({ id: 2, game: this });
  this.scene.add(this.opponentLight.object);

  this.opponentSkyPlane = new SkyPlane({ game: this, side: 1 });
  this.scene.add(this.opponentSkyPlane.object);

  this.playerSkyPlane = new SkyPlane({ game: this, side: -1 });
  this.scene.add(this.playerSkyPlane.object);

  this.fairyParticleSystem = new FairyParticleSystem({ game: this });
  this.scene.add(this.fairyParticleSystem.object);

  // Setup camera:
  this.camera = new Camera({ game: this });

  // Bind window resizing, and set defaults:
  $(window).on('resize', _.bind(this.resize, this));
  this.resize();

  // Bind socket events:
  this.socket = io.connect('http://localhost');
  this.bindSocketEvents();

  // Bind player events:
  this.bindPlayerEvents();

  // Begin draw loop:
  this.draw();
}

Game.prototype.draw = function() {

  var delta = this.clock.getDelta();

  // If camera is moving, continue animation:
  if (this.camera.isMoving) {
    this.camera.update(delta);
  }

  // Animate particle system:
  this.fairyParticleSystem.update(delta);

  // Render scene:
  this.renderer.render(this.scene, this.camera.object);

  // Queue next loop with RAF:
  var _this = this;
  requestAnimationFrame(function () {
    _this.draw();
  });
};

Game.prototype.resize = function() {
  this.board.resize();
  this.ball.resize();
  this.player.resize();
  this.opponent.resize();
  this.playerLight.resize();
  this.opponentLight.resize();
  this.opponentSkyPlane.resize();
  this.playerSkyPlane.resize();
  this.fairyParticleSystem.resize();
  this.camera.resize();

  // Set renderer size:
  this.renderer.setSize(window.innerWidth, window.innerHeight);
};

Game.prototype.bindSocketEvents = function() {
  var _this = this;

  this.socket.on('player', function(data) {
    _this.player.move(data);
  });

  this.socket.on('opponent', function(data) {
    _this.opponent.move(data);
  });

  this.socket.on('ball', function(data) {
    _this.ball.move(data);
  });
};

Game.prototype.bindPlayerEvents = function() {

  var _this = this;

  $('nav').on('click', 'a[data-player]', function(e) {
    e.preventDefault();
    var playerId = $(e.currentTarget).data('player');
    _this.camera.setPlayer(playerId);
  });

};

$(document).ready(function() {
  window.game = new Game();
});

module.exports = window.game;
