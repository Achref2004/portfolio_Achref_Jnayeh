import { useRef, useState, useMemo, useEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';

export const AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 1.5
};

export const GALLERY_INTERACTION_AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 2
};

// 3 flags configuration - spaced out for larger flag sizes
const FLAGS_DATA = [
    {
        id: 'tunis',
        textureUrl: '/textures/gallery/tunis.png',
        title: 'Arabe',
        text: ".العربية هي لغتي الأم، أتحدثها بطلاقة وأعتز بفصاحتها وثراء مفرداتها",
        color: '#d62828',
        position: [-1.4, 1.5, -3.0],
    },
    {
        id: 'france',
        textureUrl: '/textures/gallery/france.png',
        title: 'Français',
        text: "Le français fait partie de mon quotidien. Je le maîtrise avec aisance, aussi bien dans les échanges professionnels que personnels",
        color: '#003049',
        position: [0, 1.5, -3.0],
    },
    {
        id: 'britsh',
        textureUrl: '/textures/gallery/britsh.png',
        title: 'English',
        text: "English is an essential part of my professional journey. I communicate confidently in English in technical and professional environments.",
        color: '#2a9d73ff',
        position: [1.5, 1.46, -3.0],
    },
];

// Single Flag Item component (Larger size + High sharpness filter)
const FlagItem = memo(({ flag, activeId, setActiveId, isTransitioning }) => {
    const texture = useTexture(flag.textureUrl);
    const isSelected = activeId === flag.id;
    const { gl } = useThree();

    // High texture clarity settings (anisotropy + linear filtering)
    useEffect(() => {
        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            if (gl && gl.capabilities) {
                texture.anisotropy = gl.capabilities.getMaxAnisotropy();
            }
            texture.needsUpdate = true;
        }
    }, [texture, gl]);

    const handleClick = (e) => {
        e.stopPropagation();
        setActiveId(prev => prev === flag.id ? null : flag.id);
    };

    // Augmented Flag Size (Width: 2.3, Height: 1.5)
    const flagW = 2.3;
    const flagH = 1.5;

    return (
        <group position={flag.position}>
            {/* Flag Mesh - Larger & Brighter */}
            <mesh
                onPointerDown={handleClick}
                onPointerOver={(e) => {
                    if (!isTransitioning) {
                        e.stopPropagation();
                        document.body.style.cursor = 'pointer';
                    }
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'auto';
                }}
            >
                <planeGeometry args={[flagW, flagH]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    alphaTest={0.05}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                    color="#ffffff"
                />
            </mesh>

            {/* Flag Title */}
            <Text
                position={[0, -flagH / 2 - 0.25, 0.01]}
                fontSize={0.2}
                color="#07128d"
                anchorX="center"
                anchorY="top"
                font="/fonts/cabin-sketch-regular.ttf"
            >
                {flag.title}
            </Text>

            {/* Speech Bubble (Positioned appropriately for larger flag) */}
            {isSelected && (
                <Html
                    position={[0, flagH / 2 + 0.65, 0.1]}
                    center
                    zIndexRange={[100, 0]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            width: '220px',
                            padding: '12px 16px',
                            border: `3px solid ${flag.color}`,
                            borderRadius: '12px',
                            background: '#ffffff',
                            color: '#1d3557',
                            fontFamily: 'Cabin Sketch, sans-serif',
                            fontSize: '15px',
                            lineHeight: '1.35',
                            textAlign: 'center',
                            direction: flag.id === 'tunis' ? 'rtl' : 'ltr',
                            boxSizing: 'border-box',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)'
                        }}
                    >
                        <div>{flag.text}</div>
                        <small style={{ display: 'block', marginTop: '8px', color: flag.color }}>
                            (cliquer pour fermer)
                        </small>
                    </div>
                </Html>
            )}
        </group>
    );
});

// Main Language Room Component
const GalleryRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { isTeleporting } = useScene();
    const { scene } = useThree();
    const groupRef = useRef();
    const [activeId, setActiveId] = useState(null);

    // Setup Paint Transition
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const wasTeleportedRef = useRef(false);

    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                uniformsData.uPaintProgress.value = 1.0;
                setIsTransitioning(false);
            } else {
                setIsTransitioning(true);
                resetPaint();
                animatePaint(0.2, 2.5);
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 2700);
            }
        } else {
            uniformsData.uPaintProgress.value = 1.0;
        }
    }, [showRoom, isWarmup, isTeleporting]);

    useEffect(() => {
        onReady?.();
    }, [onReady]);

    const floorTexture = useTexture('/textures/gallery/floor.webp');
    const backgroundTexture = useTexture('/textures/gallery/arrd.png');

    useEffect(() => {
        if (backgroundTexture) {
            backgroundTexture.colorSpace = THREE.SRGBColorSpace;
            backgroundTexture.wrapT = THREE.ClampToEdgeWrapping;
            backgroundTexture.offset.y = -0.07;
            backgroundTexture.needsUpdate = true;
        }
    }, [backgroundTexture]);

    useEffect(() => {
        if (!showRoom || isWarmup) return;

        scene.background = backgroundTexture;

        return () => {
            if (scene.background === backgroundTexture) {
                scene.background = null;
            }
        };
    }, [backgroundTexture, isWarmup, scene, showRoom]);

    useEffect(() => {
        if (floorTexture) {
            floorTexture.wrapS = THREE.MirroredRepeatWrapping;
            floorTexture.wrapT = THREE.MirroredRepeatWrapping;
            floorTexture.repeat.set(0.5, 0.5 * 1.835);
            floorTexture.needsUpdate = true;
        }
    }, [floorTexture]);

    const materials = useMemo(() => {
        const floorMat = new THREE.MeshBasicMaterial({
            map: floorTexture,
            color: '#f6ecdd',
            side: THREE.DoubleSide
        });
        floorMat.onBeforeCompile = onBeforeCompile;
        floorMat.transparent = true;
        floorMat.needsUpdate = true;

        const thresholdMat = new THREE.MeshBasicMaterial({
            color: '#ffeadd',
            map: (() => {
                const t = new THREE.TextureLoader().load('/textures/corridor/texturadoprogow.webp');
                t.colorSpace = THREE.SRGBColorSpace;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                t.repeat.set(15 / 2.524, 1);
                return t;
            })(),
            side: THREE.DoubleSide
        });
        thresholdMat.onBeforeCompile = onBeforeCompile;
        thresholdMat.transparent = true;
        thresholdMat.needsUpdate = true;

        return { floor: floorMat, threshold: thresholdMat };
    }, [floorTexture, onBeforeCompile]);

    const floorShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-1.1, -2.0);
        shape.lineTo(1.1, -2.0);
        shape.lineTo(7.5, 4);
        shape.lineTo(-7.5, 4);
        shape.lineTo(-1.1, -2.0);
        return shape;
    }, []);

    return (
        <group ref={groupRef}>
            <group position={[0, -0.7, -2]}>
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <shapeGeometry args={[floorShape]} />
                    <primitive object={materials.floor} />
                </mesh>

                {/* Floor Outline */}
                <line rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <bufferGeometry>
                        <float32BufferAttribute
                            attach="attributes-position"
                            count={2}
                            array={new Float32Array([7.5, 4, 0, -7.5, 4, 0])}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#f4b17f" onBeforeCompile={onBeforeCompile} transparent={true} needsUpdate={true} />
                </line>

                {/* Threshold */}
                <mesh position={[0, 0.01, -3.9]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[15, 0.15]} />
                    <primitive object={materials.threshold} />
                </mesh>

                {/* Page Title */}
                <Text
                    position={[0, 3.1, -2.8]}
                    fontSize={0.4}
                    color="#030d7f"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/cabin-sketch-regular.ttf"
                >
                    Mes Langues
                </Text>

                {/* 3 Flags: tunis.png, france.png, britsh.png */}
                {FLAGS_DATA.map((flag) => (
                    <FlagItem
                        key={flag.id}
                        flag={flag}
                        activeId={activeId}
                        setActiveId={setActiveId}
                        isTransitioning={isTransitioning}
                    />
                ))}

            </group>
        </group>
    );
};

export default GalleryRoom;
