import * as THREE from "three";

/**
 *
 * @param {THREE.Texture} texture - A THREE texture
 * @param {(array\|object)} animations - Array of sprite animations object
 * @param {number} horizontalTiles - Number of horizontal tiles in the texture
 * @param {number} verticalTiles - Number of vertical tiles in the texture
 *
 */

THREE.AnimatedSprite = class AnimatedSprite extends THREE.Object3D {
    constructor({ texture, animations, horizontalTiles, verticalTiles }) {
        super();
        this.texture = texture;
        this.animations = animations;
        this.horizontalTiles = horizontalTiles;
        this.verticalTiles = verticalTiles;
        if (
            !this.texture ||
            !this.animations ||
            !this.horizontalTiles ||
            !this.verticalTiles
        ) {
            console.warn("incorrect arguments");
            return;
        }

        if (this.texture.image) {
            //texture doesn't require loading
            this.createMesh();
        } else {
            console.warn("texture have to be THREE texture");
            return;
        }

        return this;
    }

    createMesh() {
        this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;

        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1);

        this.uniforms = {
            uTime: {
                value: 0
            },
            uTexture: {
                value: this.texture
            },
            uTiles: {
                value: new THREE.Vector2(
                    this.horizontalTiles,
                    this.verticalTiles
                )
            },
            uOffset: {
                value: new THREE.Vector2(0, 0)
            }
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( vec3(position), 1.0 );
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform float uTime;
                uniform vec2 uTiles;
                uniform vec2 uOffset;

                varying vec2 vUv;

                void main() {
                    vec2 offset = vec2(uOffset.x,-uOffset.y + (uTiles.y-1.));
                    vec2 tile = vUv * vec2(1./uTiles.x,1./uTiles.y) + (offset/uTiles);
                    gl_FragColor = texture2D(uTexture,tile);
                }
            `,
            transparent: true
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }

    setOffset() {
        let indexRow = Math.floor(this.currentTile / this.horizontalTiles);
        let indexColumn = this.currentTile % this.horizontalTiles;

        this.uniforms.uOffset.value.x = indexColumn;
        this.uniforms.uOffset.value.y = indexRow % this.verticalTiles;
    }

    startSequence(animationsSequence) {
        animationsSequence.forEach((animation, index) => {
            let animationObject = this.animations.find(
                anim => anim.id === animation.id
            );

            if (animationObject) {
                Object.assign(animationsSequence[index], animationObject);
            } else {
                console.warn(
                    `animation called: "${
                        animationsSequence[index].id
                    }" doesn't exist`
                );
                animationsSequence[index] = null;
            }
        });
        this.animationsSequence = animationsSequence.filter(
            animation => animation != null
        );

        this.selectCurrentAnimation();
        return this;
    }

    selectCurrentAnimation() {
        this.startTile = this.currentAnimation.start;
        this.endTile = this.currentAnimation.end;
        this.currentTile = this.currentAnimation.start;
        this.durationPerTile = this.currentAnimation.durationTile;
        this.currentTime = 0;

        this.currentAnimation.onStart ? this.currentAnimation.onStart() : null;
    }

    nextAnimation() {
        if (typeof this.currentAnimation.loop === "number") {
            this.currentAnimation.loop -= 1;
        }

        if (
            this.currentAnimation.loop === undefined ||
            this.currentAnimation.loop === 0 ||
            this.currentAnimation.loop === false
        ) {
            this.currentAnimation.onComplete
                ? this.currentAnimation.onComplete()
                : null;
            this.animationsSequence.shift();
            if (this.animationsSequence.length > 0) {
                this.selectCurrentAnimation();
                this.setOffset();
            }
        } else {
            this.currentAnimation.onLoop
                ? this.currentAnimation.onLoop()
                : null;
        }
    }

    get currentAnimation() {
        return this.animationsSequence[0] || null;
    }

    update(delta) {
        if (this.animationsSequence.length > 0) {
            this.currentTime += delta;
            if (this.currentTime >= this.durationPerTile) {
                this.currentTile += 1;
                this.setOffset();
                this.currentTime = 0;
                if (this.currentTile > this.endTile) {
                    this.nextAnimation();
                    this.currentTile = this.startTile;
                }
            }
        }
    }
}

export default THREE.AnimatedSprite
