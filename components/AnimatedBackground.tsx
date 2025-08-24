
import React from 'react';

const AnimatedBackground: React.FC = () => {
    const particleCount = 70;

    return (
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10" aria-hidden="true">
            <div className="particles">
                {Array.from({ length: particleCount }).map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
            <style>{`
                .particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                .particle {
                    position: absolute;
                    background-color: rgba(88, 166, 255, 0.4);
                    border-radius: 50%;
                    animation: move linear infinite;
                    box-shadow: 0 0 5px rgba(88, 166, 255, 0.6);
                }
                @keyframes move {
                    0% {
                        transform: translateY(var(--y-start)) translateX(var(--x-start));
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(var(--y-end)) translateX(var(--x-end));
                        opacity: 0;
                    }
                }
            `}</style>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        document.querySelectorAll('.particle').forEach(p => {
                            const startX = Math.random() * 100;
                            const startY = -10;
                            const endY = 110;
                            const endX = startX + (Math.random() - 0.5) * 20;

                            p.style.setProperty('--x-start', startX + 'vw');
                            p.style.setProperty('--y-start', startY + 'vh');
                            p.style.setProperty('--x-end', endX + 'vw');
                            p.style.setProperty('--y-end', endY + 'vh');

                            const size = Math.random() * 2 + 1;
                            p.style.width = size + 'px';
                            p.style.height = size + 'px';
                            p.style.animationDuration = (Math.random() * 8 + 5) + 's';
                            p.style.animationDelay = (Math.random() * -13) + 's';
                        });
                    `
                }}
            />
        </div>
    );
};

export default AnimatedBackground;