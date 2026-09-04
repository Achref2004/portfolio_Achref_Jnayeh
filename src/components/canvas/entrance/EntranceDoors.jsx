import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import '../shaders/RevealMaterial'; // Registers alpha-discard reveal shader
import { playBackgroundMusic } from '../../../utils/audioManager';
import { useAchievements } from '../../../context/AchievementsContext';
import { isTouchDevice } from '../../../utils/deviceDetect';

// Use same font as App.jsx preload (Inter) - works reliably
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';



/**
 * EntranceDoors Component - 3D Entrance to the Corridor
 * 
 * Doors that open and camera flies through.
 * EmptyCorridor provides the surrounding corridor context.
 */
const EntranceDoors = ({
    position = [0, 0, 22],
    onComplete,
    corridorHeight = 8, // Taller wall
    corridorWidth = 15 // Wider wall
}) => {
    const porteGaucheRef = useRef();
    const porteDroiteRef = useRef();
    const poigneeGaucheRef = useRef();
    const poigneeDroiteRef = useRef();
    const materiauPorteDroiteRef = useRef(); // Contrôle GSAP du shader
    const materiauPorteGaucheRef = useRef(); // Contrôle de révélation de la porte gauche
    const materiauPoigneeGaucheRef = useRef(); // Contrôle de révélation de la poignée gauche
    const materiauPoigneeDroiteRef = useRef(); // Contrôle de révélation de la poignée droite
    const poigneePeinteGaucheRef = useRef(); // Visibilité du maillage peint de la poignée gauche
    const poigneePeinteDroiteRef = useRef(); // Visibilité du maillage peint de la poignée droite
    const groupeRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { camera } = useThree();
    const { unlockAchievement } = useAchievements();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isTouchDevice() || window.innerWidth < 1000);
    }, []);

    // Dla hooków tekstur musimy obliczyć to raz na starcie
    const isMobileDevice = typeof window !== 'undefined' && (isTouchDevice() || window.innerWidth < 1000);
    const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const frameTexture = useTexture('/textures/doors/frame_sketch.webp');
    const doorLeftTexture = useTexture('/textures/doors/door_left_sketch.png');
    const doorRightTexture = useTexture('/textures/doors/door_right_sketch.png');

    // Mobile optimization: Don't load painted textures or handles on phones
    const doorRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_right_painted.png');
    const doorLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_left_painted.png');
    const handleLeftTexture = useTexture('/textures/doors/handle_left_sketch.webp');
    const handleLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_left_painted.webp');
    const handleRightTexture = useTexture('/textures/doors/handle_right_sketch.webp');
    const handleRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_right_painted.webp');

    // Dynamic textures for mobile
    const doorBackTexture = useTexture(isMobileDevice ? '/textures/corridor/doors/door_back.webp' : '/textures/doors/door_right_painted.png');
    const edgeTexture = useTexture(isMobileDevice ? '/textures/doors/pien_sketch.webp' : '/textures/doors/pien_sketch.webp');

    const bricksTexture = useTexture('/textures/entrance/wall_bricks_2.png');
    const stonePathTexture = useTexture('/textures/entrance/stone-path.webp');
    // const catTexture = useTexture('/textures/entrance/cat_sketch.webp'); // Old side cat
    const catFrontBodyTexture = useTexture('/textures/entrance/cat_front_body.png');
    const windowSketchTexture = useTexture('/textures/entrance/balka.png');
    const mouseTexture = useTexture('/textures/entrance/mouse_hanging.webp');
    const bugTexture = useTexture('/textures/entrance/assfour.png');
    const inkSplashTexture = useTexture('/images/ink-splash.webp');

    // Cat Ref
    const pupilleGaucheRef = useRef();
    const pupilleDroiteRef = useRef();
    const groupeChatRef = useRef(); // Pour obtenir la position mondiale pour le suivi
    const insecteRef = useRef();

    // Bug Click Animation State
    const [isBugClicked, setIsBugClicked] = useState(false);
    const [textVisible, setTextVisible] = useState(false);
    const [clipProgress, setClipProgress] = useState(0); // 0-1 for pencil drawing reveal
    const inkSplashRef = useRef();
    const handleHideDelayRef = useRef(); // Track pending gsap.delayedCall for handle visibility
    const bugFixedTextRef = useRef();
    const bugClickPos = useRef({ x: 0, y: 0 }); // Store click position

    // Bug Click Handler
    const handleBugClick = (e) => {
        e.stopPropagation();
        if (isBugClicked) return; // Already clicked

        // Store bug position at click time
        if (insecteRef.current) {
            bugClickPos.current = {
                x: insecteRef.current.position.x,
                y: insecteRef.current.position.y
            };
        }

        setIsBugClicked(true);
        document.body.style.cursor = "auto";

        // Animate ink splash scale up
        if (inkSplashRef.current) {
            // Position ink splash at bug's last position
            inkSplashRef.current.position.x = bugClickPos.current.x;
            inkSplashRef.current.position.y = bugClickPos.current.y;
            inkSplashRef.current.scale.set(0, 0, 0);
            inkSplashRef.current.material.opacity = 1;

            gsap.to(inkSplashRef.current.scale, {
                x: 0.8,
                y: 0.8,
                z: 1,
                duration: 0.4,
                ease: 'back.out(1.7)'
            });
        }

        // Pencil drawing effect - smooth reveal from left to right
        setTextVisible(true);
        setClipProgress(0);

        if (bugFixedTextRef.current) {
            bugFixedTextRef.current.position.x = bugClickPos.current.x;
            bugFixedTextRef.current.position.y = bugClickPos.current.y;
        }

        // Animate clip progress from 0 to 1 (reveals text like pencil drawing)
        gsap.to({ progress: 0 }, {
            progress: 1,
            duration: 0.8,
            ease: 'power1.inOut',
            onUpdate: function () {
                setClipProgress(this.targets()[0].progress);
            },
            onComplete: () => {
                // Fade out after a delay
                setTimeout(() => {
                    if (inkSplashRef.current) {
                        gsap.to(inkSplashRef.current.material, {
                            opacity: 0,
                            duration: 1,
                            ease: 'power2.out'
                        });
                    }
                }, 1500);
            }
        });
    };

    // Door dimensions - calculated from texture proportions (332x848 = 1:2.55)
    // Door dimensions - calculated from texture proportions (332x848 = 1:2.55)
    const doorWidth = 0.94;
    const doorHeight = 2.4;
    const doorOpeningWidth = doorWidth * 2; // Both doors together
    const wallThickness = 0.07;

    // Frame dimensions from texture (718x877 = 1:1.22)
    const frameWidth = doorOpeningWidth + 0.16; // Extra for frame borders
    const frameHeight = frameWidth * (877 / 718); // Maintain texture aspect ratio

    // Floor Y must remain at standard level (-1.75) regardless of wall height
    const floorY = -1.75;
    const doorBottomY = floorY;
    const doorCenterY = doorBottomY + doorHeight / 2;
    const wallCenterY = floorY + corridorHeight / 2;
    const topWallHeight = corridorHeight - doorHeight;
    const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
    const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;



    // Cat Interaction State


    // Handle click
    const handleClick = (e) => {
        e.stopPropagation();
        if (isOpen || isAnimating) return;

        // Reset cursor immediately on transition start
        document.body.style.cursor = "auto";

        setIsOpen(true);
        setIsAnimating(true);
        playBackgroundMusic();
        unlockAchievement('corridor_enter');

        const tl = gsap.timeline({
            onComplete: () => {
                onComplete?.();
            }
        });

        // Press handles down fully (like really opening)
        if (poigneeGaucheRef.current) {
            tl.to(poigneeGaucheRef.current.rotation, {
                z: 0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }
        if (poigneeDroiteRef.current) {
            tl.to(poigneeDroiteRef.current.rotation, {
                z: -0.4,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }

        // Open doors - smoother angle (matches SegmentDoors)
        tl.to(porteGaucheRef.current.rotation, {
            y: -Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        tl.to(porteDroiteRef.current.rotation, {
            y: Math.PI * 0.55,
            duration: 0.9,
            ease: 'power2.out'
        }, 0.1);

        // Camera flies through - STOP CLOSER to avatar/ACHREF
        tl.to(camera.position, {
            z: 11,  // Closer stop point (was 11)
            y: 0.2, // Match hook's base Y position
            duration: 1.8,
            ease: 'power2.inOut'
        }, 0.3);
    };

    // Handle hover - doors slightly open to indicate interactivity
    const handlePointerEnter = () => {
        if (isOpen || isAnimating || isMobile) return;
        setIsHovered(true);
        document.body.style.cursor = "pointer";

        // Slightly open doors on hover
        gsap.to(porteGaucheRef.current.rotation, {
            y: -0.08,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });
        gsap.to(porteDroiteRef.current.rotation, {
            y: 0.08,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });

        // Rotate handles down slightly (hint effect)
        if (poigneeGaucheRef.current) {
            gsap.to(poigneeGaucheRef.current.rotation, {
                z: 0.1,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (poigneeDroiteRef.current) {
            gsap.to(poigneeDroiteRef.current.rotation, {
                z: -0.1,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Brush-stroke reveal: discard sketch pixels to show painted door beneath
        if (materiauPorteDroiteRef.current) {
            gsap.to(materiauPorteDroiteRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPorteGaucheRef.current) {
            gsap.to(materiauPorteGaucheRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPoigneeGaucheRef.current) {
            gsap.to(materiauPoigneeGaucheRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPoigneeDroiteRef.current) {
            gsap.to(materiauPoigneeDroiteRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        // Show painted handles (kill any pending hide from previous leave)
        if (handleHideDelayRef.current) handleHideDelayRef.current.kill();
        if (poigneePeinteGaucheRef.current) poigneePeinteGaucheRef.current.visible = true;
        if (poigneePeinteDroiteRef.current) poigneePeinteDroiteRef.current.visible = true;
    };

    const handlePointerLeave = () => {
        if (isOpen || isAnimating || isMobile) return;
        setIsHovered(false);
        document.body.style.cursor = "auto";

        // Close doors back
        gsap.to(porteGaucheRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });
        gsap.to(porteDroiteRef.current.rotation, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true
        });

        // Reset handles
        if (poigneeGaucheRef.current) {
            gsap.to(poigneeGaucheRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (poigneeDroiteRef.current) {
            gsap.to(poigneeDroiteRef.current.rotation, {
                z: 0,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Reverse brush-stroke reveal
        if (materiauPorteDroiteRef.current) {
            gsap.to(materiauPorteDroiteRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPorteGaucheRef.current) {
            gsap.to(materiauPorteGaucheRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPoigneeGaucheRef.current) {
            gsap.to(materiauPoigneeGaucheRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (materiauPoigneeDroiteRef.current) {
            gsap.to(materiauPoigneeDroiteRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }

        // Hide painted handles after reverse animation completes
        handleHideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (poigneePeinteGaucheRef.current) poigneePeinteGaucheRef.current.visible = false;
            if (poigneePeinteDroiteRef.current) poigneePeinteDroiteRef.current.visible = false;
        });
    };



    // --- Cat Eye Tracking Logic ---
    useFrame((state) => {
        if (!pupilleGaucheRef.current || !pupilleDroiteRef.current) return;

        // Mouse position in normalized device reference (-1 to +1)
        const { x, y } = state.pointer;

        // Configuration
        const MAX_EYE_MOVEMENT = 0.015; // How far pupils can move from center

        // Simple mapping
        const targetX = x * MAX_EYE_MOVEMENT * 2;
        const targetY = y * MAX_EYE_MOVEMENT * 2;

        // Smoothly interpolate current pupil position to target
        // Left Eye Original: [-0.063, 0.27]
        pupilleGaucheRef.current.position.x = THREE.MathUtils.lerp(pupilleGaucheRef.current.position.x, -0.075 + targetX, 0.1);
        pupilleGaucheRef.current.position.y = THREE.MathUtils.lerp(pupilleGaucheRef.current.position.y, 0.28 + targetY, 0.1);

        // Right Eye Original: [0.0615, 0.27]
        pupilleDroiteRef.current.position.x = THREE.MathUtils.lerp(pupilleDroiteRef.current.position.x, 0.043 + targetX, 0.1);
        pupilleDroiteRef.current.position.y = THREE.MathUtils.lerp(pupilleDroiteRef.current.position.y, 0.28 + targetY, 0.1);
    });

    // --- Mouse Swinging Animation ---
    const mousePivotRef = useRef();
    useFrame(({ clock }) => {
        if (mousePivotRef.current) {
            // Gentle swing: sin wave
            // Amplitude: 0.05 radians (approx 3 degrees)
            // Speed: 1.5
            mousePivotRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
        }

        // --- Bug Animation ---
        if (insecteRef.current) {
            const time = clock.elapsedTime;
            // Wandering logic: slightly complex sine waves for "random" walking felt
            // Initial Pos: [2.5, floorY + 3.0, 0.16] (Above window)
            // Range: +/- 0.3 in X, +/- 0.3 in Y

            const xOffset = Math.sin(time * 0.8) * 0.3 + Math.sin(time * 1.5) * 0.1;
            const yOffset = Math.cos(time * 0.6) * 0.2 + Math.cos(time * 1.1) * 0.1;

            insecteRef.current.position.x = 3 + xOffset;
            insecteRef.current.position.y = (floorY + 3.8) + yOffset;

            // Random rotation jitter
            insecteRef.current.rotation.z = Math.sin(time * 5) * 0.1 + Math.atan2(yOffset, xOffset) * 0.2;
        }
    });



    // Frame center Y - aligned with doors
    const frameCenterY = doorBottomY + frameHeight / 2;

    const facadeYOffset = -1.65;


    const pathWidth = frameWidth + 0.4;
    // New texture is 1005x2317 (approx 1:2.3 ratio). 
    // Width 2.44 * 2.3 = ~5.6 height.
    const pathLength = 5.62;

    return (
        <group ref={groupeRef} position={[position[0], 0, position[2]]}>

            {/* === STONE PATH FLOOR (On Top - in front of entrance) === */}
            {/* WYSOKOŚĆ STONE PATH: zmień 'floorY + 0.02' - większa liczba = wyżej */}
            <mesh
                position={[0, floorY + 0.02, pathLength / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[pathWidth, pathLength]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={stonePathTexture}
                    transparent={true}
                />
            </mesh>


            {/* LEFT WALL PANEL */}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95} />
            </mesh>

            {/* RIGHT WALL PANEL */}
            <mesh position={[(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95} />
            </mesh>

            {/* TOP WALL PANEL */}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95} />
            </mesh>

            {/* === BRICK FACADE === */}
            {/* 
                DOSTOSOWANIE OBRAZKA (TEXTURE ADJUSTMENT):
                1. args={[Szerokość, Wysokość]} - Rozmiar obrazka
                2. facadeYOffset - Przesunięcie góra/dół (np. -1 obniży, 1 podwyższy)
            */}
            <mesh position={[0, wallCenterY + facadeYOffset + 1.65, 0.15]}>
                {/* args={[Szerokość, Wysokość]} - Zmieniaj te liczby (np. 7, 8) */}
                <planeGeometry args={[16., 8]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={bricksTexture}
                    transparent={true}
                    alphaTest={0.01}
                    roughness={0.9}
                />
            </mesh>

            {/* === TEXTURED FRAME === */}
            <mesh position={[0, frameCenterY, 0.12]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    roughness={0.9}
                    depthWrite={false}
                />
            </mesh>

            {/* LEFT DOOR */}
            <group ref={porteGaucheRef} position={[-doorWidth, doorCenterY, 0]}>
                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Painted layer (behind sketch) - left door */}
                {!isMobile && (
                    <mesh position={[doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={doorLeftPaintedTexture}
                            transparent={true}
                            alphaTest={0.5}
                            roughness={0.8}
                        />
                    </mesh>
                )}

                {/* Sketch overlay (front) - left door brush-stroke reveal */}
                <mesh position={[doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#e0e0e0"
                        ref={materiauPorteGaucheRef}
                        map={doorLeftTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Back Texture Face (mirrored) */}
                <mesh position={[doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        side={2}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (292,459 on 332x848 texture) */}
                <group ref={poigneeGaucheRef} position={[doorWidth / 2 + 0.357, -0.099, 0.10]}>
                    {/* Painted handle (behind) - hidden until hover */}
                    {!isMobile && (
                        <mesh ref={poigneePeinteGaucheRef} position={[-0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#e0e0e0"
                                map={handleLeftPaintedTexture}
                                transparent={true}
                                alphaTest={0.5}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                    {/* Sketch handle overlay (front) */}
                    <mesh position={[-0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#e0e0e0"
                            ref={materiauPoigneeGaucheRef}
                            map={handleLeftTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                            uProgress={0.0}
                        />
                    </mesh>
                </group>
            </group>

            {/* RIGHT DOOR */}
            <group ref={porteDroiteRef} position={[doorWidth, doorCenterY, 0]}>
                {/* Solid 3D Door Body with edge texture */}
                <mesh
                    position={[-doorWidth / 2, 0, 0.06]}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {/* Painted layer (behind sketch) - revealed when sketch fades out on hover */}
                {!isMobile && (
                    <mesh position={[-doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={doorRightPaintedTexture}
                            transparent={true}
                            alphaTest={0.5}
                            roughness={0.8}
                        />
                    </mesh>
                )}

                {/* Sketch overlay (front) - brush-stroke discard reveals painted beneath */}
                <mesh position={[-doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#e0e0e0"
                        ref={materiauPorteDroiteRef}
                        map={doorRightTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Back Texture Face */}
                <mesh position={[-doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={doorBackTexture}
                        transparent={true}
                        alphaTest={0.5}
                        roughness={0.8}
                    />
                </mesh>

                {/* Handle Layer (animated) - pivot at screw center (40,459 on 332x848 texture) */}
                <group ref={poigneeDroiteRef} position={[-doorWidth / 2 - 0.357, -0.099, 0.10]}>
                    {/* Painted handle (behind) - hidden until hover */}
                    {!isMobile && (
                        <mesh ref={poigneePeinteDroiteRef} position={[0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#e0e0e0"
                                map={handleRightPaintedTexture}
                                transparent={true}
                                alphaTest={0.5}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                    {/* Sketch handle overlay (front) */}
                    <mesh position={[0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#e0e0e0"
                            ref={materiauPoigneeDroiteRef}
                            map={handleRightTexture}
                            transparent={true}
                            alphaTest={0.5}
                            depthWrite={false}
                            uProgress={0.0}
                        />
                    </mesh>
                </group>
            </group>

            {/* Warm lighting - WYLACZONE */}
            {/* <pointLight
                position={[0, doorBottomY + doorHeight + 1, 1]}
                intensity={0.8}
                color="#fff8e8"
                distance={10}
            /> */}
            {/* BALKA - texture seule, sans avatar ni fenêtre */}
            <mesh position={[1.6, -0.5, 2.9]}>
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={windowSketchTexture}
                    transparent={true}
                />
            </mesh>

            {/* ANIMATED BUG (Right Side) */}
            {!isBugClicked && (
                <mesh
                    ref={insecteRef}
                    position={[2.5, floorY + 2.8, 0.16]}
                    onClick={handleBugClick}
                    onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
                    onPointerLeave={() => { document.body.style.cursor = "auto"; }}
                >
                    <planeGeometry args={[0.4, 0.4]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={bugTexture}
                        transparent={true}
                        alphaTest={0.01}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* INK SPLASH - always mounted to preload texture/shader */}
            <mesh
                ref={inkSplashRef}
                position={[2.5, floorY + 2.8, 0.17]}
                scale={[0, 0, 0]}
            // Removed conditional 'visible' to ensure GPU upload
            >
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={inkSplashTexture}
                    transparent={true}
                    alphaTest={0.01}
                    depthWrite={false}
                />
            </mesh>

            {/* BUG FIXED! Text - always mounted to preload font */}
            <Text
                ref={bugFixedTextRef}
                position={[2.5, floorY + 2.8, 0.35]} // Default pos, updated on click
                fontSize={0.25} // Increased size slightly for CabinSketch
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Bold.ttf"
                outlineWidth={0.015}
                outlineColor="#ffffff"
                clipRect={[-1, -0.5, -1 + (clipProgress * 2.5), 0.5]}
            >
                BUG FIXED!
            </Text>





            {/* TREE & MOUSE (Left Side) */}
            <group position={[-2.9, floorY + 2.7, 1]}>
                {/* Tree */}
                
                {/* Mouse Hanging - Pivot Group for swinging */}
                {/* Pivot is moved UP by ~2.0 to be near the top of the string/branch */}
                {/* Original Mesh Y was 0.02. New Pivot Y is 0.02 + 2.0 = 2.02 */}
                {/* Mouse Hanging - Pivot Group for swinging */}
                {/* Pivot: 421, 597px. Offset relative to center: X=0.351, Y=-0.456 */}
                {/* Group Position shift: (-0.01, 0.02) + (0.351, -0.456) = (0.341, -0.436) */}
                <group ref={mousePivotRef} position={[0.341, 0.02 - 0.456, 0]}>
                    {/* Mesh moves opposite to pivot offset to keep visual position */}
                    <mesh position={[-0.351, 0.456, 0]}>
                        <planeGeometry args={[6, 8]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={mouseTexture}
                            transparent={true}
                            alphaTest={0.01}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            </group>

            {/* CAT SKETCH (Front Facing) */}
            <group position={[-3.75, floorY + 0.9, 2.25]} ref={groupeChatRef}>
                {/* Body */}
                <mesh>
                    <planeGeometry args={[2.5, 2.5]} />
                    <meshBasicMaterial color="#e9e6e6"
                        map={catFrontBodyTexture}
                        transparent={true}
                        alphaTest={0.01}
                        depthWrite={false}
                    />
                </mesh>

                {/* Left Pupil */}
                <mesh
                    ref={pupilleGaucheRef}
                    position={[-0.063, 0.27, -0.02]} // Behind cat
                >
                    <circleGeometry args={[0.020, 32]} />
                    <meshBasicMaterial color="black" />
                    {/* Oval Scale */}
                    <group scale={[0.8, 1.2, 1]} />
                </mesh>

                {/* Right Pupil */}
                <mesh
                    ref={pupilleDroiteRef}
                    position={[0.0615, 0.27, -0.02]} // Behind cat
                >
                    <circleGeometry args={[0.020, 32]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </group>

        </group>
    );
};

export default EntranceDoors;
