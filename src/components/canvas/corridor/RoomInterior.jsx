import { useMemo, memo, Suspense, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Eagerly import room components - textures are preloaded during the preloader phase
import MesProjetsRoom from '../rooms/MesProjets/MesProjetsRoom';
import AProposRoom from '../rooms/apropo/AProposRoom';
import ContactRoom from '../rooms/Contact/ContactRoom';
import CertificationRoom from '../rooms/certification/CertificationRoom';
import EngagementSocialRoom from '../rooms/engagement_social/EngagementSocialRoom.jsx';
import LangueRoom from '../rooms/langue/langue.jsx';

// Room configurations
const ROOM_CONFIG = {
    corridorWidth: 2.2,   // Wider "vestibule" feeling
    corridorHeight: 2.4,  // frameHeight - 0.1
    corridorDepth: 2,     // Shorter - quick transition
    roomWidth: 30,
    roomHeight: 20,
    roomDepth: 25
};

// Naturalny kafelek listwy: 1582x94px przy wysokości 0.15 → ~2.524 units szerokości
const NATURAL_TILE_W = (1582 / 94) * 0.15;

/**
 * Mapping from roomId to room component key.
 *
 * 4 doors have real content:
 *   experience  → Studio
 *   education   → Gallery
 *   contact     → Contact
 *   about       → About
 *
 * 2 doors are left empty (generic room with just the label):
 *   certification → (empty)
 *   social        → (empty)
 *
 * Direct teleport IDs also supported: gallery, studio
 */
const ROOM_ID_TO_COMPONENT = {
    'experience': 'langue',
    'langue':     'langue',
    'education':  'gallery',
    'gallery':    'gallery',
    'contact':    'contact',
    'about':      'about',
    'social':     'social',
    'certification': 'certification',
    // teleport direct IDs
    'studio':     'studio',
};

// Fallback: resolve from old label strings (backward compat for teleport)
const LABEL_TO_COMPONENT = {
    'THE GALLERY':            'gallery',
    'THE STUDIO':             'studio',
    'THE ABOUT':              'about',
    "LET'S CONNECT":          'contact',
    'LANGUE':                 'langue',
    'LANGUES':                'langue',
    'MES PROJETS':            'gallery',
    'A PROPOS':               'about',
    'À PROPOS':               'about',
    'ENGAGEMENT ASSOCIATIF':  'certification',
    'ENGAGEMENTS ASSOCIATIFS':'certification',
    'CERTIFICATION':          'social',
    'CERTIFICATIONS':         'social',
    'VIE SOCIALE':            'social',
    'CERTFICATION':           'certification',
    'EXPERIANCE':             'langue',
    'EDUCATION':              'gallery',
    'ABOUTE':                 'about',
    'CONTACT':                'contact',
};

/**
 * RoomInterior Component
 *
 * Memoized room geometry to prevent re-renders and improve performance.
 * Contains corridor + giant room at the end.
 */
const RoomInterior = memo(({ label, roomId, showRoom, onReady, isExiting }) => {
    const { corridorWidth, corridorHeight, corridorDepth, roomWidth, roomHeight, roomDepth } = ROOM_CONFIG;
    const halfDepth = corridorDepth / 2;
    const roomZ = -corridorDepth - roomDepth / 2;

    // Resolve which room component to render based on roomId first, then label fallback
    const resolvedRoom = ROOM_ID_TO_COMPONENT[roomId] || LABEL_TO_COMPONENT[label] || null;

    // Load corridor textures
    const floorTexSrc = useTexture('/textures/corridor/kawalekpodlogi.webp');
    const wallTexSrc = useTexture('/textures/corridor/wall_texture.webp');
    const ceilingTexSrc = useTexture('/textures/corridor/ceiling_texture.webp');
    const bbTexSrc = useTexture('/textures/corridor/texturadoprogow.webp');

    // Memoize textured materials for mini-corridor
    const materials = useMemo(() => {
        // Floor
        const floorTex = floorTexSrc.clone();
        floorTex.needsUpdate = true;
        floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);

        // Left wall
        const wallTexL = wallTexSrc.clone();
        wallTexL.needsUpdate = true;
        wallTexL.wrapS = wallTexL.wrapT = THREE.RepeatWrapping;
        wallTexL.repeat.set(corridorDepth / 2, corridorHeight / 2);

        // Right wall (same settings)
        const wallTexR = wallTexSrc.clone();
        wallTexR.needsUpdate = true;
        wallTexR.wrapS = wallTexR.wrapT = THREE.RepeatWrapping;
        wallTexR.repeat.set(corridorDepth / 2, corridorHeight / 2);

        // Ceiling
        const ceilTex = ceilingTexSrc.clone();
        ceilTex.needsUpdate = true;
        ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
        ceilTex.repeat.set(corridorDepth / 2.5, corridorWidth / 2.5);

        // Baseboard left
        const bbLeft = bbTexSrc.clone();
        bbLeft.needsUpdate = true;
        bbLeft.wrapS = bbLeft.wrapT = THREE.RepeatWrapping;
        bbLeft.repeat.set(corridorDepth / NATURAL_TILE_W, 1);

        // Baseboard right
        const bbRight = bbTexSrc.clone();
        bbRight.needsUpdate = true;
        bbRight.wrapS = bbRight.wrapT = THREE.RepeatWrapping;
        bbRight.repeat.set(corridorDepth / NATURAL_TILE_W, 1);

        return {
            corridorFloor: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: floorTex, side: THREE.DoubleSide }),
            corridorWallL: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: wallTexL, side: THREE.DoubleSide }),
            corridorWallR: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: wallTexR, side: THREE.DoubleSide }),
            corridorCeiling: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: ceilTex, side: THREE.DoubleSide }),
            bbLeft: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: bbLeft, side: THREE.DoubleSide }),
            bbRight: new THREE.MeshBasicMaterial({ color: '#e0e0e0',  map: bbRight, side: THREE.DoubleSide }),
            threshold: new THREE.MeshBasicMaterial({ color: '#e0e0e0', 
                map: (() => {
                    const t = bbTexSrc.clone();
                    t.needsUpdate = true;
                    t.wrapS = t.wrapT = THREE.RepeatWrapping;
                    t.repeat.set(corridorWidth / NATURAL_TILE_W, 1);
                    return t; })(),

                side: THREE.DoubleSide
            }),
            // Room materials (flat - for rooms that have their own content)
            roomFloor: new THREE.MeshBasicMaterial({ color: '#e5e5e5', side: THREE.DoubleSide }),
            roomCeiling: new THREE.MeshBasicMaterial({ color: '#fafafa', side: THREE.DoubleSide }),
            roomWall: new THREE.MeshBasicMaterial({ color: '#f0f0f0', side: THREE.DoubleSide }),
            roomBackWall: new THREE.MeshBasicMaterial({ color: '#f5f5f5', side: THREE.DoubleSide }),
        };
    }, [floorTexSrc, wallTexSrc, ceilingTexSrc, bbTexSrc]);

    // Memoize geometries
    const geometries = useMemo(() => ({
        corridorSideWall: new THREE.PlaneGeometry(corridorDepth, corridorHeight),
        corridorFloorCeiling: new THREE.PlaneGeometry(corridorWidth, corridorDepth),
        corridorBaseboard: new THREE.PlaneGeometry(corridorDepth, 0.15),
        threshold: new THREE.PlaneGeometry(corridorWidth, 0.15),
        roomFloorCeiling: new THREE.PlaneGeometry(roomWidth, roomDepth),
        roomSideWall: new THREE.PlaneGeometry(roomDepth, roomHeight),
        roomBackWall: new THREE.PlaneGeometry(roomWidth, roomHeight)
    }), []);

    // Trigger onReady for generic/empty rooms (no special component to fire it)
    useEffect(() => {
        if (showRoom && !resolvedRoom) {
            onReady?.();
        }
    }, [showRoom, resolvedRoom, onReady]);

    return (
        <group position={[0, -0.149, 0]}>
            {/* === CORRIDOR (The "Mini-Corridor" Transition) === */}
            {/* Left wall */}
            <mesh
                position={[-corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWallL}
            />

            {/* Right wall */}
            <mesh
                position={[corridorWidth / 2, 0, -halfDepth]}
                rotation={[0, -Math.PI / 2, 0]}
                geometry={geometries.corridorSideWall}
                material={materials.corridorWallR}
            />

            {/* Floor */}
            <mesh
                position={[0, -corridorHeight / 2, -halfDepth]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorFloor}
            />

            {/* Ceiling */}
            <mesh
                position={[0, corridorHeight / 2, -halfDepth]}
                rotation={[Math.PI / 2, 0, 0]}
                geometry={geometries.corridorFloorCeiling}
                material={materials.corridorCeiling}
            />

            {/* Baseboard Left */}
            <mesh
                position={[-corridorWidth / 2 + 0.01, -corridorHeight / 2 + 0.075, -halfDepth]}
                rotation={[0, Math.PI / 2, 0]}
                geometry={geometries.corridorBaseboard}
                material={materials.bbLeft}
            />

            {/* Baseboard Right */}
            <mesh
                position={[corridorWidth / 2 - 0.01, -corridorHeight / 2 + 0.075, -halfDepth]}
                rotation={[0, -Math.PI / 2, 0]}
                geometry={geometries.corridorBaseboard}
                material={materials.bbRight}
            />

            {/* === THRESHOLD (End of Mini-Corridor) === */}
            <mesh
                position={[0, -corridorHeight / 2 + 0.005, -corridorDepth]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={geometries.threshold}
                material={materials.threshold}
            />

            {/* === ROOM CONTENT === */}
            {showRoom && (
                <group>
                    {resolvedRoom === 'gallery' ? (
                        // === GALLERY ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <MesProjetsRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : resolvedRoom === 'langue' ? (
                        // === LANGUE ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <LangueRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : resolvedRoom === 'about' ? (
                        // === ABOUT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <AProposRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : resolvedRoom === 'social' ? (
                        // === SOCIAL ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <CertificationRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : resolvedRoom === 'certification' ? (
                        // === CERTIFICATION ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <EngagementSocialRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : resolvedRoom === 'contact' ? (
                        // === CONTACT ROOM ===
                        <group position={[0, -0.5, -corridorDepth]}>
                            <Suspense fallback={null}>
                                <ContactRoom showRoom={showRoom} onReady={onReady} isExiting={isExiting} />
                            </Suspense>
                        </group>
                    ) : (
                        // === EMPTY ROOM (room without content) ===
                        <group position={[0, roomHeight / 2 - corridorHeight / 2, roomZ]}>
                            {/* Floor */}
                            <mesh
                                position={[0, -roomHeight / 2, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomFloor}
                            />

                            {/* Floor grid */}
                            <gridHelper
                                args={[Math.min(roomWidth, roomDepth), 20, '#cccccc', '#dddddd']}
                                position={[0, -roomHeight / 2 + 0.01, 0]}
                            />

                            {/* Ceiling */}
                            <mesh
                                position={[0, roomHeight / 2, 0]}
                                rotation={[Math.PI / 2, 0, 0]}
                                geometry={geometries.roomFloorCeiling}
                                material={materials.roomCeiling}
                            />

                            {/* Back wall */}
                            <mesh
                                position={[0, 0, -roomDepth / 2]}
                                geometry={geometries.roomBackWall}
                                material={materials.roomBackWall}
                            />

                            {/* Left wall */}
                            <mesh
                                position={[-roomWidth / 2, 0, 0]}
                                rotation={[0, Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Right wall */}
                            <mesh
                                position={[roomWidth / 2, 0, 0]}
                                rotation={[0, -Math.PI / 2, 0]}
                                geometry={geometries.roomSideWall}
                                material={materials.roomWall}
                            />

                            {/* Door label as title — will be replaced by real content later */}
                            <Text
                                position={[0, 2, -roomDepth / 2 + 2]}
                                fontSize={4}
                                color="#1a1a1a"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.8}
                                textAlign="center"
                            >
                                {label}
                            </Text>

                            {/* Coming soon subtitle */}
                            <Text
                                position={[0, -1, -roomDepth / 2 + 2]}
                                fontSize={0.8}
                                color="#999999"
                                anchorX="center"
                                anchorY="middle"
                                maxWidth={roomWidth * 0.7}
                                textAlign="center"
                            >
                                Coming soon...
                            </Text>
                        </group>
                    )}
                </group>
            )}
        </group>
    );
});

RoomInterior.displayName = 'RoomInterior';

export default RoomInterior;
