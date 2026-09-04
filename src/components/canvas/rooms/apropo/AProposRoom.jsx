import React, { useRef, useMemo, useEffect, useState, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';
import { aproposData } from '../../../../data/apropos';

// ============================================
// ⚙️ AUDIO SETTINGS
// ============================================
export const AUDIO_SETTINGS = {
    volume: 0.6,
    distance: 2,
    rolloff: 1.5
};

/**
 * PortfolioCard — Reusable card component for the 6 "À Propos" sections.
 * Each card has: image zone, title, decorative line. All 6 use this exact component.
 */
const PortfolioCard = memo(({ item, index, onClick }) => (
    <button
        type="button"
        className="apropos-card"
        style={{
            animationDelay: `${150 + index * 100}ms`,
        }}
        onClick={onClick}
        aria-label={`Découvrir ${item.title}`}
    >
        {/* Image Zone */}
        <div className="apropos-card__image-zone">
            <img
                src={item.image}
                alt={item.title}
                className="apropos-card__image"
                draggable={false}
                loading="lazy"
            />
        </div>

        {/* Text Zone */}
        <div className="apropos-card__text-zone">
            <h3 className="apropos-card__title">{item.title}</h3>
            <div className="apropos-card__decorator" />
        </div>
    </button>
));
PortfolioCard.displayName = 'PortfolioCard';

/**
 * AProposRoom Component
 * 
 * Displays the "À Propos de Moi" section for Achref Jnayeh.
 * High-end royal aesthetic (#0D2F4F Navy & #D4AF37 Gold) with interactive cards and detail modal.
 */
const AProposRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { scene } = useThree();
    const { isTeleporting } = useScene();
    const { showTutorial, hidePopup } = useAchievements();

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showCards, setShowCards] = useState(false);

    useEffect(() => {
        if (!showRoom || isWarmup) return undefined;

        const previousBackground = scene.background;
        scene.background = new THREE.Color('#ffffff');

        return () => {
            if (scene.background?.isColor && scene.background.getHex() === 0xffffff) {
                scene.background = previousBackground;
            }
        };
    }, [isWarmup, scene, showRoom]);

    const handleSelectItem = useCallback((item, index) => {
        setSelectedItem(item);
        if (typeof index === 'number') {
            setSelectedIndex(index);
        } else {
            const idx = aproposData.findIndex(e => e.id === item.id);
            if (idx !== -1) setSelectedIndex(idx);
        }
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedItem(null);
    }, []);

    const handlePrevCard = useCallback(() => {
        setSelectedIndex((prev) => {
            const nextIdx = (prev - 1 + aproposData.length) % aproposData.length;
            if (selectedItem) {
                setSelectedItem(aproposData[nextIdx]);
            }
            return nextIdx;
        });
    }, [selectedItem]);

    const handleNextCard = useCallback(() => {
        setSelectedIndex((prev) => {
            const nextIdx = (prev + 1) % aproposData.length;
            if (selectedItem) {
                setSelectedItem(aproposData[nextIdx]);
            }
            return nextIdx;
        });
    }, [selectedItem]);

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
            setSelectedItem(null);
            if (isExiting) {
                setShowCards(false);
            }
        }
    }, [isExiting, isTeleporting, hidePopup]);

    // Setup Paint Transition
    const { onBeforeCompile, animatePaint, resetPaint, uniformsData, updateRoomOrigin } = usePaintMaterial({
        dirX: 1.0,
        dirY: 0.0,
        dirZ: 0.1
    });

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
            setSelectedItem(null);
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

    return (
        <group ref={groupRef}>
            <group position={[0, -0.7, -2]}>
                {/* Skybox */}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#ffffff" side={THREE.BackSide} onBeforeCompile={onBeforeCompile} />
                </mesh>

                {/* ======================================================== */}
                {/* 🏛️ HTML SECTION: "À PROPOS DE MOI" (FULLSCREEN 2D)       */}
                {/* ======================================================== */}
                {showCards && (
                    <Html
                        fullscreen
                        calculatePosition={() => [0, 0]}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            transform: 'none',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 25,
                        }}
                        className="apropos-fullscreen-wrapper"
                    >
                        <div className="apropos-fullscreen-container custom-scrollbar">
                            {/* Section Header */}
                            <div className="apropos-gallery__header">
                                {/* Decorative Ornament */}
                                <div className="apropos-gallery__header-ornament">
                                    <span className="apropos-gallery__header-line" />
                                    <div className="apropos-gallery__header-symbols">
                                        <span>✦</span>
                                        <span>◈</span>
                                        <span>✦</span>
                                    </div>
                                    <span className="apropos-gallery__header-line apropos-gallery__header-line--right" />
                                </div>

                                {/* Title */}
                                <h2 className="apropos-gallery__title">
                                    À Propos de Moi
                                </h2>

                                {/* Subtitle */}
                                <p className="apropos-gallery__subtitle">
                                    Achref Jnayeh • Développeur Full-Stack & Creative Developer
                                </p>

                                <div className="apropos-gallery__header-bar" />
                            </div>

                            {/* 6-Card Grid */}
                            <div className="apropos-gallery__grid">
                                {aproposData.map((item, index) => (
                                    <PortfolioCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onClick={() => handleSelectItem(item, index)}
                                    />
                                ))}
                            </div>

                            {/* Detail Modal (Portaled to document.body for true center) */}
                            {selectedItem && typeof document !== 'undefined' && createPortal(
                                <div
                                    className="apropos-modal-overlay"
                                    onClick={handleCloseModal}
                                >
                                    <div className="apropos-modal-container">
                                        {/* Prev Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                                            className="apropos-modal-nav-btn"
                                            aria-label="Section précédente"
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>

                                        {/* Modal Card ("Feuille de description") */}
                                        <div
                                            className="apropos-modal-card custom-scrollbar"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Close Button */}
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="apropos-modal-close"
                                                aria-label="Fermer"
                                            >
                                                ✕
                                            </button>

                                            {/* Image */}
                                            <img
                                                src={selectedItem.image}
                                                alt={selectedItem.title}
                                                className="apropos-modal__image"
                                                draggable={false}
                                            />

                                            {/* Title & Subtitle */}
                                            <h3 className="apropos-modal__title">
                                                {selectedItem.title}
                                            </h3>
                                            <p className="apropos-modal__subtitle">
                                                {selectedItem.subtitle}
                                            </p>

                                            {/* Separator */}
                                            <div className="apropos-modal__separator">
                                                <div className="apropos-modal__separator-line apropos-modal__separator-line--left" />
                                                <span className="apropos-modal__separator-diamond">◈</span>
                                                <div className="apropos-modal__separator-line apropos-modal__separator-line--right" />
                                            </div>

                                            {/* Description */}
                                            <p className="apropos-modal__description">
                                                {selectedItem.fullDetails || selectedItem.description}
                                            </p>

                                            {/* Highlights */}
                                            {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                                                <div className="apropos-modal__highlights">
                                                    <ul>
                                                        {selectedItem.highlights.map((point, pIdx) => (
                                                            <li key={pIdx}>
                                                                <span>✦</span>
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {selectedItem.tags && (
                                                <div className="apropos-modal__tags">
                                                    {selectedItem.tags.map((tag, tIdx) => (
                                                        <span key={tIdx} className="apropos-modal__tag">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                                            className="apropos-modal-nav-btn"
                                            aria-label="Section suivante"
                                        >
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

export default AProposRoom;
