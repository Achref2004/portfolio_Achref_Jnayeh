import { useScene } from '../../context/SceneContext';
import '../../styles/ScreenReaderOverlay.scss';

/**
 * ScreenReaderOverlay — A7 Accessibility
 * 
 * Invisible HTML layer providing screen reader access to 3D canvas content.
 * Contains buttons/links matching interactive 3D elements (doors, rooms).
 * Visually hidden via .sr-only but fully accessible to assistive tech.
 */
const ScreenReaderOverlay = () => {
    const { hasEntered, isInRoom, currentRoom, teleportTo, requestExit } = useScene();

    return (
        <div className="sr-overlay" role="complementary" aria-label="Accessible navigation for 3D portfolio">
            {/* Skip to content link */}
            <a href="#sr-main-nav" className="sr-only sr-focusable">
                Skip to accessible navigation
            </a>

            {/* Main accessible navigation */}
            <nav id="sr-main-nav" className="sr-only" aria-label="Portfolio rooms">
                <h1>Achref — Creative Developer Portfolio</h1>
                <h2>Portfolio Navigation</h2>

                {!hasEntered && (
                    <p>Bienvenue dans le portfolio 3D interactif d’Achref. Cliquez ou appuyez sur Entrée sur les portes pour commencer.</p>
                )}

                {hasEntered && !isInRoom && (
                    <>
                        <p>Vous êtes dans le couloir. Choisissez une pièce à explorer :</p>
                        <ul>
                            <li>
                                <button onClick={() => teleportTo('about')} type="button">
                                    À propos — Mon histoire, mes compétences et mon parcours
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('gallery')} type="button">
                                    Galerie — Mes projets et mon travail
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('contact')} type="button">
                                    Contact — Contactez-moi
                                </button>
                            </li>
                            <li>
                                <button onClick={() => teleportTo('studio')} type="button">
                                    Studio — Technologies et expérience
                                </button>
                            </li>
                        </ul>
                    </>
                )}

                {hasEntered && isInRoom && (
                    <>
                        <p>
                            Vous êtes dans la pièce {currentRoom === 'about' ? 'À propos' :
                                currentRoom === 'gallery' ? 'Galerie' :
                                    currentRoom === 'contact' ? 'Contact' :
                                        currentRoom === 'studio' ? 'Studio' : currentRoom}.
                        </p>
                        <button onClick={requestExit} type="button">
                            Retour au couloir
                        </button>

                        {/* Room-specific content descriptions */}
                        {currentRoom === 'about' && (
                            <div aria-label="Contenu de la pièce À propos">
                                <h3>À propos</h3>
                                <p>Cette pièce présente mon histoire, mes récompenses, les étapes clés de mon parcours et mes compétences techniques sous forme de ballons interactifs.</p>
                            </div>
                        )}
                        {currentRoom === 'gallery' && (
                            <div aria-label="Contenu de la pièce Galerie">
                                <h3>Mes projets</h3>
                                <p>Parcourez mes projets de portfolio affichés sur des cartes en papier. Cliquez sur une carte pour voir les détails et visiter le site.</p>
                            </div>
                        )}
                        {currentRoom === 'contact' && (
                            <div aria-label="Contenu de la pièce Contact">
                                <h3>Contact</h3>
                                <p>Trouvez mes liens sociaux affichés dans des fûts flottants. Cliquez pour visiter mon LinkedIn, mon GitHub et mes autres profils.</p>
                            </div>
                        )}
                        {currentRoom === 'studio' && (
                            <div aria-label="Contenu de la pièce Studio">
                                <h3>Studio</h3>
                                <p>Explorez mon expérience et mes compétences sur des écrans qui tournent. Cliquez sur un écran pour lire des informations détaillées sur mon travail.</p>
                            </div>
                        )}

                        {/* Quick navigation to other rooms */}
                        <h3>Navigation rapide</h3>
                        <ul>
                            {currentRoom !== 'about' && (
                                <li><button onClick={() => teleportTo('about')} type="button">Aller à À propos</button></li>
                            )}
                            {currentRoom !== 'gallery' && (
                                <li><button onClick={() => teleportTo('gallery')} type="button">Aller à Galerie</button></li>
                            )}
                            {currentRoom !== 'contact' && (
                                <li><button onClick={() => teleportTo('contact')} type="button">Aller à Contact</button></li>
                            )}
                            {currentRoom !== 'studio' && (
                                <li><button onClick={() => teleportTo('studio')} type="button">Aller à Studio</button></li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* Live region for state changes */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isInRoom && `Entered ${currentRoom} room`}
            </div>
        </div>
    );
};

export default ScreenReaderOverlay;
