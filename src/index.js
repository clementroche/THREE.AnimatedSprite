require("./styles/index.scss");

import * as THREE from "three";
import AnimatedSprite from "./js/AnimatedSprite";
const OrbitControls = require("three-orbit-controls")(THREE);

import characterAnimations from "./assets/character.js";
import characterImage from "./assets/character.png";

class App {
    constructor() {
        //clock
        this.clock = new THREE.Clock();
        this.time = 0;

        //setup three.js scene
        this.setupScene();

        //resize canvas onwindowresize
        window.addEventListener(
            "resize",
            this.onWindowResize.bind(this),
            false
        );
    }

    setupScene() {
        // renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio = window.devicePixelRatio;
        document.body.appendChild(this.renderer.domElement);

        // scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#fefbf0");

        // camera
        this.camera = new THREE.PerspectiveCamera(
            40,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
        this.camera.position.set(0, 0, 5);

        // controls
        this.controls = new OrbitControls(
            this.camera,
            document.querySelector("canvas")
        );
        this.controls.enabled = true;
        this.controls.enablePan = false;

        // ambient light
        this.scene.add(new THREE.AmbientLight(0x222222));

        // directional light
        // this.light = new THREE.DirectionalLight(0xffffff, 1);
        // this.light.position.set(20, 20, 0);
        // this.scene.add(this.light);

        // var geometry = new THREE.BoxGeometry(10, 10, 10);
        // var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // var cube = new THREE.Mesh(geometry, material);
        // this.scene.add(cube);

        this.loadAssets().then(() => this.start());

        //render loop
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    start() {
        this.character = new THREE.AnimatedSprite({
            texture: this.assets["characterImage"],
            animations: characterAnimations,
            horizontalTiles: 8,
            verticalTiles: 8
        });

        this.character.startSequence([
            {
                id: "wait",
                loop: false,
                onStart:()=>{
                    console.log("wait", "started");
                },
                onComplete: () => {
                    console.log("wait", "ended");
                }
            },
            {
                id: "turn",
                loop: 1,
                onStart:()=>{
                    console.log("turn", "started");
                },
                onComplete: () => {
                    console.log("turn", "ended");
                }
            },
            {
                id:'jump',
                loop: 3,
                onStart:()=>{
                    console.log("jump", "started");
                },
                onLoop:()=> {
                    console.log("jump","looped")
                },
                onComplete: () => {
                    console.log("jump", "ended");
                }
            },
            {
                id:'jump to walk',
                loop: 1,
                onComplete: () => {
                    console.log("jumpToWalk", "ended");
                }
            },
            {
                id:'walk',
                loop: true,
                onStart:()=>{
                    console.log("walk", "started");
                },
                onComplete: () => {
                    console.log("walk", "ended");
                }
            }
        ]);

        this.scene.add(this.character);
    }

    render() {
        let deltaTime = this.clock.getDelta() * 5000
        this.time = this.time + deltaTime;

        this.character ? this.character.update(deltaTime) : null

        this.renderer.render(this.scene, this.camera);
    }

    loadAssets() {
        this.assets = {};
        return new Promise((resolve, reject) => {
            this.loadTexture(characterImage).then(texture => {
                this.assets["characterImage"] = texture;
                resolve();
            });
        });
    }

    loadTexture(url) {
        let loader = new THREE.TextureLoader();

        return new Promise((resolve, reject) => {
            loader.load(
                url,
                texture => {
                    resolve(texture);
                },
                undefined,
                error => {
                    reject(error);
                }
            );
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

const APP = new App();
