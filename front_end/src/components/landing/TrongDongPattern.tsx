// Trống Đồng (Đông Sơn drum) SVG Pattern Component

export function TrongDongWatermark({className = '', opacity = 0.05}: { className?: string; opacity?: number }) {
    const getPos = (r: number, angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: (200 + r * Math.cos(rad)).toFixed(3),
            y: (200 + r * Math.sin(rad)).toFixed(3)
        };
    };

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            <svg
                viewBox="0 0 400 400"
                className="absolute w-[600px] h-[600px] -right-48 -top-48 text-primary animate-spin-slow"
                style={{opacity, transformOrigin: "center"}}
            >
                <circle cx="200" cy="200" r="195" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="200" cy="200" r="165" fill="none" stroke="currentColor" strokeWidth="1"/>
                
                <g>
                    {Array.from({length: 36}).map((_, i) => {
                        const p1 = getPos(150, i * 10);
                        const p2 = getPos(165, i * 10 + 5);
                        const p3 = getPos(150, i * 10 + 10);
                        return (
                            <path
                                key={`wave-${i}`}
                                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                            />
                        );
                    })}
                </g>
                
                <circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" strokeWidth="1"/>
                <circle cx="200" cy="200" r="115" fill="none" stroke="currentColor" strokeWidth="2"/>
                
                {Array.from({length: 12}).map((_, i) => (
                    <g key={`bird-${i}`} transform={`rotate(${i * 30} 200 200)`}>
                        <path
                            d="M 200 80 Q 210 95 200 110 Q 190 95 200 80"
                            fill="currentColor"
                            opacity="0.7"
                        />
                        <line x1="200" y1="70" x2="200" y2="115" stroke="currentColor" strokeWidth="0.5"/>
                    </g>
                ))}
                
                <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="1"/>
                
                {Array.from({length: 16}).map((_, i) => (
                    <rect
                        key={`diamond-${i}`}
                        x="195"
                        y="130"
                        width="10"
                        height="10"
                        transform={`rotate(${(i * 22.5).toFixed(1)} 200 200) rotate(45 200 135)`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.75"
                    />
                ))}
                
                <circle cx="200" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="200" cy="200" r="45" fill="none" stroke="currentColor" strokeWidth="1"/>
                
                {Array.from({length: 16}).map((_, i) => (
                    <line
                        key={`ray-${i}`}
                        x1="200"
                        y1="155"
                        x2="200"
                        y2="175"
                        transform={`rotate(${(i * 22.5).toFixed(1)} 200 200)`}
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                ))}
                
                <circle cx="200" cy="200" r="25" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="200" cy="200" r="15" fill="currentColor" opacity="0.3"/>
                <circle cx="200" cy="200" r="8" fill="currentColor" opacity="0.5"/>
            </svg>
        </div>
    );
}

export function TrongDongDivider({className = ''}: { className?: string }) {
    return (
        <div className={`w-full flex items-center justify-center py-8 ${className}`}>
            <svg viewBox="0 0 800 60" className="w-full max-w-4xl h-12 text-primary/10">
                <line x1="0" y1="30" x2="280" y2="30" stroke="currentColor" strokeWidth="1"/>
                <g transform="translate(400, 30)">
                    <circle r="25" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <circle r="18" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <circle r="10" fill="none" stroke="currentColor" strokeWidth="0.75"/>
                    <circle r="4" fill="currentColor" opacity="0.5"/>
                    {Array.from({length: 8}).map((_, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1="-12"
                            x2="0"
                            y2="-18"
                            transform={`rotate(${i * 45})`}
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    ))}
                </g>
                <line x1="520" y1="30" x2="800" y2="30" stroke="currentColor" strokeWidth="1"/>
                <circle cx="300" cy="30" r="3" fill="currentColor" opacity="0.5"/>
                <circle cx="500" cy="30" r="3" fill="currentColor" opacity="0.5"/>
            </svg>
        </div>
    );
}

export default TrongDongWatermark;
