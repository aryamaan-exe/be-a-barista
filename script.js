// Created by: Aryamaan Goswamy
// Duplication not allowed. GitHub repository created for documentation purposes.

let missing = [];

AFRAME.registerComponent("scene", {
    init: function() {
        fetch("magicNumbers.json")
        .then(response => response.json())
        .then(initData => {
            for (const [elementID, params] of Object.entries(initData)) {
                const element = document.getElementById(elementID);
                if (!element) {
                    missing.push(elementID);
                    continue;
                }
                for (const [param, value] of Object.entries(params)) {
                    console.log(elementID, ":", param);
                    element.setAttribute(param, value);
                }
            }
        })
        .catch(err => console.error("Error loading JSON:", err));
    },
    tick: function() {
        if (missing.length === 0) return;
        console.log(missing);
        fetch("magicNumbers.json")
        .then(response => response.json())
        .then(initData => {
            for (const [elementID, params] of Object.entries(initData)) {
                if (!missing.includes(elementID)) continue;

                const element = document.getElementById(elementID);
                if (element) {
                    for (const [param, value] of Object.entries(params)) {
                        console.log(elementID, ":", param);
                        element.setAttribute(param, value);
                    }
                    missing.splice(missing.indexOf(element), 1);
                }
            }
        })
    }
});

let tutorialMode = false;

AFRAME.registerComponent("play-music", {
    init: function() {
        let musicButton = this.el;
        musicButton.addEventListener("click", () => {
            if (musicButton.getAttribute("playing") !== "true") {
                musicButton.components.sound.playSound();
                musicButton.setAttribute("playing", "true");
                musicButton.children[0].setAttribute("value", "Music:\nOn");
            } else {
                musicButton.components.sound.pauseSound();
                musicButton.setAttribute("playing", "false");
                musicButton.children[0].setAttribute("value", "Music:\nOff");
            }
        });
    }
});

AFRAME.registerComponent("tutorial", {
    init: function() {
        let tutorial = this.el;
        tutorial.addEventListener("click", () => {
            tutorial.components.sound.playSound();
            tutorialMode = true;
            alert("So you want to run your own coffee shop?");
            alert("Well, we don't have much time, we already have our first customer!");
            alert("Look at the coffee machine and then the 'Brew' button!");
        });
    }
});

// Coffee Machine Fuse Handler
AFRAME.registerComponent("fuse-handler", {
    init: function () {
        let brewButton = document.querySelector("#brew-button");
        this.el.addEventListener("click", () => {
            this.el.components.sound.playSound();
            this.el.emit("order");
            document.querySelector("#brew-button").setAttribute("visible", "true");
        });
        this.el.addEventListener("mouseleave", () => {
            setTimeout(() => {
                if (brewButton.getAttribute("fusing") !== "true") {
                    document.querySelector("#brew-button").setAttribute("visible", "false");
                }
            }, 2500);
        });
    }
});

AFRAME.registerComponent("brew-button-clicked", {
    init: function () {
        let brewButton = this.el;
        brewButton.addEventListener("fusing", () => {
            brewButton.setAttribute("fusing", "true");
        });
        brewButton.addEventListener("click", () => {
            if (brewButton.getAttribute("visible")) {
                brewButton.components.sound.playSound();
                setTimeout(() => {
                    document.querySelector("#espresso-shot").setAttribute("visible", "true");
                    brewButton.setAttribute("fusing", "false");
                    brewButton.setAttribute("visible", "false");
                    if (tutorialMode) {
                        alert("We've made an espresso shot! Now you gotta grab it and give it to the customer.");
                    }
                }, 5000);
            }
        });
        brewButton.addEventListener("mouseleave", () => {
            setTimeout(() => {
                document.querySelector("#brew-button").setAttribute("visible", "false");
            }, 1000);
        });
    }
});

AFRAME.registerComponent("cursor-complementary-color", {
    init: function () {
        const cursor = this.el;
        cursor.addEventListener("raycaster-intersection", evt => {
            const intersectedEls = evt.detail.els;
            if (!intersectedEls || !intersectedEls.length) return;

            let firstVisibleEl = null;
            for (let el of intersectedEls) {
                if (el.getAttribute("visible") !== false) {
                firstVisibleEl = el;
                break;
                }
            }
            if (!firstVisibleEl) return;

            const firstEl = intersectedEls[0];
            const colorAttr = firstEl.getAttribute("color");
            if (!colorAttr) return;

            const color = new THREE.Color(colorAttr);
            const compColor = new THREE.Color(1 - color.r, 1 - color.g, 1 - color.b);
            cursor.setAttribute("material", "color", "#" + compColor.getHexString());
        });

        cursor.addEventListener("raycaster-intersection-cleared", () => {
            cursor.setAttribute("material", "color", "#000000");
        });
    }
});

AFRAME.registerComponent("customer-order", {
    init: function () {
        const customer = this.el;
        let score = 0;

        function random() {
            customer.setAttribute("position", ({...customer.getAttribute("position"), x: Math.random() * 2 - 0.5}));
        }

        random();

        customer.addEventListener("order", function () {
            customer.components.sound.playSound();
            random();
            score += 5;
            document.querySelector("#balance").children[0].setAttribute("value", "$" + score);
            if (tutorialMode) {
                alert("Good job! You're a natural.")
                alert("I think you can run this shop on your own. I need to go get some milk.")
                alert("Before that, what do you wanna call your shop? Yes, it's your shop now!")
                let name = prompt("Name your shop:");
                alert("Seriously? " + name + "?");
                alert("That name's kinda goofy, but I guess it could work. Anyway, bye bye!");
                tutorialMode = false;
            }
        });
    }
});

AFRAME.registerComponent("espresso-shot", {
    init: function () {
        function playSound() {
            document.querySelector("#right-hand").components.sound.playSound();
        }
        
        const espresso = this.el;

        espresso.addEventListener("grab-start", () => {
            playSound();
        });

        espresso.addEventListener("grab-end", () => {
            playSound();
            let customer = document.querySelector("#customer");
            let customerPos = customer.object3D.position;
            let espressoPos = espresso.object3D.position;
            let distance = espressoPos.distanceTo(customerPos);
            console.log(distance);

            if (distance < 1.05) {
                espresso.setAttribute("visible", false);
                espresso.setAttribute("position", {x: 0, y: 1.18, z: -1.5});
                customer.emit("order");
            }
        });
    }
});