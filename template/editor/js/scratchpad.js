
var Game = {
    info: {
        "public": false,
        "clonable": false,
        "authors": [
            {
                username: "lorem",
                roles: ["artifex", "musicus"],
                firstName: "Lorem",
                lastName: "Ipsum"
            },
            {
                username: "ipsum",
                roles: ["physicus", "principes"],
                firstName: "Ipsum",
                lastName: "Lorem"
            }
        ]
    },
    sceneElements: [
        {
            name: "Background Image",
            type: "background-image",
            icon: "/assets/img/icons/background-image.png",
            available: [ "intro", "game", "outro" ],
            potions: []
        },
        {
            name: "Timer",
            type: "timer",
            icon: "/assets/img/icons/timer.png",
            available: [ "game" ],
            potions: [ "font" ]
        },
        {
            name: "Dialog",
            type: "dialog",
            icon: "/assets/img/icons/dialog.png",
            available: [ "game" ],
            potions: [ "font", "dialog" ]
        },
        {
            name: "Highscore",
            type: "highscore",
            icon: "/assets/img/icons/highscore.png",
            available: [ "intro", "outro" ],
            potions: [ "font" ]
        },
        {
            name: "Volume",
            type: "volume",
            icon: "/assets/img/icons/volume.png",
            available: [ "intro", "game", "outro" ],
            potions: []
        },
        {
            name: "Start Game",
            type: "start-button",
            icon: "/assets/img/icons/start-button.png",
            available: [ "intro", "outro" ],
            potions: [ "font" ]
        }
    ],
    scenes: [
        {
            index: 1,
            name: "Intro"
        },
        {
            index: 2,
            name: "Game",
            elements: [
                {
                    name: "Background Image",
                    type: "background-image",
                    src: "/assets/img/bg.jpeg"
                },
                {
                    name: "Timer",
                    type: "timer",
                    value: 120,
                    asc: true
                }
            ]
        },
        {
            index: 3,
            name: "Outro"
        }
    ],
    audios: [
        {
            name: "Weight Up",
            id: "weight-up",
            type: "file", // file || blob
            content: "weight-up"
        }
    ],
    sprites: [
        {
            name: "Player",
            id: "player-sprite",
            type: "file", // file || blob
            content: "player",
            frameCount: 0 // as in array
        },
        {
            name: "Mario Run",
            id: "mario-run-sprite",
            type: "file", // file || blob
            content: "mario-run",
            frameCount: 0 // as in array
        },
        {
            name: "Mario Fly",
            id: "mario-fly-sprite",
            type: "file", // file || blob
            content: "mario-fly",
            frameCount: 0
        },
        {
            name: "Painting",
            id: "painting-sprite",
            type: "file", // file || blob
            content: "painting",
            frameCount: 0
        },
        {
            name: "Mushroom",
            id: "mushroom-sprite",
            type: "file", // file || blob
            content: "mushroom",
            frameCount: 0
        },
        {
            name: "Brick",
            id: "brick-full-sprite",
            type: "file", // file || blob
            content: "brick-full",
            frameCount: 0
        },
        {
             name: "Brick Half",
             id: "brick-sprite",
             type: "file", // file || blob
             content: "brick",
             frameCount: 0
         }
    ],
    canvas: {
        blockSize: 32,
        width: 20,
        height: 14,
        elements: [
            {
                type: "super-mario",
                position: {
                    x: 4, 
                    y: 1
                }
            },
            { type: "brick", position: { x: 19, y: 13 } },
            { type: "brick", position: { x: 18, y: 13 } },
            { type: "brick", position: { x: 17, y: 13 } },
            { type: "brick", position: { x: 16, y: 13 } },
            { type: "brick", position: { x: 15, y: 13 } },
            { type: "brick", position: { x: 14, y: 13 } },
            { type: "brick", position: { x: 13, y: 13 } },
            { type: "brick", position: { x: 12, y: 13 } },
            { type: "brick", position: { x: 11, y: 13 } },
            { type: "brick", position: { x: 10, y: 13 } },
            { type: "brick", position: { x: 9, y: 13 } },
            { type: "brick", position: { x: 8, y: 13 } },
            { type: "brick", position: { x: 7, y: 13 } },
            { type: "brick", position: { x: 6, y: 13 } },
            { type: "brick", position: { x: 5, y: 13 } },
            { type: "brick", position: { x: 4, y: 13 } },
            { type: "brick", position: { x: 3, y: 13 } },
            { type: "brick", position: { x: 2, y: 13 } },
            { type: "brick", position: { x: 1, y: 13 } },
            { type: "brick", position: { x: 0, y: 13 } },
            { type: "brick-half", position: { x: 19, y: 11 } },
            { type: "brick-half", position: { x: 18, y: 11 } },
            { type: "brick-half", position: { x: 17, y: 11 } },
            { type: "brick-half", position: { x: 16, y: 11 } },
            { type: "brick-half", position: { x: 15, y: 11 } },
            { type: "painting", position: { x: 17, y: 1 } },
            { type: "mushroom", position: { x: 6, y: 1 } }
        ]
    },
    elements: [
        {
            name: "Süper Mario",
            type: "super-mario",
            //event: [],
            attr: {
                controls: {
                    method: "Twoway",
                    speed: 1,
                    jump: 5.5,
                    snapToGrid: false,
                    keepOnCanvas: true
                },
                events: [
                    {
                        type: "keyboard",
                        key: "LEFT_ARROW",
                        animation: { id: "mario-fly-sprite" }
                    },
                    {
                        type: "keyboard",
                        key: "RIGHT_ARROW",
                        animation: { id: "mario-run-sprite" }
                    }
                ],
                collisions: [
                    {
                        tgt: "painting",
                        action: "tgt-destroy",
                        audio: { audio: "weight-up" }
                    }
                ],
                gravitation: {
                    on: false,
                    strength: 2,
                    inverted: false,
                    platform: false
                },

                /*
                scores: [
                    {
                        action: "tgt-destroy",
                        // which object
                        score: 33
                    },
                    {
                        action: "tgt-push",
                        // which object
                        score: 4
                    }
                ], */

                dialogs: [
                    {
                        action: "tgt-destroy",
                        // which object
                        text: "loremp upus kldj kljsödkfj kljf"
                    }
                ],
                font: {
                    family: "Helvetica",
                    size: 11,
                    color: "#c0ffee",
                    bgcolor: "#bada55"
                },
                /* audios: [
                    {
                        action: "tgt-destroy",
                        sound: "sound-file-entity"
                        // .mp3, .ogg, .wav
                    },
                    {
                        action: "tgt-push",
                        sound: "sound-file-entity"
                        // .mp3, .ogg, .wav
                    }
                ], */
                image: {
                    id: "player-sprite"
                } /*,
                animations: [
                    {
                        action: "self-move-left",
                        src: "base64-encoded-png-images",
                        count: -1
                        // play count
                    },
                    {
                        action: "self-move-right",
                        src: "base64-encoded-png-images",
                        count: 2
                        // play count
                    }
                ] */
            }
        },
        {
            name: "Brick",
            type: "brick",
            attr: {
                image: {
                    id: "brick-full-sprite"
                },
                gravitation: {
                    platform: true
                }
            }
        },
        {
            name: "Brick Half",
            type: "brick-half",
            attr: {
                image: {
                    id: "brick-sprite"
                },
                gravitation: {
                    platform: true
                }
            }
        },
        {
            name: "Painting",
            type: "painting",
            attr: {
                image: {
                    id: "painting-sprite"
                },
                gravitation: {
                    on: true,
                    strength: 2,
                    inverted: false,
                    platform: false
                }
            }
        },
        {
            name: "Mushroom",
            type: "mushroom",
            attr: {
                image: {
                    id: "mushroom-sprite"
                },
                gravitation: {
                    on: true,
                    strength: 2,
                    inverted: false,
                    platform: false
                }
            }
        }
    ],
    shoutbox: [
        {
            datetime: "2012-06-06 12:12",
            role: "musicus",
            firstName: "Francesca",
            msg: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pharetra aliquet lorem, ut convallis ante rutrum id."
        },
        {
            datetime: "2012-06-06 12:14",
            role: "musicus",
            firstName: "Francesca",
            msg: "Lorem ipsum pharetra aliquet lorem, ut convallis ante rutrum id."
        }
    ]
};

var User = {
    preferences: {
        lang: "fi",
        grid: true,
        theme: "dark"
    }
};

var Users = [
    {
        username: "",
        userId: 11,
        socketId: 139,
        busy: true,
        roles: ["artifex", "musicus"],
        firstName: "Lorem"
    },
    {
        username: "",
        userId: 11,
        socketId: 139,
        busy: false,
        roles: ["artifex", "musicus"],
        firstName: "Lorem"
    }
];
