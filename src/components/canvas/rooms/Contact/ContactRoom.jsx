import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const ContactCard = ({ texture, hoverTexture, position, size, onClick, label }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <mesh
            position={position}
            renderOrder={2}
            onPointerOver={(event) => {
                event.stopPropagation();
                setIsHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                setIsHovered(false);
                document.body.style.cursor = 'default';
            }}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
        >
            <planeGeometry args={size} />
            <meshBasicMaterial
                map={isHovered ? hoverTexture : texture}
                transparent
                depthTest={false}
                toneMapped={false}
            />
        </mesh>
    );
};

const ContactRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
    const { scene } = useThree();
    const [showCards, setShowCards] = useState(false);
    const [backgroundTexture, gitTexture, messageTexture, linkTexture, gitHoverTexture, messageHoverTexture, linkHoverTexture] = useTexture([
        '/textures/contact/contact.png',
        '/textures/contact/git.png',
        '/textures/contact/message.png',
        '/textures/contact/link.png',
        '/textures/contact/gitcol.png',
        '/textures/contact/messagecol.png',
        '/textures/contact/linkcol.png'
    ]);

    const clickableCards = [
        {
            label: 'GitHub',
            texture: gitTexture,
            hoverTexture: gitHoverTexture,
            position: [-10.2, -4.5, -19.8],
            size: [ 7.5, 5.3],
            onClick: () => window.open('https://github.com/Achref2004', '_blank', 'noopener,noreferrer')
        },
        {
            label: 'Message',
            texture: messageTexture,
            hoverTexture: messageHoverTexture,
            position: [0, -4.6, -19.7],
            size: [11.3, 4.5],
            onClick: () => { window.location.href = 'mailto:'; }
        },
        {
            label: 'LinkedIn',
            texture: linkTexture,
            hoverTexture: linkHoverTexture,
            position: [10.2, -5, -19.8],
            size: [8, 5.0],
            onClick: () => window.open('https://www.linkedin.com/in/achref-jnayeh-85a8a533', '_blank', 'noopener,noreferrer')
        }
    ];

    useEffect(() => {
        setShowCards(false);

        if (!showRoom || isWarmup || isExiting) return;

        const timer = setTimeout(() => {
            setShowCards(true);
        }, 1200);

        return () => clearTimeout(timer);
    }, [showRoom, isExiting, isWarmup]);

    useEffect(() => {
        if (isExiting) setShowCards(false);
    }, [isExiting]);

    useEffect(() => {
        backgroundTexture.colorSpace = THREE.SRGBColorSpace;
        [gitTexture, messageTexture, linkTexture, gitHoverTexture, messageHoverTexture, linkHoverTexture].forEach((cardTexture) => {
            cardTexture.colorSpace = THREE.SRGBColorSpace;
        });

        if (showRoom && !isWarmup) {
            scene.background = backgroundTexture;
        }

        onReady?.();

        return () => {
            if (scene.background === backgroundTexture) {
                scene.background = null;
            }
        };
    }, [backgroundTexture, gitHoverTexture, gitTexture, linkHoverTexture, linkTexture, messageHoverTexture, messageTexture, onReady, scene, showRoom, isWarmup]);

    return (
        <>
            {showCards && clickableCards.map((card) => (
                <ContactCard key={card.label} {...card} />
            ))}
        </>
    );
};

export default ContactRoom;
