import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';
import EngagementCard, { renderMainIcon, renderBottomIcon } from '../../../EngagementCard';
import { engagements } from '../../../../data/engagements';

// ============================================
// ⚙️ AUDIO SETTINGS
// ============================================
export const AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 1.5
};

// Scenery crop
const RIGHT_CROP_AMOUNT = 0.2;

const EngagementSocialRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { isTeleporting } = useScene();
    const { showTutorial, hidePopup } = useAchievements();

    const [selectedEngagement, setSelectedEngagement] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showCards, setShowCards] = useState(false);

    const handleSelectCard = useCallback((item, index) => {
        setSelectedEngagement(item);
        if (typeof index === 'number') {
            setSelectedIndex(index);
        } else {
            const idx = engagements.findIndex(e => e.id === item.id);
            if (idx !== -1) setSelectedIndex(idx);
        }
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedEngagement(null);
    }, []);

    const handlePrevCard = useCallback(() => {
        setSelectedIndex((prev) => {
            const nextIdx = (prev - 1 + engagements.length) % engagements.length;
            if (selectedEngagement) {
                setSelectedEngagement(engagements[nextIdx]);
            }
            return nextIdx;
        });
    }, [selectedEngagement]);

    const handleNextCard = useCallback(() => {
        setSelectedIndex((prev) => {
            const nextIdx = (prev + 1) % engagements.length;
            if (selectedEngagement) {
                setSelectedEngagement(engagements[nextIdx]);
            }
            return nextIdx;
        });
    }, [selectedEngagement]);

    // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            } else if (e.key === 'ArrowLeft') {
                handlePrevCard();
            } else if (e.key === 'ArrowRight') {
                handleNextCard();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCloseModal, handlePrevCard, handleNextCard]);

    const groupRef = useRef();

    useEffect(() => {
        if (isExiting || isTeleporting) {
            hidePopup();
            setSelectedEngagement(null);
            if (isExiting) {
                setShowCards(false);
            }
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Setup Paint Transition
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial();

    // Track if user teleported into this room 
    const wasTeleportedRef = useRef(false);
    useEffect(() => {
        if (isTeleporting) wasTeleportedRef.current = true;
    }, [isTeleporting]);

    useEffect(() => {
        if (showRoom && !isWarmup) {
            if (wasTeleportedRef.current || isTeleporting) {
                uniformsData.uPaintProgress.value = 1.0;
                setShowCards(true);
            } else {
                setShowCards(false);
                resetPaint();
                animatePaint(0.2, 2.5);
                // Delay showing cards until camera enters room (2.2s door animation + fly-in)
                const timer = setTimeout(() => {
                    setShowCards(true);
                }, 2200);
                return () => clearTimeout(timer);
            }
        } else {
            uniformsData.uPaintProgress.value = 1.0;
            setShowCards(false);
            setSelectedEngagement(null);
        }
    }, [showRoom, isWarmup, isTeleporting]);

    // Track if we've signaled ready
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

    // --- GEOMETRY & MATERIALS ---
    const housesTexture = useTexture('/textures/gallery/sahra.png');
    const arcTexture = useTexture('/textures/gallery/arc.png');

    return (
        <group ref={groupRef}>
            <group position={[0, -0.7, -2]}>
                {/* === SCENERY LAYERS === */}
                {/* Houses - center */}
                <mesh position={[0.25, 0.2, -6]} scale={[1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={housesTexture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        onBeforeCompile={onBeforeCompile}
                    />
                </mesh>
                {/* Houses - left side */}
                <mesh position={[-15, -0.75, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#dadada"
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
                />

                {/* Background arch */}
                <mesh position={[0.5, 2.95, -11.5]} scale={[1.18, 1.08, 10]}>
                    <planeGeometry args={[26, 12]} />
                    <meshBasicMaterial
                        map={arcTexture}
                        transparent
                        alphaTest={0.05}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Skybox */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#ffffff" side={THREE.BackSide} onBeforeCompile={onBeforeCompile} />
                </mesh>

                {/* ======================================================== */}
                {/* 🏛️ HTML SECTION: "MES ENGAGEMENTS ASSOCIATIFS"             */}
                {/* ======================================================== */}
                {showCards && (
                    <Html
                        center
                        position={[0, 2.35, -3.2]}
                        style={{
                            width: '92vw',
                            maxWidth: '1240px',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div className="relative w-full flex flex-col items-center justify-center p-2 sm:p-3 max-h-[86vh] overflow-y-auto custom-scrollbar">
                            {/* Section Header */}
                            <div className="flex flex-col items-center text-center mb-5 sm:mb-6 animate-fade-in-up">
                                {/* Decorative Arch & Diamond Ornament */}
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <span className="h-[1px] w-8 sm:w-14 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                                    <div className="flex items-center gap-1.5 text-[#D4AF37]">
                                        <span className="text-xs">✦</span>
                                        <span className="text-sm font-serif">◈</span>
                                        <span className="text-xs">✦</span>
                                    </div>
                                    <span className="h-[1px] w-8 sm:w-14 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                                </div>

                                {/* Section Title */}
                                <h2 className="text-[#0D2F4F] font-serif font-bold text-xl sm:text-2xl md:text-3xl tracking-wider drop-shadow-sm">
                                    Mes Engagements Associatifs
                                </h2>

                                {/* Subtitle / Hint */}
                                <p className="text-[#5E6A73] text-[11px] sm:text-xs tracking-widest uppercase mt-1 font-sans font-medium">
                                    Cliquez sur une carte pour découvrir les détails
                                </p>

                                <div className="w-16 h-[2px] bg-[#D4AF37]/50 rounded-full mt-2.5" />
                            </div>

                            {/* 6-Cards Row with Left/Right Extremity Navigation Buttons */}
                            <div className="w-full flex items-center justify-center gap-2 sm:gap-3.5 max-w-[1240px]">
                                {/* Left Extremity Button */}
                                <button
                                    type="button"
                                    onClick={handlePrevCard}
                                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/50 
                                               shadow-[0_4px_12px_rgba(13,47,79,0.08)] hover:shadow-[0_6px_20px_rgba(13,47,79,0.18)]
                                               text-[#0D2F4F] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:scale-110 
                                               flex items-center justify-center transition-all duration-300 cursor-pointer select-none active:scale-95"
                                    aria-label="Carte précédente"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>

                                {/* Compact 6-Cards Responsive Grid */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 xl:gap-2.5 items-stretch">
                                    {engagements.map((item, index) => (
                                        <div key={item.id} className="h-full flex min-h-[160px] sm:min-h-[175px]">
                                            <EngagementCard
                                                title={item.title}
                                                description={item.description}
                                                icon={item.icon}
                                                bottomIcon={item.bottomIcon}
                                                index={index}
                                                onClick={() => handleSelectCard(item, index)}
                                                isSelected={(selectedEngagement ? selectedEngagement.id === item.id : selectedIndex === index)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Right Extremity Button */}
                                <button
                                    type="button"
                                    onClick={handleNextCard}
                                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/50 
                                               shadow-[0_4px_12px_rgba(13,47,79,0.08)] hover:shadow-[0_6px_20px_rgba(13,47,79,0.18)]
                                               text-[#0D2F4F] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:scale-110 
                                               flex items-center justify-center transition-all duration-300 cursor-pointer select-none active:scale-95"
                                    aria-label="Carte suivante"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>

                            {/* ======================================================= */}
                            {/* 🌟 DETAIL MODAL PLAQUE (Shown on Card Click)            */}
                            {/* ======================================================= */}
                            {selectedEngagement && typeof document !== 'undefined' && createPortal(
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D2F4F]/40 backdrop-blur-sm animate-fade-in-up"
                                    onClick={handleCloseModal}
                                >
                                    <div className="relative w-full max-w-xl flex items-center justify-center gap-2 sm:gap-4">
                                        {/* Modal Left Extremity Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                                            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/60 
                                                       text-[#0D2F4F] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:scale-110 
                                                       flex items-center justify-center shadow-lg transition-all active:scale-95"
                                            aria-label="Engagement précédent"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>

                                        {/* Modal Plaque Card */}
                                        <div
                                            className="relative flex-1 max-w-md bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 
                                                       border border-[#D4AF37]/60 shadow-[0_25px_60px_-10px_rgba(13,47,79,0.3)]
                                                       flex flex-col items-center text-center select-none"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Close Button */}
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#D4AF37]/40 
                                                           text-[#0D2F4F] flex items-center justify-center hover:bg-[#FAF7F2] 
                                                           hover:border-[#D4AF37] hover:scale-105 transition-all text-sm font-bold shadow-sm"
                                                aria-label="Fermer"
                                            >
                                                ✕
                                            </button>

                                            {/* Top Arch Decoration */}
                                            <div className="w-16 h-6 flex items-center justify-center mb-1">
                                                <svg className="w-16 h-6 text-[#D4AF37]/60" viewBox="0 0 64 24" fill="none">
                                                    <path
                                                        d="M2 22 C14 22 18 4 32 2 C46 4 50 22 62 22"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                    />
                                                    <circle cx="32" cy="2" r="1.6" fill="#D4AF37" />
                                                </svg>
                                            </div>

                                            {/* Main Icon in Circle */}
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center 
                                                            shadow-[0_4px_16px_rgba(13,47,79,0.08)] border border-[#D4AF37]/40 mb-3">
                                                {renderMainIcon(selectedEngagement.icon)}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-[#0D2F4F] font-serif font-bold text-lg sm:text-xl tracking-wide px-4">
                                                {selectedEngagement.title}
                                            </h3>

                                            {/* Golden Separator with Diamond */}
                                            <div className="w-48 flex items-center justify-center my-3.5 gap-2">
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />
                                                <span className="text-[#D4AF37] text-xs transform rotate-45 select-none">
                                                    ◆
                                                </span>
                                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />
                                            </div>

                                            {/* Full Description */}
                                            <p className="text-[#5E6A73] font-sans text-sm sm:text-[14.5px] leading-relaxed text-center px-2 py-1">
                                                {selectedEngagement.description}
                                            </p>

                                            {/* Bottom Motif */}
                                            <div className="mt-5 pt-3 w-full flex items-center justify-center border-t border-[#D4AF37]/20 text-[#D4AF37]">
                                                {renderBottomIcon(selectedEngagement.bottomIcon)}
                                            </div>
                                        </div>

                                        {/* Modal Right Extremity Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                                            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D4AF37]/60 
                                                       text-[#0D2F4F] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:scale-110 
                                                       flex items-center justify-center shadow-lg transition-all active:scale-95"
                                            aria-label="Engagement suivant"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    </Html>
                )}
            </group>
        </group>
    );
};

// Component to handle the cropped right-side houses
const RightSideHouses = ({ texture, baseWidth, baseHeight, cropAmount }) => {
    const croppedTexture = useMemo(() => {
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
            <meshBasicMaterial color="#e0e0e0"
                map={croppedTexture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default EngagementSocialRoom;
