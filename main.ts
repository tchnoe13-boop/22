
namespace SpriteKind {
    export const Platform = SpriteKind.create()
    export const Coin = SpriteKind.create()
    export const Enemy = SpriteKind.create()
    export const Goal = SpriteKind.create()
}

let player: Sprite = null
let platforms: Sprite[] = []
let coins: Sprite[] = []
let enemies: Sprite[] = []
let goal: Sprite = null
let vy = 0
let onGround = false
let invincible = false
let gameEnded = false

scene.setBackgroundColor(9)
info.setScore(0)
info.setLife(3)

// Le héros
player = sprites.create(img`
    . . . 2 2 2 2 . .
    . . 2 4 4 4 4 2 .
    . . 2 1 4 4 1 2 .
    . . 2 4 4 4 4 2 .
    . . . 2 2 2 2 . .
    . . 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 .
    . . 7 . . . 7 . .
    . 5 5 . . . 5 5 .
    . 5 5 . . . 5 5 .
`, SpriteKind.Player)
player.setPosition(15, 85)
player.setStayInScreen(true)

// Fabrique une plateforme
function platform(x: number, y: number, width: number) {
    let p = sprites.create(image.create(width, 8), SpriteKind.Platform)
    p.image.fill(7)
    p.setPosition(x, y)
    platforms.push(p)
}

// Fabrique une pièce
function coin(x: number, y: number) {
    let c = sprites.create(img`
        . . 5 5 5 . .
        . 5 4 4 4 5 .
        5 4 5 4 5 4 5
        5 4 4 4 4 4 5
        5 4 5 4 5 4 5
        . 5 4 4 4 5 .
        . . 5 5 5 . .
    `, SpriteKind.Coin)
    c.setPosition(x, y)
    coins.push(c)
}

// Fabrique un ennemi
function enemy(x: number, y: number) {
    let e = sprites.create(img`
        . . 8 8 8 8 . .
        . 8 8 8 8 8 8 .
        8 8 1 8 8 1 8 8
        8 8 8 8 8 8 8 8
        . 8 8 8 8 8 8 .
        . 8 . . . . 8 .
        8 8 . . . . 8 8
    `, SpriteKind.Enemy)
    e.setPosition(x, y)
    e.vx = 20
    enemies.push(e)
}

// Le sol et les plateformes
platform(80, 116, 160)
platform(40, 90, 38)
platform(95, 70, 40)
platform(140, 45, 35)

// Les pièces
coin(40, 75)
coin(95, 55)
coin(140, 30)
coin(70, 103)
coin(115, 103)

// Les ennemis
enemy(65, 106)
enemy(110, 60)

// Le drapeau d'arrivée
goal = sprites.create(img`
    . . 2 .
    . . 2 2 2 2 2
    . . 2 4 4 4 .
    . . 2 4 4 4 .
    . . 2 2 2 2 2
    . . 2 .
    . . 2 .
    . 7 7 7
    7 7 7 7 7
`, SpriteKind.Goal)
goal.setPosition(150, 29)

// Déplacements horizontaux
controller.moveSprite(player, 90, 0)

// Saut
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (onGround && !gameEnded) {
        vy = -115
        onGround = false
    }
})

// Gravité et collisions avec les plateformes
game.onUpdate(function () {
    if (gameEnded) return

    let oldBottom = player.bottom
    vy += 5
    if (vy > 120) vy = 120
    player.y += vy / 10
    onGround = false

    for (let p of platforms) {
        if (player.vy >= 0 &&
            oldBottom <= p.top &&
            player.bottom >= p.top &&
            player.right > p.left &&
            player.left < p.right) {
            player.bottom = p.top
            vy = 0
            onGround = true
        }
    }

    // Retour au début si le héros tombe
    if (player.y > 125) {
        info.changeLifeBy(-1)
        player.setPosition(15, 85)
        vy = 0
    }

    // Les ennemis rebondissent sur les bords de l'écran
    for (let e of enemies) {
        if (e.left <= 0) e.vx = 20
        if (e.right >= 160) e.vx = -20
    }
})

// Ramasser les pièces
sprites.onOverlap(SpriteKind.Player, SpriteKind.Coin, function (p, c) {
    if (gameEnded) return
    info.changeScoreBy(1)
    c.destroy()
})

// Toucher un ennemi fait perdre une vie
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (p, e) {
    if (gameEnded || invincible) return
    invincible = true
    info.changeLifeBy(-1)
    player.setPosition(15, 85)
    vy = 0
    pause(700)
    invincible = false
})

// Atteindre le drapeau
sprites.onOverlap(SpriteKind.Player, SpriteKind.Goal, function () {
    if (gameEnded) return
    gameEnded = true
    game.over(true, effects.confetti)
})

// Fin de partie
info.onLifeZero(function () {
    gameEnded = true
    game.over(false, effects.dissolve)
})
