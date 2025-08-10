let score = 0;
let tutorialMode = false;
let bought = [];
let orders = ["#espresso-image"];

function say(text) {
    return new Promise((resolve) =>  {
        let tutorialBox = document.getElementById("tutorial").children[0];
        tutorialBox.parentElement.setAttribute("visible", text);
        let buffer = "";
        [...text].forEach((char, i) => {
            setTimeout(() => {
                buffer += char;
                tutorialBox.setAttribute("value", buffer);
                if (i === text.length - 1) {
                    const handleClick = () => {
                        tutorialBox.parentElement.removeEventListener("click", handleClick);
                        resolve();
                    };
                    tutorialBox.parentElement.addEventListener("click", handleClick);
                }
            }, 50 * i);
        });
    });
}

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
        tutorial.addEventListener("click", async () => {
            tutorial.components.sound.playSound();
            tutorialMode = true;
            let tutorialBox = document.getElementById("tutorial");
            tutorialBox.setAttribute("visible", true);
            await say("So you want to run your own coffee shop?");
            await say("Well, we don't have much time, we already have our first customer!");
            await say("Look at the coffee machine and then the 'Brew' button!");
            await say(false);
        });

    }
});

// Coffee Machine Fuse Handler
AFRAME.registerComponent("fuse-handler", {
    init: function () {
        let buttonID = this.data;
        let button = document.querySelector(buttonID);
        this.el.addEventListener("click", () => {
            this.el.components.sound.playSound();
            document.querySelector(buttonID).setAttribute("visible", true);
        });
        this.el.addEventListener("mouseleave", () => {
            setTimeout(() => {
                if (button.getAttribute("fusing") !== "true") {
                    document.querySelector(buttonID).setAttribute("visible", false);
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
                setTimeout(async () => {
                    let espresso = document.querySelector("#espresso-shot");
                    espresso.setAttribute("position", { x: 0, y: 0.58, z: -1.5 });
                    espresso.setAttribute("visible", true);
                    brewButton.setAttribute("fusing", false);
                    brewButton.setAttribute("visible", false);
                    if (tutorialMode) {
                        await say("We've made an espresso shot! Now you gotta grab it and give it to the customer.");
                        await say(false);
                    }
                }, 5000);
            }
        });
        brewButton.addEventListener("mouseleave", () => {
            setTimeout(() => {
                document.querySelector("#brew-button").setAttribute("visible", false);
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

        function random() {
            customer.setAttribute("position", ({...customer.getAttribute("position"), x: Math.random() * 2 - 0.5}));
        }

        function chooseOrder() {
            let orderBox = document.getElementById("order-image");
            let order = orders[Math.round(Math.random())];
            if (!order) order = "#espresso-image";
            orderBox.setAttribute("src", order);
        }

        random();
        chooseOrder();

        customer.addEventListener("order", async function (event) {
            let orderBox = document.getElementById("order-image");
            let order = orderBox.getAttribute("src");
            let given = event.detail.coffee;
            let coffee = event.detail.el;

            if (order === "#latte-image" && given === "espresso") return;
            if (order === "#espresso-image" && given === "latte") return;

            coffee.setAttribute("visible", false);
            customer.components.sound.playSound();
            random();
            chooseOrder();
            score += event.detail.coffee === "espresso" ? 5 : 10;
            if (tutorialMode) {
                await say("Good job! You're a natural.")
                await say("I think you can run this shop on your own. I need to go get some milk.")
                await say("Before that, what do you wanna call your shop? Yes, it's your shop now!")
                let name = prompt("Name your shop:");
                await say("Seriously? " + name + "?");
                await say("That name's kinda goofy, but I guess it could work. Anyway, bye bye!");
                await say(false);
                tutorialMode = false;
            }
        });
    }
});

AFRAME.registerComponent("coffee", {
    init: function () {
        function playSound() {
            document.querySelector("#right-hand").components.sound.playSound();
        }
        
        const coffee = this.el;

        coffee.addEventListener("grab-start", () => {
            playSound();
        });

        coffee.addEventListener("grab-end", () => {
            playSound();
            let customer = document.querySelector("#customer");
            let customerPos = customer.object3D.position;
            let coffeePos = coffee.object3D.position;
            let distance = coffeePos.distanceTo(customerPos);

            if (distance < 1.05) {
                customer.emit("order", {coffee: this.data, el: coffee});
            } else if (this.data !== "latte") {
                let steamWand = document.querySelector("#steamWand");
                let steamWandPos = steamWand.object3D.position;
                distance = coffeePos.distanceTo(steamWandPos);

                if (distance < 0.75) {
                    coffee.setAttribute("visible", false);
                    let latte = document.getElementById("latte");
                    latte.setAttribute("position", { x: 1.5, y: 0.58, z: -0.65 });
                    latte.setAttribute("visible", true);
                }
            }
        });
    }
});

AFRAME.registerComponent("buy", {
    init: function () {
        this.el.addEventListener("click", () => {
            let item = this.el.id;
            let price = this.el.getAttribute("price");

            if (item === "counterBuy") {
                const counter = document.createElement("a-box");
                const counterModel = document.createElement("a-entity");
                const shopItems = document.getElementById("shopItems");

                counter.setAttribute("width", "2.5");
                counter.setAttribute("height", "1");
                counter.setAttribute("depth", "0.8");
                counter.setAttribute("opacity", "0");
                counter.setAttribute("position", "1.5 0 0");
                counter.setAttribute("rotation", "0 90 0");
                counter.setAttribute("scale", "0.7 0.5 0.5");
                counterModel.setAttribute("gltf-model", "#counter-model");
                counter.appendChild(counterModel);

                shopItems.insertBefore(counter, shopItems.firstChild);
                bought.push("counter");
            } else if (item === "steamWandBuy") {
                if (!bought.includes("counter")) return;

                const steamWand = document.createElement("a-box");
                const steamWandModel = document.createElement("a-entity");
                const steamWandButton = document.createElement("a-box");
                const shopItems = document.getElementById("shopItems");

                steamWand.setAttribute("id", "steamWand")
                steamWand.setAttribute("width", "1");
                steamWand.setAttribute("height", "1");
                steamWand.setAttribute("depth", "1");
                steamWand.setAttribute("opacity", "0");
                steamWand.setAttribute("position", "1.5 1.5 0");
                steamWand.setAttribute("rotation", "0 -90 0");
                steamWand.setAttribute("scale", "0.07 0.07 0.07");
                steamWandModel.setAttribute("gltf-model", "#steam-wand-model");
                steamWand.appendChild(steamWandModel);

                steamWandButton.setAttribute("id", "brew-button");
                steamWandButton.setAttribute("class", "clickable");

                shopItems.insertBefore(steamWand, shopItems.firstChild);
                bought.push("steamWand");
                orders.push("#latte-image");
            }

            if (score >= price) {
                score -= price;
                this.el.components.sound.playSound();
            }
        });
    }
});

AFRAME.registerComponent("shop", {
    init: function () {
        this.el.addEventListener("click", () => {
            this.el.components.sound.playSound();
            const camera = document.getElementById("camera");
            camera.setAttribute("position", { x: 0, y: 1, z: -6 });
        });
    }
});

AFRAME.registerComponent("back-button", {
    init: function () {
        this.el.addEventListener("click", () => {
            this.el.components.sound.playSound();
            const camera = document.getElementById("camera");
            camera.setAttribute("position", { x: 0, y: 1, z: 0 });
        });
    }
});