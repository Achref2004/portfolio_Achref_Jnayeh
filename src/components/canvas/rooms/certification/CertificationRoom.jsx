import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import NuagesGalerie from './NuagesGalerie';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';

// ============================================
// ⚙️ AUDIO SETTINGS
// ============================================
export const AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 1.5
};

// ============================================
// 📜 CERTIFICATIONS DATA
// ============================================
const CERTIFICATES = [
    {
        id: 'ccna',
        title: 'Cisco CCNA',
        subtitle: 'Networking & Routing',
        image: '/textures/gallery/ccna.png',
        detailImage: '/textures/gallery/ccnac.png',
    },
    {
        id: 'jss',
        title: 'JavaScript Specialist',
        subtitle: 'Frontend & Backend',
        image: '/textures/gallery/jss.png',
        detailImage: '/textures/gallery/jsc.png',
    },
    {
        id: 'ethic',
        title: 'Ethical Hacking',
        subtitle: 'Cybersecurity & Defense',
        image: '/textures/gallery/ethicc.png',
        detailImage: '/textures/gallery/ethiccc.png',
    },
    {
        id: 'bpii',
        title: 'BPI France',
        subtitle: 'Innovation & Tech',
        image: '/textures/gallery/bpii.png',
        detailImage: '/textures/gallery/bpic.png',
    },
    {
        id: 'dll',
        title: 'Deep Learning',
        subtitle: 'Neural Networks & AI',
        image: '/textures/gallery/dll.png',
    },
    {
        id: 'ibmm',
        title: 'IBM Professional',
        subtitle: 'Cloud & AI Solutions',
        image: '/textures/gallery/ibmm.png',
    },
];

// Compact and well-proportioned dimensions (no bulky frames)
const ITEM_WIDTH = 1.35;
const ITEM_HEIGHT = 0.92;
const ITEM_GAP = 1.75;

const RIGHT_CROP_AMOUNT = 0.2;

const CertificationRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { openOverlay, isTeleporting } = useScene();
    const { showTutorial, unlockAchievement, hidePopup } = useAchievements();
    const groupRef = useRef();

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Setup Paint Transition
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial();
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Track if user teleported into this room 
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

    // Signal ready to parent
    const hasSignaledReady = useRef(false);
    const frameCount = useRef(0);
    const FRAMES_TO_WAIT = 5;

    useFrame(() => {
        updateRoomOrigin(groupRef);

        if (hasSignaledReady.current) return;
        frameCount.current++;
        if (frameCount.current >= FRAMES_TO_WAIT) {
            hasSignaledReady.current = true;
            onReady?.();

            setTimeout(() => {
                if (!isWarmup) showTutorial('gallery_inspect');
            }, 2000);
        }
    });

    // --- CAROUSEL NAVIGATION STATE ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const trackGroupRef = useRef();
    const currentX = useRef(0);
    const targetX = useRef(0);

    const goToIndex = useCallback((newIndex) => {
        const clamped = Math.max(0, Math.min(CERTIFICATES.length - 1, newIndex));
        setCurrentIndex(clamped);
        targetX.current = -clamped * ITEM_GAP;
        unlockAchievement?.('gallery_inspect');
    }, [unlockAchievement]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation?.();
        goToIndex(currentIndex - 1);
    }, [currentIndex, goToIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation?.();
        goToIndex(currentIndex + 1);
    }, [currentIndex, goToIndex]);

    // Smooth lerp of carousel track
    useFrame((_, delta) => {
        if (trackGroupRef.current) {
            currentX.current = THREE.MathUtils.lerp(currentX.current, targetX.current, Math.min(1, delta * 9));
            trackGroupRef.current.position.x = currentX.current;
        }
    });

    // --- TEXTURES ---
    const certTextureUrls = useMemo(() => CERTIFICATES.map(c => c.image), []);
    const certTextures = useTexture(certTextureUrls);
    const titleTexture = useTexture('/textures/gallery/cert.png');
    const floorTexture = useTexture('/textures/gallery/floor.webp');
    const housesTexture = useTexture('/textures/gallery/plage.png');

    // Ensure correct sRGB color space for textures
    useEffect(() => {
        certTextures.forEach(tex => {
            if (tex) {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
            }
        });
    }, [certTextures]);

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
            color: '#e0e0e0',
            side: THREE.DoubleSide
        });
        floorMat.onBeforeCompile = onBeforeCompile;
        floorMat.transparent = true;
        floorMat.needsUpdate = true;

        const thresholdMat = new THREE.MeshBasicMaterial({
            color: '#e0e0e0',
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

        return {
            floor: floorMat,
            threshold: thresholdMat
        };
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

    const handleOpenImage = (cert) => {
        unlockAchievement?.('gallery_inspect');
        openOverlay?.({
            id: cert.id,
            title: cert.title,
            layout: 'image_viewer',
            image: cert.detailImage || cert.image,
            platformConfig: { label: cert.subtitle || 'Certification' },
        });
    };

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
                    <lineBasicMaterial color="#999999" onBeforeCompile={onBeforeCompile} transparent={true} needsUpdate={true} />
                </line>

                {/* Threshold */}
                <mesh position={[0, 0.01, -3.9]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[15, 0.15]} />
                    <primitive object={materials.threshold} />
                </mesh>

                {/* === PAGE TITLE === */}
                <mesh position={[0, 3.4, -3.5]}>
                    <planeGeometry args={[2.8, 1]} />
                    <meshBasicMaterial
                        map={titleTexture}
                        transparent={true}
                        alphaTest={0.05}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>

                {/* ======================================================= */}
                {/* 🖼️  CLEAN SIDE-BY-SIDE IMAGES (ELEVATED HEIGHT)         */}
                {/* ======================================================= */}
                <group position={[0, 1.65, -3.6]}>
                    {/* Moving Track */}
                    <group ref={trackGroupRef}>
                        {CERTIFICATES.map((cert, index) => (
                            <CleanCertificateImage
                                key={cert.id}
                                cert={cert}
                                texture={certTextures[index]}
                                position={[index * ITEM_GAP, 0, 0]}
                                isSelected={currentIndex === index}
                                onClick={() => {
                                    if (currentIndex !== index) {
                                        goToIndex(index);
                                    } else {
                                        handleOpenImage(cert);
                                    }
                                }}
                            />
                        ))}
                    </group>

                    {/* Left Navigation Arrow (At outer left extremity) */}
                    <NavArrowButton
                        direction="left"
                        position={[-3.8, 0, 0.15]}
                        disabled={currentIndex === 0}
                        onClick={handlePrev}
                    />

                    {/* Right Navigation Arrow (At outer right extremity) */}
                    <NavArrowButton
                        direction="right"
                        position={[3.8, 0, 0.15]}
                        disabled={currentIndex === CERTIFICATES.length - 1}
                        onClick={handleNext}
                    />

                    {/* Pagination Indicators / Dots */}
                    <group position={[0, -0.9, 0.05]}>
                        {CERTIFICATES.map((_, idx) => (
                            <PaginationDot
                                key={idx}
                                index={idx}
                                isActive={currentIndex === idx}
                                total={CERTIFICATES.length}
                                onClick={() => goToIndex(idx)}
                            />
                        ))}
                    </group>
                </group>

                {/* === SCENERY LAYERS === */}
                {/* Houses - center */}
                <mesh position={[0, 0, -6]} scale={[1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial
                        color="#e0e0e0"
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>

                {/* Houses - left side */}
                <mesh position={[-15, -1, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial
                        color="#dadada"
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>

                {/* Houses - right side */}
                <RightSideHouses
                    texture={housesTexture}
                    baseWidth={15}
                    baseHeight={15 / 2.357}
                    cropAmount={RIGHT_CROP_AMOUNT}
                    onBeforeCompile={onBeforeCompile}
                />

                {/* Clouds scattered above */}
                <NuagesGalerie count={65} seed={123} />

                {/* Skybox/Environment */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#ffffff" side={THREE.BackSide} onBeforeCompile={onBeforeCompile} />
                </mesh>
            </group>
        </group>
    );
};

// ============================================================
// 🖼️  CleanCertificateImage Component (NO heavy frames, clean transparent PNG)
// ============================================================
const CleanCertificateImage = ({ cert, texture, position, isSelected, onClick }) => {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    // Cursor management
    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered]);

    // Smooth hover / selection animation
    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const targetScale = isSelected ? (hovered ? 1.12 : 1.05) : (hovered ? 1.04 : 0.92);
        const targetZ = isSelected ? 0.2 : (hovered ? 0.08 : 0);

        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 8);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 8);
    });

    return (
        <group ref={meshRef} position={position}>
            {/* Pure Clean Certificate Image (Transparent, No background plate, No frame) */}
            <mesh
                position={[0, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={() => setHovered(false)}
            >
                <planeGeometry args={[ITEM_WIDTH, ITEM_HEIGHT]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={true}
                    alphaTest={0.02}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Subtle Zoom indicator on hover */}
            {isSelected && hovered && (
                <Text
                    position={[0, ITEM_HEIGHT / 2 + 0.1, 0.02]}
                    fontSize={0.09}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="bottom"
                >
                    🔍 Consulter
                </Text>
            )}
        </group>
    );
};

// ============================================================
// 🔘  3D Navigation Arrow Button (Left / Right - Sleek & Compact)
// ============================================================
const NavArrowButton = ({ direction, position, disabled, onClick }) => {
    const btnRef = useRef();
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (hovered && !disabled) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered, disabled]);

    useFrame((_, delta) => {
        if (!btnRef.current) return;
        const targetScale = disabled ? 0.7 : (hovered ? 1.18 : 1.0);
        btnRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 12);
    });

    const isLeft = direction === 'left';

    return (
        <group
            ref={btnRef}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick?.(e);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (!disabled) setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            {/* Soft Shadow behind */}
            <mesh position={[0.4, -0.01, -0.01]}>
                <circleGeometry args={[0.15, 32]} />
                <meshBasicMaterial
                    color="#000000ff"
                    transparent
                    opacity={disabled ? 0.04 : (hovered ? 0.25 : 0.12)}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Main Outer Outline / Border */}
            <mesh position={[0, 0, 0]}>
                <circleGeometry args={[0.135, 32]} />
                <meshBasicMaterial
                    color={disabled ? '#cbd5e1' : (hovered ? '#195ff7' : '#334155')}
                    transparent
                    opacity={disabled ? 0.35 : 0.95}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Inner Disc (Inverts to Blue on hover) */}
            <mesh position={[0, 0, 0.003]}>
                <circleGeometry args={[0.12, 32]} />
                <meshBasicMaterial
                    color={disabled ? '#f8fafc' : (hovered ? '#195ff7' : '#ffffff')}
                    transparent
                    opacity={disabled ? 0.5 : 1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Clean Chevron / Arrow */}
            <Text
                position={[isLeft ? -0.005 : 0.005, 0.005, 0.01]}
                fontSize={0.13}
                color={disabled ? '#94a3b8' : (hovered ? '#04c9cc' : '#195ff7')}
                anchorX="center"
                anchorY="middle"
                fontFamily="'Cabin Sketch', sans-serif"
            >
                {isLeft ? '←' : '→'}
            </Text>
        </group>
    );
};

// ============================================================
// ⚪  Pagination Dot Indicator
// ============================================================
const PaginationDot = ({ index, isActive, total, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const totalW = (total - 1) * 0.25;
    const x = -totalW / 2 + index * 0.25;

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = 'pointer';
        }
    }, [hovered]);

    return (
        <group
            position={[x, 0, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh position={[0, 0, 0]}>
                <circleGeometry args={[isActive ? 0.065 : (hovered ? 0.055 : 0.04), 16]} />
                <meshBasicMaterial
                    color={isActive ? '#195ff7ff' : (hovered ? '#60a5fa' : '#cbd5e1')}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};

// ============================================================
// 🏠  RightSideHouses Component
// ============================================================
const RightSideHouses = ({ texture, baseWidth, baseHeight, cropAmount, onBeforeCompile }) => {
    const croppedTexture = useMemo(() => {
        if (!texture) return null;
        const t = texture.clone();
        t.offset.x = cropAmount;
        t.repeat.x = 1 - cropAmount;
        t.needsUpdate = true;
        return t;
    }, [texture, cropAmount]);

    const newWidth = baseWidth * (1 - cropAmount);
    const newX = 7.5 + (newWidth / 2);

    return (
        <mesh position={[newX, -1, -9]} scale={[-1, 1, 1]}>
            <planeGeometry args={[newWidth, baseHeight]} />
            <meshBasicMaterial
                color="#e0e0e0"
                map={croppedTexture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
                onBeforeCompile={onBeforeCompile}
            />
        </mesh>
    );
};

export default CertificationRoom;
