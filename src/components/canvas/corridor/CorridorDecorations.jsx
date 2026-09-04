import { useMemo, useState, useRef, useEffect } from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { isTouchDevice } from '../../../utils/deviceDetect';
/**
 * CorridorDecorations - déco du couloir.
 * 
 * Plans plats simples avec textures - style dessin 2D dans un monde 3D.
 * 
 * Couloir (par segment, 80 unités):
 *   Portes: relZ -18 (gauche), -32 (droite), -48 (gauche), -62 (droite)
 *   corridorWidth: ~3.5 par côté
 *   corridorHeight: 3.5
 *   Zones safe pour déco: -5 à -15, -20 à -30, -34 à -46, -50 à -60, -64 à -75
 */

// Variables globales pour useFrame, pour éviter l'allocation à chaque frame et éviter les lags GC
const tempPos = new THREE.Vector3();
const tempRot = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempCamDir = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempQuat = new THREE.Quaternion();


const CABIN_SKETCH_URL = '/fonts/cabin-sketch-regular.ttf';

const PictureContent = ({ imagePath, imagePaintedPath, width, height, isPainted }) => {
    const texture = useTexture(imagePath);
    // Ne rien render si y a pas de painted path, mais on appelle toujours le hook pour respecter les rules des hooks
    const paintedTexture = useTexture(imagePaintedPath || imagePath);

    const materialRef = useRef();

    useEffect(() => {
        if (!materialRef.current || !imagePaintedPath) return;

        if (isPainted) {
            gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
    }, [isPainted, imagePaintedPath]);

    return (
        <group position={[0, 0, 0.01]}> {/* Lekko przed ramką */}
            {imagePaintedPath && (
                <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={paintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                {imagePaintedPath ? (
                    <revealMaterial color="#e0e0e0"
                        ref={materialRef}
                        map={texture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                        uProgress={0.0}
                    />
                ) : (
                    <meshBasicMaterial color="#e0e0e0"
                        map={texture}
                        transparent={true}
                        alphaTest={0.1} // CLÉ: corrige la transparence (découpe le fond)
                        side={THREE.DoubleSide}
                        roughness={0.5}
                    />
                )}
            </mesh>
        </group>
    );
};

const InspectableFrame = ({ frame, wallX, frameTexture, framePaintedTexture, CABIN_SKETCH_URL, setCameraOverride }) => {
    const { camera, viewport } = useThree();
    const groupRef = useRef();
    const frameMaterialRef = useRef();
    const framePaintedRef = useRef();
    const compileFramesRef = useRef(0);
    const hideDelayRef = useRef();

    // On garde la position/origine et rotation originelle sur le mur
    const originalPos = useMemo(() => new THREE.Vector3(
        frame.side === 'left' ? -wallX + (frame.offsetFromWall || 0) : wallX - (frame.offsetFromWall || 0),
        frame.y,
        frame.z
    ), [frame, wallX]);

    const originalRot = useMemo(() => new THREE.Euler(
        0, frame.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0
    ), [frame.side]);

    const [isHovered, setIsHovered] = useState(false);
    const [isInspected, setIsInspected] = useState(false);

    // On check si c'est device tactile (phone/tablette) pour couper le hover et booster perf
    const isTouch = useMemo(() => isTouchDevice(), []);
    // On garde aussi l'ancien mécanisme pour disable inspected sur écrans ultra-narrow
    const isMobile = viewport.width < 5 || viewport.aspect < 0.8 || isTouch;

    // Quand le composant disparaît, on coupe l'override juste in case
    useEffect(() => {
        return () => {
            if (isInspected) {
                if (setCameraOverride) setCameraOverride(false);
                window.dispatchEvent(new CustomEvent('inspectChange', { detail: false }));
            }
        };
    }, [isInspected, setCameraOverride]);

    useEffect(() => {
        if (isHovered && !isMobile) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
    }, [isHovered, isMobile]);

    useEffect(() => {
        if (!frameMaterialRef.current) return;

        const shouldBePainted = isHovered || isInspected;

        if (shouldBePainted) {
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (framePaintedRef.current) framePaintedRef.current.visible = true;

            gsap.to(frameMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(frameMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });

            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (framePaintedRef.current) framePaintedRef.current.visible = false;
            });
        }

        return () => {
            if (hideDelayRef.current) hideDelayRef.current.kill();
        };
    }, [isHovered, isInspected]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        if (compileFramesRef.current < 2) {
            compileFramesRef.current++;
            if (compileFramesRef.current === 2) {
                if (!isHovered && !isInspected && framePaintedRef.current) {
                    framePaintedRef.current.visible = false;
                }
            }
        }

        if (isInspected) {
            // Position devant la cam (plus proche)
            camera.getWorldDirection(tempCamDir);

            // On calcule la distance responsive (fluid)
            // Si l'aspect ratio est petit (écrans étroits, laptop ~1.3), on recule l'image
            // Si l'aspect est large (ultrawide, 16:9 ~ 1.77), on approche l'image
            // clamp(1.5, 2.8)
            const baseDistance = 1.3;
            // Plus l'aspect est petit (écran étroit), plus la distance augmente
            const aspectOffset = Math.max(0, 1.8 - viewport.aspect) * 1.5;
            const distance = Math.min(2.8, Math.max(1.5, baseDistance + aspectOffset));

            // Point juste devant la cam (ajusté dynamiquement - plus la valeur, plus c'est loin)
            tempPos.copy(camera.position).add(tempCamDir.multiplyScalar(distance));

            // Rotation qui oriente l'image direct vers la cam
            tempRot.copy(camera.quaternion);

            // Effet carte 3D basé sur la souris
            const tiltX = -state.pointer.y * 0.3;
            const tiltY = state.pointer.x * 0.3;
            tempEuler.set(tiltX, tiltY, 0);
            tempQuat.setFromEuler(tempEuler);

            tempRot.multiply(tempQuat);

            // On scale un peu l'image pour plus de détail
            tempScale.set(1.2, 1.2, 1.2);
        } else {
            // Retour sur le mur
            tempPos.copy(originalPos);
            tempRot.setFromEuler(originalRot);
            tempScale.set(1, 1, 1);
        }

        // Interpolation smooth (lerp/slerp) chaque render
        const factor = delta * 6;
        groupRef.current.position.lerp(tempPos, factor);
        groupRef.current.quaternion.slerp(tempRot, factor);
        groupRef.current.scale.lerp(tempScale, factor);
    });

    return (
        <group
            ref={groupRef}
            position={originalPos}
            rotation={originalRot}
        >
            {/* HITBOX INVISIBLE pour capter les événements pointer smooth et éviter que le raycaster saute entre les meshes */}
            <mesh
                position={[0, 0, 0.05]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isMobile) return; // Coupe totale sur mobile
                    setIsInspected((prev) => {
                        const next = !prev;
                        if (setCameraOverride) setCameraOverride(next); // Bloquer/débloquer le move de la cam
                        window.dispatchEvent(new CustomEvent('inspectChange', { detail: next }));
                        return next;
                    });
                    setIsHovered(false);
                }}
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    if (!isInspected && !isMobile) setIsHovered(true);
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                }}
            >
                <planeGeometry args={[frame.width, frame.height]} />
                <meshBasicMaterial color="#e0e0e0" transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* CADRE PAINTED (derrière sketch) */}
            {!isTouch && (
                <mesh ref={framePaintedRef} position={[0, 0, -0.001]} scale={[0.98, 0.98, 1]}>
                    <planeGeometry args={[frame.width, frame.height]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={framePaintedTexture}
                        transparent={true}
                        alphaTest={0.5}
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                </mesh>
            )}

            {/* CADRE SKETCH OVERLAY (devant) */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[frame.width, frame.height]} />
                <revealMaterial color="#e0e0e0"
                    ref={frameMaterialRef}
                    map={frameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.9}
                    uProgress={0.0}
                />
            </mesh>

            {/* IMAGE À L'INTÉRIEUR */}
            {frame.image && (
                <PictureContent
                    imagePath={frame.image}
                    imagePaintedPath={!isTouch ? frame.imagePainted : null}
                    width={frame.imageWidth || frame.width * 0.7}
                    height={frame.imageHeight || frame.height * 0.7}
                    isPainted={isHovered || isInspected}
                />
            )}

            {/* SIGNATURE */}
            {frame.signature && (
                <Text
                    position={[
                        frame.signatureX !== undefined ? frame.signatureX : (frame.width / 2 - 0.1),
                        frame.signatureY !== undefined ? frame.signatureY : (-frame.height / 2 + 0.15),
                        0.02
                    ]}
                    fontSize={frame.signatureSize || 0.12}
                    font={CABIN_SKETCH_URL}
                    color={frame.signatureColor || "#333333"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {frame.signature}
                </Text>
            )}
        </group>
    );
};

const CorridorDecorations = ({ segmentLength, zOffset, corridorWidth = 4, corridorHeight = 3.5, zClip = 100000, setCameraOverride }) => {

    const wallX = corridorWidth / 2 - 0.01;
    const floorY = -corridorHeight / 2;
    const ceilingY = corridorHeight / 2;

    // =============================================
    // TEXTURES DÉCO
    // =============================================
    const frameTexture = useTexture('/textures/corridor/cadre.png');
    const framePaintedTexture = useTexture('/textures/corridor/cadre_colore.png');
    const standingFrameTexture = useTexture('/textures/corridor/kwtro.png');
    const treeTexture = useTexture('/textures/corridor/zitouna.png');
    const grateTexture = useTexture('/textures/corridor/kratkawentylacyjna.webp');
    const flowerTexture = useTexture('/textures/corridor/kwiatekwdoniczce.webp');
    const cvUrl = '/textures/corridor/Cv_Achref_Jnayah.pdf';
    const ideaTexture = useTexture('/textures/corridor/decorations/cv.png');
    const cv1Texture = useTexture('/textures/corridor/decorations/cv-1.png');

    // --- Ceiling Lights (points de lumière) ---
    // Textures des lampes
    const lampGrilleTexture = useTexture('/textures/corridor/kratanalampy.webp');
    // lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.RepeatWrapping; 
    // lampGrilleTexture.repeat.set(1, 1);

    const lampSideTexture = useTexture('/textures/corridor/bokilampy.webp');
    lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.RepeatWrapping;
    // Ajust du UV pour le côté long
    lampSideTexture.repeat.set(1, 1);

    const lights = useMemo(() => {
        const items = [];
        // ===== RÉGLAGE DES LUMIÈRES =====
        const LIGHT_SPACING = 15;      // Espace entre les lampes
        const LIGHT_START_OFFSET = -5;  // Start avec marge depuis le début (il y a les portes du segment précédent)

        const startZ = zOffset + LIGHT_START_OFFSET;
        const endZ = zOffset - segmentLength + 10; // Marge avant la fin (SegmentDoors est à -75)

        for (let z = startZ; z > endZ; z -= LIGHT_SPACING) {
            items.push({ z });
        }
        return items;
    }, [segmentLength, zOffset]);

    // =============================================
    // CADRES PHOTO (PICTURE FRAMES)
    // =============================================
    // Planes plats sur les murs avec texture de cadre.
    // Dans le cadre on peut mettre un poster/une image après.
    //
    // CONFIGS POUR AJUSTER À LA MAIN:
    // - z: position Z (sur l'axe couloir), calculée comme zOffset - valeur
    // - side: 'left' ou 'right'
    // - width/height: taille du cadre
    // - y: position Y (hauteur sur le mur, 0 = centre)
    const frames = useMemo(() => [
        {
            z: zOffset - 10,         // Entre le départ et Gallery (relZ -5 à -15)
            side: 'right',
            width: 2.5,              // Largeur du cadre
            height: 2.5 / 1.785,     // Ratio legacy 3200x1792
            y: 0.3,                  // Hauteur sur le mur
            id: 'frame-1',
            // Setup perso pour "rysuneknaobraz1.png"
            image: '/textures/corridor/tun.png',
            imageWidth: 2,
            imageHeight: 2.1,
            offsetFromWall: 0.1, // Décalage vers le centre du couloir (0.1 unité)
        },
        {
            z: zOffset - 10,         // Cadre supp dans la même zone
            side: 'left',
            width: 1.9,
            height: 1.9 / 1.785,
            y: 0.15,
            id: 'frame-1b',
            image: '/textures/corridor/deco.png',
            imageWidth: 0.95,
            imageHeight: 0.95,
            offsetFromWall: 0.12
        },
        {
            z: zOffset - 25,         // Entre Gallery et Studio (relZ -20 à -30)
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.2,
            id: 'frame-2',
            image: '/textures/corridor/deco1.png',
            imageWidth: 1.7,
            imageHeight: 1,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 17,         // Cadre supp dans la même zone
            side: 'right',
            width: 2.1,
            height: 2.1 / 1.785,
            y: -0.1,
            id: 'frame-2b',
            image: '/textures/corridor/horse.png',
            imageWidth: 1.7,
            imageHeight: 1,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 40,         // Entre Studio et About (relZ -34 à -46)
            side: 'right',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.25,
            id: 'frame-3',
            image: '/textures/corridor/child.png',
            imageWidth: 1.7,
            imageHeight: 1,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 43,         // Cadre supp dans la même zone
            side: 'left',
            width: 1.8,
            height: 1.8 / 1.785,
            y: 0.05,
            id: 'frame-3b',
            image: '/textures/corridor/nk.jpeg',
            imageWidth: 1.5,
            imageHeight: 0.7,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 55,         // Entre About et Connect (relZ -50 à -60)
            side: 'left',
            width: 2.5,
            height: 2.5 / 1.785,
            y: 0.35,
            id: 'frame-4',
            image: '/textures/corridor/watch.png',
            imageWidth: 1.7,
            imageHeight: 1,
            offsetFromWall: 0.1
        },
        {
            z: zOffset - 58,         // Cadre supp dans la même zone
            side: 'right',
            width: 2.2,
            height: 2.2 / 1.785,
            y: 0.25,
            id: 'frame-4b',
            image: '/textures/corridor/coli.png',
            imageWidth: 1.2,
            imageHeight: 1.0,
            offsetFromWall: 0.12
        },
        {
            z: zOffset - 20,         // Cadre extra dans le premier intervalle
            side: 'left',
            width: 1.7,
            height: 1.7 / 1.785,
            y: -0.05,
            id: 'frame-5',
            image: '/textures/corridor/woman.png',
            imageWidth: 0.9,
            imageHeight: 0.8,
            offsetFromWall: 0.11
        },
        {
            z: zOffset - 32,         // Cadre extra dans le deuxième intervalle
            side: 'right',
            width: 1.9,
            height: 1.9 / 1.785,
            y: 0.1,
            id: 'frame-6',
            image: '/textures/corridor/mos.jpg',
            imageWidth: 1.5,
            imageHeight: 0.7,
            offsetFromWall: 0.11
        },
        {
            z: zOffset - 47,         // Cadre extra dans le troisième intervalle
            side: 'left',
            width: 1.8,
            height: 1.8 / 1.785,
            y: 0.15,
            id: 'frame-7',
            image: '/textures/corridor/chevale.jpg',
            imageWidth: 1.47,
            imageHeight: 0.7,
            offsetFromWall: 0.12
        },
        {
            z: zOffset - 64,         // Cadre extra dans le quatrième intervalle
            side: 'right',
            width: 2.0,
            height: 2.0 / 1.785,
            y: 0.2,
            id: 'frame-8',
            image: '/textures/corridor/cate.png',
            imageWidth: 1.05,
            imageHeight: 0.95,
            offsetFromWall: 0.12
        },
    ], [zOffset]);

    // =============================================
    // BUREAU (TABLE)
    // =============================================
    const woodTexture = useTexture('/textures/corridor/texturadrewnadonozekbiurka.webp');
    const tableTopTexture = useTexture('/textures/corridor/gorastolika.webp');

    // Textures de l'armoire
    const cabinetFrontTexture = useTexture('/textures/corridor/sure.png');
    const cabinetRestTexture = useTexture('/textures/corridor/sure.png');

    // On clone la texture pour les pieds pour la tourner (le user dit qu'elle est horizontale mais doit être verticale)
    const legTexture = useMemo(() => {
        const tex = woodTexture.clone();
        tex.rotation = Math.PI / 2;
        tex.center.set(0.5, 0.5);
        return tex;
    }, [woodTexture]);

    // Config du bureau
    // Tourné à 90° et collé au mur gauche
    const tableConfig = useMemo(() => ({
        z: zOffset - 35,          // Position Z (zone entre Studio et About)
        width: 2.0,               // Largeur du plateau (après rotation: le long du mur)
        depth: 0.8,               // Profondeur du plateau (après rotation: du mur vers le couloir)
        height: 1.0,              // Hauteur totale
        legRadius: 0.08,          // Épaisseur des pieds
        topThickness: 0.08,       // Épaisseur du plateau
        x: -wallX + 0.42,         // Mur gauche (depth/2 + petit gap)
    }), [zOffset, wallX]);

    return (
        <group>
            {/* === LAMPES PLAFOND === */}
            {lights.filter(light => light.z <= zClip).map((light, i) => {
                // Config des textures dans la boucle (ou en dehors, mais on s'assure pour le wrapping)
                lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.ClampToEdgeWrapping;
                lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.ClampToEdgeWrapping; // Les côtés aussi clamp pour éviter les bandes

                return (
                    <group key={`light-${i}`} position={[0, ceilingY, light.z]}>
                        {/* Boîtier de la lampe - rectangle 3D allongé */}
                        {/* FORME PRINCIPALE */}
                        <mesh position={[0, -0.03, 0]}>
                            <boxGeometry args={[2.0, 0.06, 0.5]} />

                            {/* Petits côtés (Droite/Gauche) */}
                            <meshBasicMaterial attach="material-0" color="#e8e8e8" roughness={0.6} />
                            <meshBasicMaterial attach="material-1" color="#e8e8e8" roughness={0.6} />

                            {/* Dessus (caché) */}
                            <meshBasicMaterial attach="material-2" color="#d0d0d0" roughness={0.8} />

                            {/* Bas - texture grille
                                On utilise la transparence pour montrer la lumière interne.
                                La grille elle-même est sombre/métallique.
                            */}
                            <meshBasicMaterial
                                attach="material-3"
                                map={lampGrilleTexture}
                                transparent={true}
                                alphaTest={0.1}
                                side={THREE.DoubleSide}
                                color="#e0e0e0"
                                roughness={0.5}
                            />

                            {/* Côtés longs (Avant/Arrière) - Texture côté */}
                            <meshBasicMaterial color="#e0e0e0" attach="material-4" map={lampSideTexture} roughness={0.6} />
                            <meshBasicMaterial color="#e0e0e0" attach="material-5" map={lampSideTexture} roughness={0.6} />
                        </mesh>

                        {/* LUMIÈRE INTERNE (LIGHT PANEL)
                            Elle est plus HAUTE dans le boîtier pour que la grille dessous soit visible.
                        */}
                        <mesh
                            position={[0, -0.059, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[1.9, 0.4]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                toneMapped={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* VRAIE SOURCE DE LUMIÈRE (PointLight) - DÉSACTIVÉE */}
                        {/* <pointLight
                            position={[0, -1.5, 0]}
                            distance={6}
                            intensity={0.8}
                            color="#ffffff"
                            decay={2}
                        /> */}
                    </group>
                );
            })}

            {/* === BUREAU (tourné 90°, contre le mur gauche) === */}
            <group position={[tableConfig.x, floorY, tableConfig.z]} rotation={[0, Math.PI / 2, 0]}>
                {/* Pieds du bureau */}
                {[
                    [-tableConfig.width / 2 + 0.1, -tableConfig.depth / 2 + 0.1],
                    [tableConfig.width / 2 - 0.1, -tableConfig.depth / 2 + 0.1],
                    [-tableConfig.width / 2 + 0.1, tableConfig.depth / 2 - 0.1],
                    [tableConfig.width / 2 - 0.1, tableConfig.depth / 2 - 0.1],
                ].map((pos, i) => (
                    <mesh key={`leg-${i}`} position={[pos[0], tableConfig.height / 2, pos[1]]}>
                        <boxGeometry args={[tableConfig.legRadius * 2, tableConfig.height, tableConfig.legRadius * 2]} />
                        <meshBasicMaterial color="#e0e0e0" map={legTexture} roughness={0.8} />
                    </mesh>
                ))}

                {/* Plateau du bureau */}
                <mesh position={[0, tableConfig.height + tableConfig.topThickness / 2, 0]}>
                    <boxGeometry args={[tableConfig.width, tableConfig.topThickness, tableConfig.depth]} />
                    <meshBasicMaterial color="#e0e0e0" attach="material-0" map={woodTexture} /> {/* Droite */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-1" map={woodTexture} /> {/* Gauche */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-2" map={tableTopTexture} roughness={0.5} /> {/* Haut */}
                    <meshBasicMaterial attach="material-3" color="#e0e0e0" />   {/* Bas */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-4" map={woodTexture} /> {/* Avant */}
                    <meshBasicMaterial color="#e0e0e0" attach="material-5" map={woodTexture} /> {/* Arrière */}
                </mesh>

                {/* FLEUR SUR LE BUREAU */}
                <mesh
                    position={[0, tableConfig.height + tableConfig.topThickness + 0.2, 0]} // Sur le plateau
                    rotation={[0, -Math.PI / 4, 0]} // Petit tilt
                    onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = cvUrl;
                        link.download = 'Cv_Achref_Jnayah.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
                    onPointerLeave={() => { document.body.style.cursor = 'auto'; }}
                >
                    <planeGeometry args={[0.3, 0.3 / 0.758]} />
                    <meshBasicMaterial color="#eccb98"
                        map={cv1Texture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        roughness={0.8}
                    />
                </mesh>
            </group>

            {/* IMAGE SUR LE MUR DERRIERE LE BUREAU */}
            <mesh
                position={[-wallX + 0.01, tableConfig.height + tableConfig.topThickness / 2 + 0.02, tableConfig.z]}
                rotation={[0, Math.PI / 2, 0]}
            >
                <planeGeometry args={[1.2, 1.2 / 0.42]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={ideaTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>

            {/* =============================================
                CADRES PHOTO SUR LES MURS
                =============================================
                Chaque cadre est un plane plat avec la texture "ramka na zdjecie.png".
                Ils sont fixés aux murs en alternant (gauche/droite).
                
                Pour changer position/taille d'un cadre précis,
                modifie l'objet correspondant dans le tableau 'frames' au-dessus.
            */}
            {frames.map((frame) => (
                <InspectableFrame
                    key={frame.id}
                    frame={frame}
                    wallX={wallX}
                    frameTexture={frameTexture}
                    framePaintedTexture={framePaintedTexture}
                    CABIN_SKETCH_URL={CABIN_SKETCH_URL}
                    setCameraOverride={setCameraOverride}
                />
            ))}

            {/* === ARMOIRE (CABINET) === */}
            {/* Box simple en placeholder, en face des portes About (Left -48) -> donc armoire à droite -51 */}
            <mesh
                position={[wallX - 0.26, floorY + 0.5, zOffset - 36]}
            // X: wallX - (depth/2) - petit margin
            // Y: floorY + (height/2)
            // Z: zOffset - 51 (près des portes About)
            >
                {/* Dimensions: X=0.5 (profondeur depuis le mur), Y=1.0 (hauteur), Z=0.8 (largeur le long du mur) */}
                <boxGeometry args={[0.5, 1.0, 1.0 * 0.8]} />
                {/* 
                    Mats pour BoxGeometry:
                    0: Droite (+x) - côté mur
                    1: Gauche (-x) - côté couloir (FACE de l'armoire) -> szafkaprzod.png
                    2: Haut (+y) -> szafkaprzodgora.png
                    3: Bas (-y) -> szafkaprzodgora.png (comme demandé)
                    4: Avant (+z) -> szafkaprzodgora.png (côté)
                    5: Arrière (-z) -> szafkaprzodgora.png (côté)
                */}
                <meshBasicMaterial color="#e0e0e0" attach="material-0" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-1" map={cabinetFrontTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-2" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-3" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-4" map={cabinetRestTexture} />
                <meshBasicMaterial color="#e0e0e0" attach="material-5" map={cabinetRestTexture} />
            </mesh>

            {/* === CADRE DEBOUT SUR L'ARMOIRE (STANDING FRAME) === */}
            {/* Il est posé sur l'armoire: Y = floorY + 1.0 (hauteur de l'armoire) + moitié hauteur du cadre */}
            <mesh
                position={[wallX - 0.26, floorY + 1.0 + 0.2, zOffset - 36]}
                rotation={[0, -Math.PI / 2 + 0.2, 0]} // Petit tilt pour qu'elle soit pas parfaitement droite
            >
                <planeGeometry args={[0.3, 0.3 / 0.777]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={standingFrameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>


            {/* === ARBRE EN POT (POTTED TREE) === */}
            {/* Près des portes Contact (Right -62). On le place à -58, côté inverse (Left). */}
            <mesh
                position={[-wallX + 0.8, floorY + 1.5, zOffset - 58]} // Côté gauche
                rotation={[0, Math.PI / 4, 0]} // Tourné vers le couloir (depuis la gauche)
            >
                <planeGeometry args={[1.8, 1.8 / 0.602]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={treeTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>

            {/* === GRILLES DE VENTILATION (VENTILATION GRATES) === */}
            {/* On génère une grille sur le mur opposé pour chaque image */}
            {frames.map((frame, i) => {
                const isFrameLeft = frame.side === 'left';
                const grateSide = isFrameLeft ? 'right' : 'left';

                return (
                    <mesh
                        key={`grate-${i}`}
                        position={[
                            grateSide === 'left' ? -wallX + 0.01 : wallX - 0.01,
                            ceilingY - 0.6, // Hauteur, comme la première
                            frame.z // Même Z que l'image
                        ]}
                        rotation={[0, grateSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[0.8, 0.8 / 1.968]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={grateTexture}
                            transparent={true}
                            alphaTest={0.1}
                            side={THREE.DoubleSide}
                            roughness={0.8}
                        />
                    </mesh>
                );
            })}

        </group >
    );
};

export default CorridorDecorations;
